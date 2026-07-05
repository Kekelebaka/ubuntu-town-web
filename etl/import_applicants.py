#!/usr/bin/env python3
"""
import_applicants.py — read the Mailchimp/assessment applicant pack (xlsx),
dedupe, and map it onto the canonical `applications` (+ `towns` upsert) target
tables from 0001_ubuntu_town_core.sql.

Source workbook: /agent/stored_files/..._ubuntu_town_mailchimp_assessment_pack.xlsx
  - Candidate_Assessment   (46 rows) — one row per (candidate, town) application,
                             the richest source: scores, sub-scores, form answers.
  - Town_Assessment        (34 rows) — one row per town: aggregate stats +
                             TOWNSTATUS, used to upsert `towns` rows/town_status.
  - Mailchimp_Clean_Upload (43 rows) — one row per EMAIL (deduped upstream by
                             the pack's own logic), carries PHONE/WHATSAPP and
                             `ALL_TOWN_APPS` / `DUPLICATE_COUNT`, which is the
                             evidence trail that some candidates legitimately
                             applied to MULTIPLE towns.

Key data-quality finding (see README "Duplicate reconciliation" section):
  Candidate_Assessment has 46 rows but only 43 distinct emails — 2 emails
  repeat (magautamapheleba6@gmail.com x3 towns; jililiesona7@gmail.com x2
  towns). These are NOT accidental duplicates: each repeat has a different
  TOWN and a different SCORE/BAND, i.e. the same person applied to found/lead
  multiple towns and was assessed separately for each. Mailchimp_Clean_Upload
  confirms this — it has exactly 43 rows (one per distinct email, matching
  DUPLICATE_COUNT + ALL_TOWN_APPS bookkeeping columns) because Mailchimp needs
  ONE list entry per email address, while our relational `applications` table
  is not so constrained.

  Therefore this script's dedupe key is (email_normalized, town_normalized),
  NOT email alone. Two Candidate_Assessment rows with the same email but
  different towns become two separate `applications` rows (this matches the
  brief's "dedupe by email+town" instruction exactly). If a genuine duplicate
  slips in — same email AND same town appearing twice — we keep the row with
  the higher SCORE and log the dropped row to reports/applicants_dupes.json,
  because a re-assessment/correction should supersede an earlier attempt
  rather than being silently averaged or summed.

  We use Candidate_Assessment as the primary source (it has the full form +
  sub-scores) and enrich with PHONE/WHATSAPP from Mailchimp_Clean_Upload by
  email, since phone numbers are not otherwise present. TOWNSTATUS is taken
  from Town_Assessment (authoritative, one row per town) rather than repeated
  per-candidate, but we retain the per-application TOWNSTATUS from
  Candidate_Assessment too, since 0001's `applications.town_status_at_apply`
  wants the status AT THE TIME the candidate applied, which can differ subtly
  from the town's current status if it has since moved (recruit -> pilot etc).

Output:
  staging/applications.jsonl   — one JSON object per canonical `applications`
                                  row, ready for transform.py/load_supabase.py.
  staging/towns_from_xlsx.jsonl — one JSON object per canonical `towns` upsert
                                  row (natural key = slug, built from name).
  reports/applicants_dupes.json — every (email, town) collision + which row won.
  reports/applicants_import_summary.json — counts, band/status distributions.

This script does NOT touch Postgres or D1 — it is pure pandas/openpyxl
transform work, safe to run any number of times, and its outputs feed
load_supabase.py the same way transform.py's D1-derived outputs do.

Usage:
    python import_applicants.py
    python import_applicants.py --xlsx /path/to/other_pack.xlsx
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
import unicodedata
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from config import CONFIG, REPORTS_DIR, STAGING_DIR

# Deterministic UUID namespace for this migration toolkit, so re-running the
# import always produces the SAME uuid for the SAME natural key. This is what
# makes the eventual `ON CONFLICT` upsert in load_supabase.py idempotent even
# though 0001's `id` columns are `uuid default gen_random_uuid()` — we do NOT
# rely on Postgres to generate the id; we compute it here from a stable
# natural key so the same source row always maps to the same target id no
# matter how many times the pipeline runs.
MIGRATION_NAMESPACE = uuid.UUID("6f6f6f6f-7562-746e-7475-6f7331323334")  # arbitrary, fixed, "ubuntu"-ish


def deterministic_uuid(*parts: str) -> str:
    """Build a stable uuid5 from a natural key made of `parts`.

    Using uuid5 (not uuid4) is THE core idempotency mechanism for
    xlsx/D1-sourced rows that don't already have a UUID: the same natural key
    (e.g. "application:email:town") always yields the same UUID, so
    ON CONFLICT (id) DO UPDATE in load_supabase.py behaves as a true upsert
    across repeated runs, instead of inserting duplicate rows with fresh
    random ids each time.
    """
    key = "|".join(parts)
    return str(uuid.uuid5(MIGRATION_NAMESPACE, key))


# ---------------------------------------------------------------------------
# Normalization helpers
# ---------------------------------------------------------------------------

def norm_email(value: Any) -> Optional[str]:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    s = str(value).strip().lower()
    return s or None


def norm_town(value: Any) -> Optional[str]:
    """Normalize a town name for use as a dedupe/matching key: casefold,
    strip whitespace/punctuation variance, collapse internal whitespace.
    Preserves the ORIGINAL string separately for display/town_name_raw.
    """
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    s = unicodedata.normalize("NFKC", str(value)).strip()
    s = re.sub(r"\s+", " ", s)
    return s.lower() or None


def slugify(value: str) -> str:
    s = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s or "town"


def clean_str(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    s = str(value).strip()
    return s or None


def to_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    try:
        return round(float(value), 2)  # matches numeric(5,2) on applications.score
    except (TypeError, ValueError):
        return None


def normalize_phone(value: Any) -> Optional[str]:
    """Normalize South African-style phone numbers to a consistent digits-only
    form (e.g. "084 953 5593" -> "0849535593"). Does NOT attempt full E.164
    conversion (would need to assume +27 for every bare leading-0 number,
    which is a business decision better made explicitly by an operator) —
    just strips formatting noise so the same number in different rows
    compares equal.
    """
    s = clean_str(value)
    if not s:
        return None
    digits = re.sub(r"[^\d+]", "", s)
    return digits or None


# ---------------------------------------------------------------------------
# BAND / TOWNSTATUS -> canonical enum mapping
#
# 0001_ubuntu_town_core.sql defines:
#   application_band: 'A','A-','B','B+','C','C+','D'
#   town_status:      'launch','pilot','support','recruit'
#
# The xlsx BAND column already uses exactly the application_band values
# verbatim (confirmed against both Candidate_Assessment and
# Mailchimp_Clean_Upload: {A, A-, B, B+, C, C+, D}) so BAND needs no mapping
# beyond a strip/uppercase-first-letter normalization safety net.
#
# TOWNSTATUS in the xlsx is a human-readable phrase (e.g.
# "Launch / Interview First", "Pilot / Practical Test", "Support Pool /
# Recruit More", "Recruit More / Hold") that must be mapped down to the
# 4-value town_status enum. Mapping documented explicitly below so it is
# auditable — see MAPPING-style comment.
# ---------------------------------------------------------------------------

VALID_BANDS = {"A", "A-", "B", "B+", "C", "C+", "D"}

# TOWNSTATUS phrase -> town_status enum. Matched by substring/keyword so
# minor wording drift in future pack exports doesn't silently produce NULL.
TOWNSTATUS_MAP: List[Tuple[str, str]] = [
    ("launch", "launch"),      # "Launch / Interview First"
    ("pilot", "pilot"),        # "Pilot / Practical Test"
    ("support", "support"),    # "Support Pool / Recruit More" (checked before "recruit")
    ("recruit", "recruit"),    # "Recruit More / Hold"
]


def map_town_status(raw: Any) -> Optional[str]:
    s = clean_str(raw)
    if not s:
        return None
    low = s.lower()
    for needle, enum_value in TOWNSTATUS_MAP:
        if needle in low:
            return enum_value
    return None  # unmapped phrase -> leave NULL rather than guess; logged in summary


def map_band(raw: Any) -> Optional[str]:
    s = clean_str(raw)
    if not s:
        return None
    s = s.strip().upper().replace("A-", "A-")  # normalize case only; already matches enum
    # Handle the literal enum values case-insensitively.
    for candidate in VALID_BANDS:
        if s == candidate.upper():
            return candidate
    return None


# ROLETRACK / ECOSYSTEM / etc. flow straight into applications.role_track /
# applications.ecosystem_fit as free text per 0001 (both are plain `text`
# columns, no enum) — no mapping needed, just clean_str().


# ---------------------------------------------------------------------------
# Sheet loaders
# ---------------------------------------------------------------------------

def load_sheet(xlsx_path: str, sheet_name: str) -> pd.DataFrame:
    df = pd.read_excel(xlsx_path, sheet_name=sheet_name, engine="openpyxl")
    # Drop fully-empty trailing columns/rows that openpyxl sometimes carries
    # over from a sheet's used-range metadata.
    df = df.dropna(axis="columns", how="all")
    df = df.dropna(axis="index", how="all")
    return df


def load_candidate_assessment(xlsx_path: str) -> pd.DataFrame:
    df = load_sheet(xlsx_path, "Candidate_Assessment")
    # A genuinely empty row has no EMAIL and no FULLNAME; filter those out
    # (openpyxl/pandas can leave stray blank rows within the used range).
    df = df[df["EMAIL"].notna() | df["FULLNAME"].notna()]
    return df


def load_town_assessment(xlsx_path: str) -> pd.DataFrame:
    df = load_sheet(xlsx_path, "Town_Assessment")
    df = df[df["TOWN"].notna()]
    return df


def load_mailchimp_clean(xlsx_path: str) -> pd.DataFrame:
    df = load_sheet(xlsx_path, "Mailchimp_Clean_Upload")
    df = df[df["EMAIL"].notna()]
    return df


# ---------------------------------------------------------------------------
# Core transform: Candidate_Assessment (+phone enrichment) -> applications
# ---------------------------------------------------------------------------

def build_phone_lookup(mailchimp_df: pd.DataFrame) -> Dict[str, Dict[str, Optional[str]]]:
    """email_normalized -> {phone, whatsapp} from Mailchimp_Clean_Upload.

    This is the only source of phone numbers in the xlsx pack; joined onto
    Candidate_Assessment rows by normalized email.
    """
    lookup: Dict[str, Dict[str, Optional[str]]] = {}
    for _, row in mailchimp_df.iterrows():
        email = norm_email(row.get("EMAIL"))
        if not email:
            continue
        lookup[email] = {
            "phone": normalize_phone(row.get("PHONE")),
            "whatsapp": normalize_phone(row.get("WHATSAPP")),
        }
    return lookup


FORM_ANSWER_COLUMNS = [
    "FORM_WHY_BEST",
    "FORM_14DAY_PLAN",
    "FORM_OPPORTUNITIES",
    "FORM_RISKS",
]

SUB_SCORE_COLUMNS = {
    # xlsx column -> key inside applications.sub_scores jsonb
    "TOWN_FIT": "town_fit",
    "NETWORK_SCORE": "network_score",
    "EXECUTION_SCORE": "execution_score",
    "ECOSYSTEM_SCORE": "ecosystem_score",
    "RELIABILITY_SCORE": "reliability_score",
    "VERIFY_SCORE": "verify_score",
}


def candidate_row_to_application(
    row: "pd.Series",
    phone_lookup: Dict[str, Dict[str, Optional[str]]],
) -> Dict[str, Any]:
    """Map one Candidate_Assessment row -> one canonical `applications` row.

    Column mapping (documented inline; mirrors the MAPPING dict pattern used
    in transform.py for D1 sources, kept local here since this source is
    xlsx-specific and only feeds one target table):

      SUBMISSION_ID        -> submission_id (cast to str; xlsx stores as int)
      FULLNAME              -> full_name
      EMAIL                  -> email (normalized lowercase)
      (phone/whatsapp)       -> phone (joined from Mailchimp_Clean_Upload by email;
                                        applications has no separate whatsapp column,
                                        so whatsapp is preserved under form_answers._whatsapp)
      TOWN                   -> town_name_raw (original string, pre town_id match)
      PROVINCE                -> province
      ROLETRACK                -> role_track
      ECOSYSTEM                 -> ecosystem_fit
      SCORE                      -> score (numeric(5,2))
      BAND                        -> band (application_band enum)
      TOWNSTATUS                    -> town_status_at_apply (mapped via map_town_status)
      TOWN_FIT..VERIFY_SCORE          -> sub_scores jsonb {town_fit, network_score, ...}
      FORM_WHY_BEST.. FORM_RISKS        -> form_answers jsonb {form_why_best, ...}
      CUSTOMPARA, ASSESSFOCUS, NEXTSTEP  -> form_answers jsonb (preserved, not modeled
                                             as first-class columns in 0001)
      CURRENT_TOWN                        -> form_answers._current_town (candidate's
                                             stated current residence town, distinct
                                             from the TOWN they're applying to lead)
      (fixed)                              -> status = 'received' (initial import state;
                                             a human reviewer advances this via the app,
                                             NOT this migration)
      (fixed)                              -> source = 'mailchimp_pack'
      (computed)                           -> town_id = null here; resolved by
                                             transform.py / load_supabase.py against the
                                             `towns` table at load time via town_name_raw
                                             + province (case-insensitive match), since
                                             the real town uuid only exists once
                                             towns_from_xlsx.jsonl / D1 towns have been
                                             loaded. This script does NOT guess town_id.
      (computed)                           -> id = deterministic_uuid("application",
                                             email, town) — the natural key documented
                                             at the top of this file.
    """
    email = norm_email(row.get("EMAIL"))
    town_raw = clean_str(row.get("TOWN"))
    town_key = norm_town(town_raw)
    full_name = clean_str(row.get("FULLNAME")) or "(unknown)"

    phone_info = phone_lookup.get(email, {}) if email else {}

    sub_scores = {}
    for col, key in SUB_SCORE_COLUMNS.items():
        val = to_float(row.get(col))
        if val is not None:
            sub_scores[key] = val

    form_answers: Dict[str, Any] = {}
    for col in FORM_ANSWER_COLUMNS:
        val = clean_str(row.get(col))
        if val:
            form_answers[col.lower()] = val
    for col in ("CUSTOMPARA", "ASSESSFOCUS", "NEXTSTEP", "CURRENT_TOWN"):
        val = clean_str(row.get(col))
        if val:
            form_answers[col.lower()] = val
    if phone_info.get("whatsapp"):
        form_answers["_whatsapp"] = phone_info["whatsapp"]

    # Natural key = (email, town). If email is missing (shouldn't happen per
    # our data-quality scan, but defend anyway) fall back to
    # (full_name, town) so the row still gets a stable id rather than being
    # silently dropped.
    natural_key_parts = ["application", email or f"noemail:{full_name.lower()}", town_key or "noTown"]
    app_id = deterministic_uuid(*natural_key_parts)

    submission_id = row.get("SUBMISSION_ID")
    submission_id_str = None if pd.isna(submission_id) else str(int(submission_id)) if isinstance(submission_id, float) else str(submission_id)

    return {
        "id": app_id,
        "submission_id": submission_id_str,
        "full_name": full_name,
        "email": email,
        "phone": phone_info.get("phone"),
        "town_id": None,  # resolved at load time by matching town_name_raw+province
        "town_name_raw": town_raw,
        "town_name_norm": town_key,  # helper field for load_supabase.py town matching; not a target column
        "province": clean_str(row.get("PROVINCE")),
        "role_track": clean_str(row.get("ROLETRACK")),
        "ecosystem_fit": clean_str(row.get("ECOSYSTEM")),
        "score": to_float(row.get("SCORE")),
        "band": map_band(row.get("BAND")),
        "town_status_at_apply": map_town_status(row.get("TOWNSTATUS")),
        "sub_scores": sub_scores,
        "form_answers": form_answers,
        "status": "received",
        "source": "mailchimp_pack",
        # provenance for audit_logs / debugging — not a 0001 column, stripped
        # before the final INSERT by load_supabase.py but kept in the JSONL
        # for traceability.
        "_source_sheet": "Candidate_Assessment",
        "_natural_key": "|".join(natural_key_parts),
    }


def dedupe_applications(applications: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Dedupe by (email, town) natural key. When two rows collide, keep the
    one with the higher `score` (a later, presumably more complete/accurate
    assessment) and record the loser in the dupes report.

    Rows with DIFFERENT towns for the same email are legitimate multi-town
    applications and are NOT deduped against each other — see module
    docstring.
    """
    best_by_key: Dict[str, Dict[str, Any]] = {}
    dupes_log: List[Dict[str, Any]] = []

    for app in applications:
        key = app["_natural_key"]
        existing = best_by_key.get(key)
        if existing is None:
            best_by_key[key] = app
            continue

        existing_score = existing.get("score") or -1
        new_score = app.get("score") or -1
        winner, loser = (app, existing) if new_score > existing_score else (existing, app)
        best_by_key[key] = winner
        dupes_log.append(
            {
                "natural_key": key,
                "email": app.get("email"),
                "town": app.get("town_name_raw"),
                "kept_submission_id": winner.get("submission_id"),
                "kept_score": winner.get("score"),
                "dropped_submission_id": loser.get("submission_id"),
                "dropped_score": loser.get("score"),
                "reason": "same (email, town) pair; kept higher score as the more recent/accurate assessment",
            }
        )

    return list(best_by_key.values()), dupes_log


# ---------------------------------------------------------------------------
# Town_Assessment -> towns upsert rows
# ---------------------------------------------------------------------------

def town_assessment_row_to_town(row: "pd.Series") -> Dict[str, Any]:
    """Map one Town_Assessment row -> a `towns` upsert row.

    Mapping:
      TOWN                -> name
      (computed)            -> slug = slugify(name) (natural/unique key per 0001's
                               `towns.slug unique not null`)
      PROVINCE               -> province
      TOWNSTATUS                -> status (town_status enum, via map_town_status)
      BEST_CANDIDATES,             -> opportunity_notes (free-text `text` column;
      PRIMARY_ECOSYSTEM,             we fold in the assessment narrative since 0001
      ASSESSMENT_ANGLE                 has no dedicated columns for these xlsx fields)
      CANDIDATES, BEST_SCORE,            -> NOT mapped to town columns (no matching
      AVG_SCORE, EMAIL_SEGMENT               0001 column); preserved only in the
                                              _source_stats debug field, dropped by
                                              load_supabase.py before INSERT. If these
                                              aggregate stats need to persist, they
                                              belong in `town_scores` (see transform.py's
                                              town_heartbeat_scores mapping) — a
                                              municipality/town-assessment origin for
                                              town_scores is a reasonable Phase 4
                                              follow-up, not modeled here to avoid
                                              inventing a fake `period`.
    """
    name = clean_str(row.get("TOWN")) or "(unknown town)"
    province = clean_str(row.get("PROVINCE"))
    slug = slugify(name)
    status = map_town_status(row.get("TOWNSTATUS"))

    notes_parts = []
    primary_eco = clean_str(row.get("PRIMARY_ECOSYSTEM"))
    if primary_eco:
        notes_parts.append(f"Primary ecosystem: {primary_eco}")
    best_candidates = clean_str(row.get("BEST_CANDIDATES"))
    if best_candidates:
        notes_parts.append(f"Best candidates (from assessment pack): {best_candidates}")
    angle = clean_str(row.get("ASSESSMENT_ANGLE"))
    if angle:
        notes_parts.append(angle)

    return {
        "id": deterministic_uuid("town", slug),
        "name": name,
        "slug": slug,
        "province": province or "(unknown)",
        "status": status,
        "opportunity_notes": "\n".join(notes_parts) or None,
        "municipality_id": None,
        "_source_sheet": "Town_Assessment",
        "_source_stats": {
            "candidates": row.get("CANDIDATES"),
            "best_score": to_float(row.get("BEST_SCORE")),
            "avg_score": to_float(row.get("AVG_SCORE")),
            "email_segment": clean_str(row.get("EMAIL_SEGMENT")),
        },
    }


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def write_jsonl(records: List[Dict[str, Any]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False, default=str))
            f.write("\n")


def run_import(xlsx_path: str) -> Dict[str, Any]:
    if not Path(xlsx_path).exists():
        print(f"ERROR: xlsx not found at {xlsx_path}", file=sys.stderr)
        raise SystemExit(2)

    candidate_df = load_candidate_assessment(xlsx_path)
    town_df = load_town_assessment(xlsx_path)
    mailchimp_df = load_mailchimp_clean(xlsx_path)

    phone_lookup = build_phone_lookup(mailchimp_df)

    raw_applications = [
        candidate_row_to_application(row, phone_lookup) for _, row in candidate_df.iterrows()
    ]
    applications, dupes_log = dedupe_applications(raw_applications)

    towns = [town_assessment_row_to_town(row) for _, row in town_df.iterrows()]

    # Cross-check: every distinct town_name_norm referenced by an application
    # should have a corresponding towns row from Town_Assessment. Flag any
    # that don't (these will fail town_id resolution at load time and land in
    # applications with town_id = NULL, town_name_raw preserved for manual
    # follow-up — exactly the behaviour 0001's schema is designed to allow).
    town_slugs = {t["slug"] for t in towns}
    unresolved_towns = sorted(
        {
            app["town_name_raw"]
            for app in applications
            if app.get("town_name_raw") and slugify(app["town_name_raw"]) not in town_slugs
        }
    )

    staging_apps_path = STAGING_DIR / "applications.jsonl"
    staging_towns_path = STAGING_DIR / "towns_from_xlsx.jsonl"
    write_jsonl(applications, staging_apps_path)
    write_jsonl(towns, staging_towns_path)

    dupes_report_path = REPORTS_DIR / "applicants_dupes.json"
    with open(dupes_report_path, "w", encoding="utf-8") as f:
        json.dump({"generated_at": datetime.now(timezone.utc).isoformat(), "dupes": dupes_log}, f, indent=2)

    band_counts: Dict[str, int] = {}
    status_counts: Dict[str, int] = {}
    for app in applications:
        band_counts[app.get("band") or "(none)"] = band_counts.get(app.get("band") or "(none)", 0) + 1
        ts = app.get("town_status_at_apply") or "(unmapped)"
        status_counts[ts] = status_counts.get(ts, 0) + 1

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "xlsx_path": xlsx_path,
        "candidate_assessment_rows_read": len(candidate_df),
        "town_assessment_rows_read": len(town_df),
        "mailchimp_clean_rows_read": len(mailchimp_df),
        "applications_after_dedupe": len(applications),
        "duplicate_pairs_collapsed": len(dupes_log),
        "towns_upserted_from_xlsx": len(towns),
        "unresolved_town_names": unresolved_towns,
        "band_distribution": band_counts,
        "town_status_distribution": status_counts,
        "outputs": {
            "applications_jsonl": str(staging_apps_path),
            "towns_jsonl": str(staging_towns_path),
            "dupes_report": str(dupes_report_path),
        },
    }
    summary_path = REPORTS_DIR / "applicants_import_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    return summary


