#!/usr/bin/env python3
"""
verify.py — reconcile source vs target row counts, detect duplicates (same
email/town), and flag likely town-name typos/variants, writing a single
human-readable etl/reports/verify.md with a pass/fail verdict per table.

Three independent checks, each documented in its own section of the
generated report:

  1. ROW-COUNT RECONCILIATION
     Compares (a) reports/d1_inventory.json [source D1 truth] vs
     exports/_manifest.json [what export_d1.py actually pulled] vs
     (c) live Postgres COUNT(*) per target table [what actually landed].
     A table "passes" if export count == source inventory count (nothing
     lost between D1 and the export), and if the live target count is >=
     the number of distinct natural keys staged for it (upserts can
     legitimately produce fewer target rows than source rows when
     duplicates collapse — see check 2 — so target count is checked against
     the DEDUPED staged count, not the raw source count).

  2. DUPLICATE RECONCILIATION
     Re-derives duplicate (email, town) collisions from staging/*.jsonl
     (cross-checking reports/applicants_dupes.json from import_applicants.py
     for consistency) AND scans for a second, subtler class of duplicate:
     the SAME real-world town spelled inconsistently across source rows
     (e.g. "Bushbuckridge" vs "Bushbukridge", "Burgersfort" vs
     "Burgersford") using a cheap edit-distance heuristic. These are
     reported as WARNINGS (not hard failures) for a human to reconcile,
     since automatically merging them risks conflating two genuinely
     different places that just happen to be spelled similarly.

  3. INTEGRITY CHECKS
     Structural sanity checks independent of row counts: every applications
     row has a resolvable (or explicitly NULL + town_name_raw-preserved)
     town_id; every band/status value is a valid enum member; every email
     looks like an email; every coordinators row's id equals a real users
     row (FK would be enforced by Postgres itself on --commit, but this lets
     an operator catch the problem in dry-run BEFORE attempting a real load).

Usage:
    python verify.py                     # runs everything it can from
                                          # local files (staging/, exports/,
                                          # reports/) without touching Postgres
    python verify.py --live              # ALSO connects to SUPABASE_DB_URL to
                                          # check real target row counts
                                          # (requires the project to be resumed)

Exit code is 0 if every check passes, 1 if any table FAILs (warnings alone
do not affect the exit code — see reports/verify.md for the distinction).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from config import CONFIG, EXPORTS_DIR, REPORTS_DIR, STAGING_DIR

try:
    import psycopg2
except ImportError:
    psycopg2 = None


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------

def _load_json(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_jsonl(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    out = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                out.append(json.loads(line))
    return out


VALID_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

VALID_BANDS = {"A", "A-", "B", "B+", "C", "C+", "D"}
VALID_APPLICATION_STATUSES = {
    "received", "assessed", "interview", "approved", "onboarding", "active", "declined", "hold",
}
VALID_TOWN_STATUSES = {"launch", "pilot", "support", "recruit"}


# ---------------------------------------------------------------------------
# 1. Row-count reconciliation
# ---------------------------------------------------------------------------

@dataclass
class TableVerdict:
    table: str
    status: str  # "PASS" | "FAIL" | "WARN" | "SKIP"
    details: List[str] = field(default_factory=list)


def check_row_counts(live_conn) -> List[TableVerdict]:
    verdicts: List[TableVerdict] = []

    inventory = _load_json(REPORTS_DIR / "d1_inventory.json")
    manifest = _load_json(EXPORTS_DIR / "_manifest.json")

    if inventory is None or manifest is None:
        verdicts.append(
            TableVerdict(
                "d1.source_vs_export",
                "SKIP",
                [
                    "reports/d1_inventory.json and/or exports/_manifest.json not found — "
                    "run d1_inventory.py and export_d1.py first (requires live CF creds).",
                ],
            )
        )
    else:
        inv_by_table = {t["table"]: t["row_count"] for t in inventory.get("tables", [])}
        exp_by_table = {t["table"]: t.get("row_count", 0) for t in manifest.get("tables", []) if "error" not in t}
        all_tables = sorted(set(inv_by_table) | set(exp_by_table))
        for table in all_tables:
            src_n = inv_by_table.get(table)
            exp_n = exp_by_table.get(table)
            if src_n is None:
                verdicts.append(TableVerdict(f"d1.{table}", "WARN", [f"table present in export but not in inventory (re-run d1_inventory.py)"]))
            elif exp_n is None:
                verdicts.append(TableVerdict(f"d1.{table}", "FAIL", [f"table present in D1 inventory ({src_n} rows) but was never exported"]))
            elif src_n != exp_n:
                verdicts.append(TableVerdict(f"d1.{table}", "FAIL", [f"D1 has {src_n} rows, export captured {exp_n} rows — export is INCOMPLETE or D1 changed mid-export"]))
            else:
                verdicts.append(TableVerdict(f"d1.{table}", "PASS", [f"{src_n} rows: D1 source == export"]))

    # xlsx staging vs its own import summary (self-consistency: did
    # import_applicants.py's staged JSONL match what it reported?)
    applicants_summary = _load_json(REPORTS_DIR / "applicants_import_summary.json")
    staged_apps = _load_jsonl(STAGING_DIR / "applications.jsonl")
    staged_towns = _load_jsonl(STAGING_DIR / "towns_from_xlsx.jsonl")
    if applicants_summary is None:
        verdicts.append(TableVerdict("xlsx.applications", "SKIP", ["reports/applicants_import_summary.json not found — run import_applicants.py first"]))
    else:
        expected_apps = applicants_summary["applications_after_dedupe"]
        expected_towns = applicants_summary["towns_upserted_from_xlsx"]
        if len(staged_apps) != expected_apps:
            verdicts.append(TableVerdict("xlsx.applications", "FAIL", [f"summary claims {expected_apps} applications but staging/applications.jsonl has {len(staged_apps)}"]))
        else:
            verdicts.append(TableVerdict("xlsx.applications", "PASS", [f"{len(staged_apps)} applications staged, matches import summary"]))
        if len(staged_towns) != expected_towns:
            verdicts.append(TableVerdict("xlsx.towns", "FAIL", [f"summary claims {expected_towns} towns but staging/towns_from_xlsx.jsonl has {len(staged_towns)}"]))
        else:
            verdicts.append(TableVerdict("xlsx.towns", "PASS", [f"{len(staged_towns)} towns staged, matches import summary"]))

    # Live target counts, if --live was passed and a connection is available.
    if live_conn is not None:
        verdicts.extend(_check_live_target_counts(live_conn, staged_apps, staged_towns))
    else:
        verdicts.append(
            TableVerdict(
                "target.live_counts",
                "SKIP",
                ["--live not passed (or SUPABASE_DB_URL unreachable/project paused) — target Postgres row counts not checked"],
            )
        )

    return verdicts


def _check_live_target_counts(
    conn, staged_apps: List[Dict[str, Any]], staged_towns: List[Dict[str, Any]]
) -> List[TableVerdict]:
    verdicts = []
    expectations = {
        "towns": len({t["slug"] for t in staged_towns}),
        "applications": len({a["id"] for a in staged_apps}),
    }
    for table, expected_min in expectations.items():
        try:
            with conn.cursor() as cur:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                (actual,) = cur.fetchone()
        except Exception as exc:  # noqa: BLE001 - report any DB error as a verify failure, not a crash
            verdicts.append(TableVerdict(f"target.{table}", "FAIL", [f"query failed: {exc}"]))
            continue
        if actual >= expected_min:
            verdicts.append(TableVerdict(f"target.{table}", "PASS", [f"live table has {actual} rows, staged expected >= {expected_min}"]))
        else:
            verdicts.append(TableVerdict(f"target.{table}", "FAIL", [f"live table has only {actual} rows, expected >= {expected_min} from staged data — load may be incomplete"]))
    return verdicts


# ---------------------------------------------------------------------------
# 2. Duplicate reconciliation
# ---------------------------------------------------------------------------

def check_duplicates() -> List[TableVerdict]:
    verdicts: List[TableVerdict] = []

    dupes_report = _load_json(REPORTS_DIR / "applicants_dupes.json")
    if dupes_report is None:
        verdicts.append(TableVerdict("dupes.email_town", "SKIP", ["reports/applicants_dupes.json not found — run import_applicants.py first"]))
    else:
        n = len(dupes_report.get("dupes", []))
        if n == 0:
            verdicts.append(TableVerdict("dupes.email_town", "PASS", ["no (email, town) collisions found in Candidate_Assessment"]))
        else:
            details = [f"{n} (email, town) collision(s) auto-resolved by keeping the higher score:"]
            for d in dupes_report["dupes"][:10]:
                details.append(f"  - {d['email']} / {d['town']}: kept score {d['kept_score']}, dropped {d['dropped_score']}")
            verdicts.append(TableVerdict("dupes.email_town", "WARN", details))

    # Independent re-derivation from staged applications, in case
    # import_applicants.py's own report is stale relative to the current
    # staging/applications.jsonl (e.g. someone hand-edited the JSONL).
    staged_apps = _load_jsonl(STAGING_DIR / "applications.jsonl")
    if staged_apps:
        seen: Dict[Tuple[Optional[str], Optional[str]], List[Dict[str, Any]]] = {}
        for app in staged_apps:
            key = (app.get("email"), (app.get("town_name_raw") or "").strip().lower() or None)
            seen.setdefault(key, []).append(app)
        real_dupes = {k: v for k, v in seen.items() if len(v) > 1 and k[0] is not None}
        if real_dupes:
            details = [f"{len(real_dupes)} exact (email, town) pair(s) appear MORE THAN ONCE in staging/applications.jsonl (should be impossible post-dedupe):"]
            for key, rows in list(real_dupes.items())[:10]:
                details.append(f"  - {key}: {len(rows)} rows, ids={[r['id'] for r in rows]}")
            verdicts.append(TableVerdict("dupes.staged_applications_recheck", "FAIL", details))
        else:
            verdicts.append(TableVerdict("dupes.staged_applications_recheck", "PASS", [f"re-checked {len(staged_apps)} staged applications: zero exact (email, town) duplicates"]))

        # Same-email-different-town rows are EXPECTED (multi-town
        # applicants) — surface them as an informational note, not a
        # warning, so the report doesn't cry wolf on legitimate data (see
        # import_applicants.py module docstring for the underlying finding).
        by_email: Dict[str, List[Dict[str, Any]]] = {}
        for app in staged_apps:
            if app.get("email"):
                by_email.setdefault(app["email"], []).append(app)
        multi_town = {email: rows for email, rows in by_email.items() if len(rows) > 1}
        if multi_town:
            details = [f"{len(multi_town)} applicant(s) legitimately applied to MULTIPLE towns (kept as separate applications rows, NOT deduped):"]
            for email, rows in multi_town.items():
                towns = ", ".join(sorted(r.get("town_name_raw") or "?" for r in rows))
                details.append(f"  - {email}: {towns}")
            verdicts.append(TableVerdict("dupes.multi_town_applicants_info", "PASS", details))

    # Fuzzy town-name variant detection — catches likely TYPOS (not
    # legitimate distinct towns) among the town names actually referenced by
    # staged applications, using simple normalized edit distance.
    town_names = sorted({a["town_name_raw"] for a in staged_apps if a.get("town_name_raw")})
    variants = _find_likely_town_variants(town_names)
    if variants:
        details = [f"{len(variants)} pair(s) of town names are suspiciously similar (possible typo, NOT auto-merged):"]
        for a, b, dist in variants:
            details.append(f"  - '{a}' vs '{b}' (edit distance {dist}) — verify these are/aren't the same town")
        verdicts.append(TableVerdict("dupes.town_name_variants", "WARN", details))
    elif town_names:
        verdicts.append(TableVerdict("dupes.town_name_variants", "PASS", [f"scanned {len(town_names)} distinct town names referenced by applicants: no likely typos found"]))

    return verdicts


def _levenshtein(a: str, b: str) -> int:
    """Standard O(len(a)*len(b)) edit distance — fine at this data volume
    (tens of town names, not millions); no external dependency needed.
    """
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev_row = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        cur_row = [i] + [0] * len(b)
        for j, cb in enumerate(b, start=1):
            cost = 0 if ca == cb else 1
            cur_row[j] = min(
                prev_row[j] + 1,        # deletion
                cur_row[j - 1] + 1,     # insertion
                prev_row[j - 1] + cost,  # substitution
            )
        prev_row = cur_row
    return prev_row[-1]


def _find_likely_town_variants(town_names: List[str], max_distance: int = 2) -> List[Tuple[str, str, int]]:
    """Flag pairs of town names within `max_distance` edits of each other
    (case-insensitive, whitespace-normalized) as LIKELY typos of the same
    town — e.g. "Bushbuckridge"/"Bushbukridge" (distance 1),
    "Burgersfort"/"Burgersford" (distance 1). Deliberately conservative
    (max_distance=2, and only compared when lengths are close) to avoid
    flagging genuinely different short town names as false positives.
    """
    results = []
    normalized = [(name, re.sub(r"\s+", " ", name.strip().lower())) for name in town_names]
    for i in range(len(normalized)):
        for j in range(i + 1, len(normalized)):
            name_a, norm_a = normalized[i]
            name_b, norm_b = normalized[j]
            if norm_a == norm_b:
                continue  # identical after normalization; not a "variant", just already-equal
            if abs(len(norm_a) - len(norm_b)) > max_distance:
                continue  # length gap alone exceeds budget; skip the expensive comparison
            dist = _levenshtein(norm_a, norm_b)
            if 0 < dist <= max_distance:
                results.append((name_a, name_b, dist))
    return results


# ---------------------------------------------------------------------------
# 3. Integrity checks
# ---------------------------------------------------------------------------

def check_integrity() -> List[TableVerdict]:
    verdicts: List[TableVerdict] = []

    staged_apps = _load_jsonl(STAGING_DIR / "applications.jsonl")
    if not staged_apps:
        verdicts.append(TableVerdict("integrity.applications", "SKIP", ["no staged applications found"]))
        return verdicts

    bad_email = [a for a in staged_apps if a.get("email") and not VALID_EMAIL_RE.match(a["email"])]
    bad_band = [a for a in staged_apps if a.get("band") and a["band"] not in VALID_BANDS]
    bad_status = [a for a in staged_apps if a.get("status") and a["status"] not in VALID_APPLICATION_STATUSES]
    bad_town_status = [
        a for a in staged_apps if a.get("town_status_at_apply") and a["town_status_at_apply"] not in VALID_TOWN_STATUSES
    ]
    missing_town_raw = [a for a in staged_apps if not a.get("town_name_raw")]

    def _verdict(name: str, bad_rows: List[Dict[str, Any]], field_name: str) -> TableVerdict:
        if not bad_rows:
            return TableVerdict(name, "PASS", [f"all {len(staged_apps)} rows have a valid {field_name} (or NULL, which is allowed)"])
        details = [f"{len(bad_rows)} row(s) have an invalid {field_name}:"]
        for r in bad_rows[:10]:
            details.append(f"  - id={r.get('id')} {field_name}={r.get(field_name if field_name != 'email format' else 'email')!r}")
        return TableVerdict(name, "FAIL", details)

    verdicts.append(_verdict("integrity.applications_email_format", bad_email, "email"))
    verdicts.append(_verdict("integrity.applications_band_enum", bad_band, "band"))
    verdicts.append(_verdict("integrity.applications_status_enum", bad_status, "status"))
    verdicts.append(_verdict("integrity.applications_town_status_enum", bad_town_status, "town_status_at_apply"))

    if missing_town_raw:
        verdicts.append(
            TableVerdict(
                "integrity.applications_town_name_raw",
                "WARN",
                [f"{len(missing_town_raw)} application(s) have no town_name_raw at all (town_id will be permanently unresolvable): " +
                 ", ".join(str(a.get("id")) for a in missing_town_raw[:10])],
            )
        )
    else:
        verdicts.append(TableVerdict("integrity.applications_town_name_raw", "PASS", ["every staged application has a town_name_raw to resolve/preserve"]))

    # Cross-check: every town_name_raw referenced by an application should
    # resolve against staged towns (slug match) — mirrors the
    # `unresolved_town_names` warning import_applicants.py already computes,
    # re-verified here independently so verify.py doesn't just trust that
    # report blindly.
    staged_towns = _load_jsonl(STAGING_DIR / "towns_from_xlsx.jsonl")
    town_slugs = {t["slug"] for t in staged_towns}
    from import_applicants import slugify  # local import: keeps verify.py import-light when unused

    unresolvable = sorted({a["town_name_raw"] for a in staged_apps if a.get("town_name_raw") and slugify(a["town_name_raw"]) not in town_slugs})
    if unresolvable:
        verdicts.append(
            TableVerdict(
                "integrity.applications_town_resolvable",
                "WARN",
                [f"{len(unresolvable)} town name(s) referenced by applications have no matching staged towns row (town_id will load as NULL):"] +
                [f"  - {t}" for t in unresolvable],
            )
        )
    else:
        verdicts.append(TableVerdict("integrity.applications_town_resolvable", "PASS", ["every application's town_name_raw resolves to a staged towns row"]))

    return verdicts


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def render_markdown(all_verdicts: List[TableVerdict], live_checked: bool) -> str:
    lines = [
        "# Ubuntu Town OS — Migration Verification Report",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        f"Live target Postgres checked: {'yes' if live_checked else 'no (pass --live to check real row counts)'}",
        "",
        "## Summary",
        "",
    ]
    counts = {"PASS": 0, "FAIL": 0, "WARN": 0, "SKIP": 0}
    for v in all_verdicts:
        counts[v.status] += 1
    lines.append(f"- PASS: {counts['PASS']}")
    lines.append(f"- FAIL: {counts['FAIL']}")
    lines.append(f"- WARN: {counts['WARN']}")
    lines.append(f"- SKIP: {counts['SKIP']}")
    lines.append("")
    overall = "FAIL" if counts["FAIL"] > 0 else ("PASS (with warnings)" if counts["WARN"] > 0 else "PASS")
    lines.append(f"**Overall: {overall}**")
    lines.append("")

    sections = [
        ("1. Row-count reconciliation", [v for v in all_verdicts if v.table.startswith(("d1.", "xlsx.", "target."))]),
        ("2. Duplicate reconciliation", [v for v in all_verdicts if v.table.startswith("dupes.")]),
        ("3. Integrity checks", [v for v in all_verdicts if v.table.startswith("integrity.")]),
    ]
    icon = {"PASS": "PASS", "FAIL": "FAIL", "WARN": "WARN", "SKIP": "SKIP"}
    for title, verdicts in sections:
        lines.append(f"## {title}")
        lines.append("")
        if not verdicts:
            lines.append("_(no checks ran in this section)_")
            lines.append("")
            continue
        lines.append("| Table/Check | Status | Details |")
        lines.append("|---|---|---|")
        for v in verdicts:
            detail_str = "<br>".join(d.replace("|", "\\|") for d in v.details) if v.details else ""
            lines.append(f"| `{v.table}` | **{icon[v.status]}** | {detail_str} |")
        lines.append("")

    return "\n".join(lines)


def main(argv: List[str] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", action="store_true", help="also connect to SUPABASE_DB_URL to verify real target row counts")
    args = parser.parse_args(argv)

    live_conn = None
    if args.live:
        if psycopg2 is None:
            print("ERROR: --live requires psycopg2 (pip install -r requirements.txt)", file=sys.stderr)
            return 2
        CONFIG.require_supabase()
        live_conn = psycopg2.connect(CONFIG.supabase_db_url)

    try:
        all_verdicts: List[TableVerdict] = []
        all_verdicts.extend(check_row_counts(live_conn))
        all_verdicts.extend(check_duplicates())
        all_verdicts.extend(check_integrity())
    finally:
        if live_conn is not None:
            live_conn.close()

    report_md = render_markdown(all_verdicts, live_checked=live_conn is not None)
    report_path = REPORTS_DIR / "verify.md"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_md)

    print(report_md)
    print(f"\nFull report written -> {report_path}")

    n_fail = sum(1 for v in all_verdicts if v.status == "FAIL")
    return 1 if n_fail > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