def print_summary(summary: Dict[str, Any]) -> None:
    print()
    print("=" * 72)
    print("APPLICANTS IMPORT SUMMARY (xlsx -> staging/applications.jsonl)")
    print("=" * 72)
    print(f"Candidate_Assessment rows read : {summary['candidate_assessment_rows_read']}")
    print(f"Town_Assessment rows read      : {summary['town_assessment_rows_read']}")
    print(f"Mailchimp_Clean_Upload rows    : {summary['mailchimp_clean_rows_read']}")
    print(f"Applications after dedupe      : {summary['applications_after_dedupe']}")
    print(f"Duplicate (email,town) pairs   : {summary['duplicate_pairs_collapsed']} collapsed (see reports/applicants_dupes.json)")
    print(f"Towns upserted from Town_Assessment: {summary['towns_upserted_from_xlsx']}")
    if summary["unresolved_town_names"]:
        print(f"WARNING: {len(summary['unresolved_town_names'])} town name(s) referenced by applicants ")
        print("         have no matching Town_Assessment row (town_id will be NULL, town_name_raw kept):")
        for t in summary["unresolved_town_names"]:
            print(f"           - {t}")
    print(f"Band distribution              : {summary['band_distribution']}")
    print(f"Town status distribution       : {summary['town_status_distribution']}")
    print(f"\nOutputs:")
    for k, v in summary["outputs"].items():
        print(f"  {k:<20}: {v}")
    print("=" * 72)
    print()


def main(argv: List[str] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--xlsx",
        type=str,
        default=CONFIG.applicants_xlsx_path,
        help=f"Path to the Mailchimp assessment pack xlsx. Default: {CONFIG.applicants_xlsx_path}",
    )
    args = parser.parse_args(argv)

    summary = run_import(args.xlsx)
    print_summary(summary)
    return 0


if __name__ == "__main__":
    sys.exit(main())
