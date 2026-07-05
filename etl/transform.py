#!/usr/bin/env python3
"""
transform.py — pure functions mapping each D1 (and D1-adjacent) source row
onto one or more canonical target rows per
supabase/migrations/0001_ubuntu_town_core.sql.

Design principles:
  1. PURE FUNCTIONS. Every `transform_*` function takes plain dicts (as read
     from exports/{table}.jsonl) and returns plain dicts (ready for
     load_supabase.py). No I/O, no D1/Postgres calls, nothing here mutates
     global state. This makes every mapping independently unit-testable
     without any live credentials — exactly the constraint this delivery is
     under.
  2. DETERMINISTIC IDS. Every output row's `id` is derived via
     `deterministic_uuid(kind, *natural_key_parts)` (imported from
     import_applicants.py, which owns the canonical implementation) so the
     SAME source row always produces the SAME target id across repeated
     runs. That determinism is what makes load_supabase.py's
     `ON CONFLICT (id) DO UPDATE` genuinely idempotent, rather than
     idempotent-by-luck.
  3. MAPPING IS DOCUMENTED, NOT IMPLICIT. The `MAPPING` dict at the bottom of
     this file is the single source of truth for "source table/column ->
     target table/column" and is what verify.py and README.md point to when
     explaining coverage. Every transform_* function's docstring repeats its
     slice of MAPPING inline for readability at the call site too.
  4. UNKNOWN/MALFORMED INPUT DEGRADES GRACEFULLY. Missing optional fields
     become NULL; missing REQUIRED fields (e.g. no name at all) cause the
     row to be skipped with a warning appended to the batch's `_skipped`
     list rather than raising, so one bad row never aborts an entire table's
     migration. (load_supabase.py surfaces `_skipped` counts per table.)

SOURCE D1 TABLES COVERED (per the Phase 3 brief):
  coordinator_applications, coordinator_reviews      -> applications
  coordinators, coordinator_town_assignments          -> coordinators, coordinator_assignments
  coordinator_onboarding_*                             -> folded into coordinators.status/started_at
                                                          (see transform_coordinator_onboarding)
  coordinator_proofs (R2 key)                            -> proofs + media_assets
  town_heartbeat_scores                                   -> town_scores
  mobile_town_signals                                      -> signals
  mobile_opportunity_interests                              -> opportunity_points
  cases                                                       -> signals (category='case', see note)
  fh_* (Family House), kb_* (KasiBuy)                          -> businesses / opportunity_points
                                                                  (ecosystem-specific; see
                                                                  transform_fh_* / transform_kb_*)

SOURCE SUPABASE (web app, 14 tables) is handled the same way where it
overlaps with D1 concepts (town_signals/town_metrics alongside D1's
mobile_town_signals/town_heartbeat_scores) — see transform_town_signals_webapp
and transform_town_metrics_webapp. Tables unique to the web app schema
(provinces, services, access_points, partner_offers, cv_profiles) either map
1:1 onto an equivalent 0001 concept (documented below) or are explicitly
flagged as "no destination table in 0001 — Phase 4 candidate" so nothing is
silently dropped without a paper trail.

TODO (operator): every transform_* function assumes a REASONABLE-BUT-NOT
YET CONFIRMED source column layout, since the actual D1/webapp schemas were
described narratively in the brief rather than as exact CREATE TABLE DDL.
Each function's docstring flags its assumed column names with
"ASSUMED SOURCE COLUMNS:" — before running load_supabase.py for real, export
one real table (export_d1.py) and diff its actual keys against that list;
adjust the `.get(...)` calls in this file to match. This is deliberately
designed so that fix is a small, localized, per-table edit.
"""

from __future__ import annotations

import json
import math
import re
import unicodedata
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

# Reuse the exact same deterministic-id + normalization helpers as
# import_applicants.py so a `town` id computed from a D1 row and a `town` id
# computed from the xlsx pack collide correctly when they refer to the same
# real-world town (matched by slug) instead of producing two divergent rows.
from import_applicants import (
    MIGRATION_NAMESPACE,  # noqa: F401  (re-exported for tests/tools that want it)
    deterministic_uuid,
    slugify,
    clean_str,
    to_float,
    norm_email,
    norm_town,
    normalize_phone,
    map_band,
    map_town_status,
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_any(row: Dict[str, Any], *keys: str) -> Any:
    """Return the first present, non-None value among `keys` in `row`.

    Used throughout this file because source column names are ASSUMED (see
    module docstring) — trying a short list of plausible aliases per field
    (e.g. "town" vs "town_name" vs "town_id_raw") makes the mapping resilient
    to minor schema drift without needing exact DDL up front.
    """
    for k in keys:
        if k in row and row[k] is not None:
            return row[k]
    return None


def _parse_ts(value: Any) -> Optional[str]:
    """Best-effort parse of a source timestamp into an ISO-8601 string
    Postgres/psycopg2 can bind directly to a `timestamptz` column. D1/SQLite
    commonly stores these as unix epoch (int/float, seconds OR
    milliseconds) or as an ISO string already; handle both.
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        # Heuristic: > 10^12 => milliseconds since epoch, else seconds.
        seconds = value / 1000.0 if value > 10**12 else float(value)
        try:
            return datetime.fromtimestamp(seconds, tz=timezone.utc).isoformat()
        except (OverflowError, OSError, ValueError):
            return None
    s = clean_str(value)
    if not s:
        return None
    # Already ISO-ish; let psycopg2/Postgres parse it at load time. We don't
    # re-validate format here to avoid rejecting valid-but-unusual formats
    # Postgres itself would happily accept.
    return s


def _json_or_dict(value: Any) -> Dict[str, Any]:
    """D1/SQLite has no native JSON type — JSON payload columns are usually
    stored as a TEXT blob. Parse if it's a string, pass through if already a
    dict, default to {} otherwise.
    """
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value.strip():
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {"_raw": parsed}
        except (json.JSONDecodeError, TypeError):
            return {"_raw": value}
    return {}


# ===========================================================================
# 1. coordinator_applications + coordinator_reviews  ->  applications
# ===========================================================================

def transform_coordinator_application(
    app_row: Dict[str, Any],
    reviews_by_application_id: Optional[Dict[str, List[Dict[str, Any]]]] = None,
) -> Optional[Dict[str, Any]]:
    """D1 coordinator_applications (+ coordinator_reviews) -> applications.

    ASSUMED SOURCE COLUMNS (coordinator_applications):
      id, full_name/name, email, phone, town/town_name, province,
      role_track/role, ecosystem/ecosystem_fit, score, band, status,
      created_at, submission_id, form_* answer columns (variable).

    ASSUMED SOURCE COLUMNS (coordinator_reviews), matched via
    reviews_by_application_id[application.id]:
      id, application_id, reviewer_notes/notes, decision, score_adjustment,
      created_at.

    MAPPING:
      id (D1 pk, preserved for traceability) -> form_answers._d1_id
      full_name / name             -> full_name
      email                          -> email (normalized)
      phone                            -> phone (normalized)
      town / town_name                  -> town_name_raw (town_id resolved at
                                            load time, same as xlsx path)
      province                            -> province
      role_track / role                    -> role_track
      ecosystem / ecosystem_fit              -> ecosystem_fit
      score                                    -> score
      band                                      -> band (validated against enum)
      status (D1 free text)                      -> status, mapped via
                                                    _map_application_status
                                                    (falls back to 'received')
      created_at                                   -> created_at
      submission_id                                  -> submission_id
      coordinator_reviews[].notes/decision              -> folded into
                                                            form_answers._reviews
                                                            (list, preserves every
                                                            review rather than
                                                            picking "the" review,
                                                            since 0001 has no
                                                            separate reviews table)
      (fixed)                                              -> source = 'd1_coordinator_applications'
      (computed)                                             -> id = deterministic_uuid(
                                                                "application", email, town)
                                                                — SAME natural key as the
                                                                xlsx importer, so if a
                                                                candidate appears in BOTH
                                                                D1 and the xlsx pack, they
                                                                collide onto one row instead
                                                                of duplicating (the
                                                                ON CONFLICT upsert in
                                                                load_supabase.py then merges
                                                                whichever source is loaded
                                                                second's non-null fields in,
                                                                per its documented
                                                                COALESCE-on-conflict strategy).
    """
    full_name = clean_str(_get_any(app_row, "full_name", "name", "fullname"))
    email = norm_email(_get_any(app_row, "email"))
    if not full_name and not email:
        return None  # unusable row; nothing to key or display

    town_raw = clean_str(_get_any(app_row, "town", "town_name", "town_raw"))
    town_key = norm_town(town_raw)

    reviews = (reviews_by_application_id or {}).get(str(_get_any(app_row, "id")), [])
    review_notes = [
        {
            "notes": clean_str(_get_any(r, "notes", "reviewer_notes")),
            "decision": clean_str(_get_any(r, "decision")),
            "score_adjustment": to_float(_get_any(r, "score_adjustment")),
            "created_at": _parse_ts(_get_any(r, "created_at")),
        }
        for r in reviews
    ]

    form_answers: Dict[str, Any] = {"_d1_id": _get_any(app_row, "id")}
    if review_notes:
        form_answers["_reviews"] = review_notes
    # Preserve any FORM_*-style free-text columns we don't otherwise model.
    for k, v in app_row.items():
        if k.lower().startswith("form_") and clean_str(v):
            form_answers[k.lower()] = clean_str(v)

    natural_key_parts = ["application", email or f"noemail:{(full_name or '').lower()}", town_key or "noTown"]

    return {
        "id": deterministic_uuid(*natural_key_parts),
        "submission_id": clean_str(_get_any(app_row, "submission_id")),
        "full_name": full_name or "(unknown)",
        "email": email,
        "phone": normalize_phone(_get_any(app_row, "phone")),
        "town_id": None,
        "town_name_raw": town_raw,
        "town_name_norm": town_key,
        "province": clean_str(_get_any(app_row, "province")),
        "role_track": clean_str(_get_any(app_row, "role_track", "role")),
        "ecosystem_fit": clean_str(_get_any(app_row, "ecosystem", "ecosystem_fit")),
        "score": to_float(_get_any(app_row, "score")),
        "band": map_band(_get_any(app_row, "band")),
        "town_status_at_apply": map_town_status(_get_any(app_row, "town_status", "townstatus")),
        "sub_scores": _json_or_dict(_get_any(app_row, "sub_scores")),
        "form_answers": form_answers,
        "status": _map_application_status(_get_any(app_row, "status")),
        "source": "d1_coordinator_applications",
        "created_at": _parse_ts(_get_any(app_row, "created_at")) or _now_iso(),
        "_natural_key": "|".join(natural_key_parts),
    }


_APPLICATION_STATUS_VALUES = {
    "received", "assessed", "interview", "approved", "onboarding", "active", "declined", "hold",
}


def _map_application_status(raw: Any) -> str:
    s = clean_str(raw)
    if not s:
        return "received"
    low = s.lower().replace("-", "_").replace(" ", "_")
    if low in _APPLICATION_STATUS_VALUES:
        return low
    # A few plausible D1 free-text aliases -> canonical enum.
    aliases = {
        "pending": "received",
        "new": "received",
        "in_review": "assessed",
        "reviewed": "assessed",
        "interviewing": "interview",
        "accepted": "approved",
        "rejected": "declined",
        "on_hold": "hold",
        "waitlist": "hold",
    }
    return aliases.get(low, "received")


# ===========================================================================
# 2. coordinators + coordinator_town_assignments + coordinator_onboarding_*
#    -> coordinators, coordinator_assignments
# ===========================================================================

def transform_coordinator(
    coord_row: Dict[str, Any],
    onboarding_by_coordinator_id: Optional[Dict[str, Dict[str, Any]]] = None,
    application_id_by_email_town: Optional[Dict[Tuple[str, str], str]] = None,
) -> Optional[Dict[str, Any]]:
    """D1 coordinators (+ coordinator_onboarding_*) -> coordinators.

    ASSUMED SOURCE COLUMNS (coordinators):
      id, user_id (may be absent — D1 predates Supabase auth.users), email,
      full_name/display_name, phone, town/town_name, band, status,
      reliability_score, started_at, created_at, earnings (JSON blob — the
      OLD unstructured ledger 0001 replaces with `earnings`/`payout_lines`;
      see transform_coordinator_earnings below for how that blob is split
      out instead of being carried forward as-is).

    ASSUMED SOURCE COLUMNS (coordinator_onboarding_*, one row per
    coordinator, matched via onboarding_by_coordinator_id[coord.id]):
      coordinator_id, onboarding_status, onboarding_completed_at,
      started_field_work_at.

    MAPPING:
      id                  -> form_answers-equivalent: NOT carried into
                              coordinators.id directly, because 0001 declares
                              `coordinators.id uuid primary key references
                              users(id)` — i.e. a coordinator's id in the
                              target schema MUST equal a users.id (Supabase
                              auth identity), which does not exist for
                              historical D1-only coordinators who never
                              logged into the web app. See "IMPORTANT" note
                              below for how load_supabase.py resolves this.
      email                 -> used to look up/derive the linked `users` row
                                (load_supabase.py upserts a placeholder
                                `users` row keyed on email if none exists yet
                                — see load_supabase.py's `ensure_user_for_email`)
      full_name/display_name  -> display_name
      phone                     -> phone
      town/town_name              -> town_id resolved at load time (same
                                      town_name_raw pattern)
      band                          -> band
      status (+ onboarding_status)    -> status, via _map_coordinator_status
                                          (prefers onboarding_status if the
                                          coordinators.status column is empty)
      reliability_score                  -> reliability_score
      started_at / started_field_work_at   -> started_at (prefers the more
                                                specific onboarding field)
      application_id (looked up by
        email+town natural key against
        already-imported applications)        -> application_id (FK link
                                                  back to the applications
                                                  row created by
                                                  transform_coordinator_application
                                                  or import_applicants.py,
                                                  using the SAME natural key
                                                  so the two always agree)

    IMPORTANT: coordinators.id = users.id is a hard FK in 0001. Since this
    migration has no live Supabase Auth to create real auth.users rows
    against, this transform emits a `_pending_user_email` field instead of a
    final `id`; load_supabase.py's `ensure_user_for_email()` performs the
    users-row upsert (or, for a from-scratch bootstrap, a documented
    "pre-auth placeholder" insert directly into `users` — see that
    function's docstring for the two supported strategies and their
    tradeoffs) and only THEN computes the final deterministic id for the
    coordinators row from that resolved user id. This keeps transform.py
    pure (no DB access) while keeping the FK contract intact.
    """
    email = norm_email(_get_any(coord_row, "email"))
    full_name = clean_str(_get_any(coord_row, "full_name", "display_name", "name"))
    if not email and not full_name:
        return None

    town_raw = clean_str(_get_any(coord_row, "town", "town_name"))
    town_key = norm_town(town_raw)

    coord_id = str(_get_any(coord_row, "id") or "")
    onboarding = (onboarding_by_coordinator_id or {}).get(coord_id, {})

    status = _map_coordinator_status(
        _get_any(coord_row, "status"),
        _get_any(onboarding, "onboarding_status"),
    )
    started_at = _parse_ts(
        _get_any(onboarding, "started_field_work_at") or _get_any(coord_row, "started_at")
    )

    application_id = None
    if application_id_by_email_town and email and town_key:
        application_id = application_id_by_email_town.get((email, town_key))

    return {
        # NOT a final id — resolved against `users` by load_supabase.py.
        "_pending_user_email": email,
        "_pending_full_name": full_name,  # used if we must bootstrap a placeholder user
        "application_id": application_id,
        "display_name": full_name,
        "phone": normalize_phone(_get_any(coord_row, "phone")),
        "town_id": None,
        "town_name_raw": town_raw,
        "town_name_norm": town_key,
        "band": map_band(_get_any(coord_row, "band")),
        "status": status,
        "reliability_score": to_float(_get_any(coord_row, "reliability_score")) or 0,
        "started_at": started_at,
        "created_at": _parse_ts(_get_any(coord_row, "created_at")) or _now_iso(),
        "_natural_key": f"coordinator|{email or full_name}|{town_key or 'noTown'}",
        "_source_d1_id": coord_id,
    }


_COORDINATOR_STATUS_VALUES = {"onboarding", "active", "paused", "exited"}


def _map_coordinator_status(status_raw: Any, onboarding_status_raw: Any) -> str:
    for raw in (status_raw, onboarding_status_raw):
        s = clean_str(raw)
        if not s:
            continue
        low = s.lower().replace("-", "_").replace(" ", "_")
        if low in _COORDINATOR_STATUS_VALUES:
            return low
        aliases = {
            "in_progress": "onboarding",
            "pending": "onboarding",
            "not_started": "onboarding",
            "complete": "active",
            "completed": "active",
            "suspended": "paused",
            "on_hold": "paused",
            "terminated": "exited",
            "left": "exited",
            "resigned": "exited",
        }
        if low in aliases:
            return aliases[low]
    return "onboarding"


def transform_coordinator_town_assignment(
    assignment_row: Dict[str, Any],
    coordinator_pending_user_email: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """D1 coordinator_town_assignments -> coordinator_assignments.

    ASSUMED SOURCE COLUMNS:
      id, coordinator_id, town/town_name, role/role_key, status,
      assigned_at, ended_at.

    MAPPING:
      coordinator_id (D1 fk)  -> resolved at load time to the coordinators.id
                                  produced for the SAME coordinator by
                                  transform_coordinator (matched via the
                                  coordinator's pending user email, passed in
                                  by the caller/loader since transform.py
                                  itself has no DB access to join across
                                  rows — see load_supabase.py's
                                  `load_coordinator_assignments`).
      town/town_name             -> town_id resolved at load time
      role/role_key                 -> role_key (defaults to 'coordinator';
                                        validated against the role_key enum)
      status                          -> status (free text in 0001, passed
                                          through after trimming)
      assigned_at                       -> assigned_at
      ended_at                            -> ended_at
    """
    town_raw = clean_str(_get_any(assignment_row, "town", "town_name"))
    if not town_raw:
        return None
    town_key = norm_town(town_raw)

    role_key = clean_str(_get_any(assignment_row, "role", "role_key")) or "coordinator"
    role_key = role_key.lower()
    valid_roles = {"admin", "ops", "coordinator", "deputy", "ambassador", "media", "partner", "sponsor", "viewer"}
    if role_key not in valid_roles:
        role_key = "coordinator"

    return {
        "id": deterministic_uuid(
            "coordinator_assignment",
            coordinator_pending_user_email or str(_get_any(assignment_row, "coordinator_id")),
            town_key or "noTown",
            role_key,
        ),
        "_coordinator_pending_user_email": coordinator_pending_user_email,
        "town_name_raw": town_raw,
        "town_name_norm": town_key,
        "town_id": None,
        "role_key": role_key,
        "status": clean_str(_get_any(assignment_row, "status")) or "active",
        "assigned_at": _parse_ts(_get_any(assignment_row, "assigned_at")) or _now_iso(),
        "ended_at": _parse_ts(_get_any(assignment_row, "ended_at")),
    }


# ===========================================================================
# 3. coordinator_proofs (R2 key)  ->  proofs + media_assets
# ===========================================================================

def transform_coordinator_proof(proof_row: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """D1 coordinator_proofs -> (media_assets row, proofs row).

    ASSUMED SOURCE COLUMNS:
      id, coordinator_id, workpack_instance_id / task_id, r2_key,
      mime_type, bytes/size, kind/proof_kind, lat, lng, notes, status,
      reviewed_by, reviewed_at, created_at.

    MAPPING (media_assets):
      r2_key            -> r2_key (0001's media_assets.r2_key column exists
                             SPECIFICALLY for this — R2 objects are NOT
                             re-uploaded to Supabase Storage by this
                             migration; we keep the pointer and let a
                             separate, later asset-sync job move bytes if/when
                             needed. `bucket`/`path` are left NULL until that
                             happens.)
      mime_type            -> mime_type
      bytes/size             -> bytes
      (fixed)                  -> kind = 'image' unless mime_type says
                                   otherwise (video/*, audio/*) — see
                                   _infer_media_kind
      (fixed)                    -> owner_type = 'proof'
      (computed)                    -> owner_id = the proofs.id computed below
                                        (media_assets row is emitted FIRST so
                                        proofs.media_asset_id can reference it)

    MAPPING (proofs):
      coordinator_id (D1 fk)   -> resolved at load time (same pending-email
                                   pattern as coordinator_assignments)
      workpack_instance_id/
        task_id                  -> workpack_instance_id (nullable; if the
                                     source has no workpack concept, proof is
                                     loaded with workpack_instance_id = NULL,
                                     which 0001 permits)
      kind/proof_kind             -> kind
      lat, lng                      -> lat, lng
      notes                           -> notes
      status                            -> status (proof_status enum, via
                                            _map_proof_status)
      reviewed_by, reviewed_at            -> reviewed_by (nullable fk to users;
                                              resolved at load time by email if
                                              the source stores an email/name
                                              rather than a users.id),
                                              reviewed_at
      created_at                            -> created_at
      (computed)                              -> media_asset_id = the id of
                                                  the media_assets row emitted
                                                  alongside this proof
    """
    proof_id = deterministic_uuid("proof", str(_get_any(proof_row, "id")))
    media_asset_id = deterministic_uuid("media_asset", "proof", str(_get_any(proof_row, "id")))

    r2_key = clean_str(_get_any(proof_row, "r2_key"))
    mime_type = clean_str(_get_any(proof_row, "mime_type"))

    media_asset = {
        "id": media_asset_id,
        "bucket": "proofs",
        "path": None,  # TODO: populate once/if R2 objects are copied into Supabase Storage
        "r2_key": r2_key,
        "kind": _infer_media_kind(mime_type),
        "mime_type": mime_type,
        "bytes": _to_int(_get_any(proof_row, "bytes", "size")),
        "owner_type": "proof",
        "owner_id": proof_id,
        "uploaded_by": None,  # resolved at load time if a coordinator email is available
        "_uploaded_by_pending_email": None,  # filled by caller in transform_all if known
        "created_at": _parse_ts(_get_any(proof_row, "created_at")) or _now_iso(),
    }

    proof = {
        "id": proof_id,
        "workpack_instance_id": None,  # resolved at load time from task/workpack ref if present
        "_workpack_instance_source_ref": clean_str(_get_any(proof_row, "workpack_instance_id", "task_id")),
        "_coordinator_pending_ref": str(_get_any(proof_row, "coordinator_id") or ""),
        "kind": clean_str(_get_any(proof_row, "kind", "proof_kind")),
        "media_asset_id": media_asset_id,
        "lat": to_float(_get_any(proof_row, "lat")),
        "lng": to_float(_get_any(proof_row, "lng")),
        "notes": clean_str(_get_any(proof_row, "notes")),
        "status": _map_proof_status(_get_any(proof_row, "status")),
        "kopano_recommendation": _json_or_dict(_get_any(proof_row, "kopano_recommendation")) or None,
        "reviewed_by": None,
        "_reviewed_by_pending_email": norm_email(_get_any(proof_row, "reviewed_by_email")),
        "reviewed_at": _parse_ts(_get_any(proof_row, "reviewed_at")),
        "created_at": _parse_ts(_get_any(proof_row, "created_at")) or _now_iso(),
    }
    return media_asset, proof


def _infer_media_kind(mime_type: Optional[str]) -> str:
    if not mime_type:
        return "image"
    mime_type = mime_type.lower()
    if mime_type.startswith("video/"):
        return "video"
    if mime_type.startswith("audio/"):
        return "audio"
    if mime_type in ("application/pdf",) or mime_type.startswith("application/"):
        return "document"
    return "image"


_PROOF_STATUS_VALUES = {"pending", "approved", "returned", "rejected"}


def _map_proof_status(raw: Any) -> str:
    s = clean_str(raw)
    if not s:
        return "pending"
    low = s.lower()
    return low if low in _PROOF_STATUS_VALUES else "pending"


def _to_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


# ===========================================================================
# 4. town_heartbeat_scores (D1) / town_metrics (webapp Supabase) -> town_scores
# ===========================================================================

# 0001's town_scores has a `unique (town_id, period)` natural key, so BOTH
# source systems (D1 town_heartbeat_scores AND webapp town_metrics) resolve
# onto the same row per (town, period) if their period aligns — the loader's
# ON CONFLICT (town_id, period) DO UPDATE means whichever source runs
# second wins on overlapping fields, with COALESCE preserving fields the
# second source doesn't provide (see load_supabase.py UPSERT_STRATEGIES).

def transform_town_heartbeat_score(hb_row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """D1 town_heartbeat_scores -> town_scores.

    ASSUMED SOURCE COLUMNS:
      town/town_name, period/computed_date, opportunity_index,
      youth_population, vacant_spaces, connectivity, entrepreneurship,
      coordinator_readiness, funding_availability, computed_at.

    MAPPING: near 1:1 by name; see field list below. `period` defaults to
    the row's created/computed date's DATE portion (town_scores.period is a
    `date`, not `timestamptz`).
    """
    town_raw = clean_str(_get_any(hb_row, "town", "town_name"))
    if not town_raw:
        return None
    town_key = norm_town(town_raw)

    period_raw = _get_any(hb_row, "period", "computed_date", "date")
    period = _to_date_str(period_raw) or _to_date_str(_get_any(hb_row, "computed_at")) or _to_date_str(_now_iso())

    return {
        "id": deterministic_uuid("town_score", town_key or town_raw, str(period)),
        "town_id": None,
        "town_name_raw": town_raw,
        "town_name_norm": town_key,
        "period": period,
        "opportunity_index": to_float(_get_any(hb_row, "opportunity_index")),
        "youth_population": to_float(_get_any(hb_row, "youth_population")),
        "vacant_spaces": to_float(_get_any(hb_row, "vacant_spaces")),
        "connectivity": to_float(_get_any(hb_row, "connectivity")),
        "entrepreneurship": to_float(_get_any(hb_row, "entrepreneurship")),
        "coordinator_readiness": to_float(_get_any(hb_row, "coordinator_readiness")),
        "funding_availability": to_float(_get_any(hb_row, "funding_availability")),
        "computed_at": _parse_ts(_get_any(hb_row, "computed_at")) or _now_iso(),
        "_source": "d1_town_heartbeat_scores",
    }


def transform_town_metric_webapp(metric_row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """webapp Supabase town_metrics -> town_scores.

    ASSUMED SOURCE COLUMNS: same field names as town_heartbeat_scores where
    the web app schema overlaps (both were designed against the same
    Opportunity Index concept); differs mainly in table/source provenance.
    Mirrors transform_town_heartbeat_score exactly except for `_source`.
    """
    result = transform_town_heartbeat_score(metric_row)
    if result is not None:
        result["_source"] = "webapp_town_metrics"
    return result


_FULL_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}")


def _to_date_str(value: Any) -> Optional[str]:
    """Coerce `value` to a "YYYY-MM-DD" string, or None if it can't be
    resolved to a FULL calendar date (day-granularity).

    Deliberately stricter than `_parse_ts`: a bare "YYYY-MM" string (no day
    component) is a legitimate `_parse_ts` pass-through (it's a valid
    ISO-8601 prefix Postgres could parse), but naively slicing its first 10
    characters would silently truncate to the malformed "2026-06" (7 chars,
    no day) rather than a real date — callers that need a day-anchored
    fallback (e.g. earnings' "YYYY-MM" period keys) should catch a None
    return here and use `_period_to_first_of_month` instead, exactly as
    `transform_coordinator_earnings_blob` does.
    """
    ts = _parse_ts(value)
    if not ts:
        return None
    if not _FULL_DATE_RE.match(ts):
        return None
    # Take just the date portion for a `date` column; Postgres will also
    # happily cast a full ISO timestamp string, but trimming here keeps the
    # natural key (used in deterministic_uuid above) stable regardless of
    # what time-of-day component the source happened to store.
    return ts[:10]


# ===========================================================================
# 5. mobile_town_signals (D1) / town_signals (webapp Supabase) -> signals
# ===========================================================================

def transform_mobile_town_signal(signal_row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """D1 mobile_town_signals -> signals.

    ASSUMED SOURCE COLUMNS:
      id, town/town_name, created_by/reporter_email, title, description,
      category, lat, lng, media_r2_key, status, created_at.

    MAPPING:
      id                  -> natural key component (preserves D1 identity so
                              re-exports/re-runs land on the same signals row)
      town/town_name         -> town_id resolved at load time
      created_by/
        reporter_email          -> created_by (resolved at load time via
                                    ensure_user_for_email, same pattern as
                                    coordinators)
      title                      -> title (falls back to a truncated
                                     description if the source has no
                                     dedicated title field, since
                                     signals.title is NOT NULL in 0001)
      description                  -> description
      category                       -> category
      (fixed)                          -> source = 'mobile_app' (distinguishes
                                          from webapp-origin signals, and from
                                          coordinator-entered 'field' signals)
      lat, lng                          -> lat, lng
      media_r2_key                        -> if present, a media_assets row is
                                              emitted too (see
                                              transform_signal_media) and
                                              signals.media_asset_id links it
      status                                -> status (signal_status enum,
                                                via _map_signal_status)
      created_at                              -> created_at
    """
    town_raw = clean_str(_get_any(signal_row, "town", "town_name"))
    title = clean_str(_get_any(signal_row, "title"))
    description = clean_str(_get_any(signal_row, "description"))
    if not title:
        title = (description[:120] + "…") if description and len(description) > 120 else description
    if not title:
        return None  # signals.title is NOT NULL; nothing usable to put there

    src_id = str(_get_any(signal_row, "id") or "")
    signal_id = deterministic_uuid("signal", "mobile_town_signal", src_id)

    r2_key = clean_str(_get_any(signal_row, "media_r2_key"))
    media_asset = None
    if r2_key:
        media_asset_id = deterministic_uuid("media_asset", "signal", src_id)
        media_asset = {
            "id": media_asset_id,
            "bucket": "signals",
            "path": None,
            "r2_key": r2_key,
            "kind": "image",
            "mime_type": None,
            "bytes": None,
            "owner_type": "signal",
            "owner_id": signal_id,
            "uploaded_by": None,
            "created_at": _parse_ts(_get_any(signal_row, "created_at")) or _now_iso(),
        }

    return {
        "id": signal_id,
        "town_id": None,
        "town_name_raw": town_raw,
        "town_name_norm": norm_town(town_raw) if town_raw else None,
        "_created_by_pending_email": norm_email(_get_any(signal_row, "created_by", "reporter_email")),
        "created_by": None,
        "title": title,
        "description": description,
        "category": clean_str(_get_any(signal_row, "category")),
        "source": "mobile_app",
        "status": _map_signal_status(_get_any(signal_row, "status")),
        "lat": to_float(_get_any(signal_row, "lat")),
        "lng": to_float(_get_any(signal_row, "lng")),
        "media_asset_id": media_asset["id"] if media_asset else None,
        "_media_asset": media_asset,  # popped off and inserted separately by load_supabase.py
        "created_at": _parse_ts(_get_any(signal_row, "created_at")) or _now_iso(),
    }


def transform_town_signal_webapp(signal_row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """webapp Supabase town_signals -> signals.

    Same shape/assumptions as transform_mobile_town_signal; only the
    `source` and natural-key prefix differ, so webapp-origin and
    mobile-origin signals about the same real-world event are NOT
    accidentally merged (they are presumed to be genuinely distinct reports
    even if they describe the same underlying issue — deliberate design
    choice, since collapsing them would require fuzzy text matching this
    migration explicitly avoids; the fuzzy work belongs in
    verify.py's duplicate-detection report for a human to review, not in
    an automatic merge here).
    """
    result = transform_mobile_town_signal(signal_row)
    if result is None:
        return None
    src_id = str(_get_any(signal_row, "id") or "")
    result["id"] = deterministic_uuid("signal", "webapp_town_signal", src_id)
    result["source"] = "web"
    if result.get("_media_asset"):
        result["_media_asset"]["owner_id"] = result["id"]
        result["media_asset_id"] = result["_media_asset"]["id"]
    return result


_SIGNAL_STATUS_VALUES = {"new", "triaged", "opportunity", "workpacked", "closed", "rejected"}


def _map_signal_status(raw: Any) -> str:
    s = clean_str(raw)
    if not s:
        return "new"
    low = s.lower().replace("-", "_").replace(" ", "_")
    return low if low in _SIGNAL_STATUS_VALUES else "new"


# ===========================================================================
# 6. mobile_opportunity_interests -> opportunity_points
# ===========================================================================

def transform_mobile_opportunity_interest(interest_row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """D1 mobile_opportunity_interests -> opportunity_points.

    ASSUMED SOURCE COLUMNS:
      id, town/town_name, signal_id, name/business_name, type/interest_type,
      owner_name, owner_contact, node/ecosystem_node, lat, lng, status,
      activated_at, created_at.

    MAPPING:
      town/town_name         -> town_id resolved at load time (opportunity_points.town_id
                                 is NOT NULL in 0001 — rows with no resolvable town are
                                 skipped and logged, since we can't insert a NULL there
                                 the way applications/signals permit)
      signal_id (D1 fk)         -> signal_id resolved at load time against the
                                    signals row produced by
                                    transform_mobile_town_signal for the SAME
                                    D1 id (natural key
                                    "signal|mobile_town_signal|{signal_id}")
      name/business_name           -> name
      type/interest_type              -> type (op_point_type enum: connect |
                                          upgrade | transform — via
                                          _map_op_point_type, defaults to
                                          'connect')
      owner_name, owner_contact          -> owner_name, owner_contact
      node/ecosystem_node                   -> node (free text, e.g.
                                                "AI Café" | "KasiBuy" |
                                                "FixEasy24")
      lat, lng                                -> lat, lng
      status                                     -> status (op_point_status
                                                    enum, via
                                                    _map_op_point_status)
      activated_at                                 -> activated_at
      created_at                                     -> created_at
    """
    town_raw = clean_str(_get_any(interest_row, "town", "town_name"))
    if not town_raw:
        return None  # town_id is NOT NULL on opportunity_points; unusable without one

    name = clean_str(_get_any(interest_row, "name", "business_name")) or "(unnamed opportunity)"
    src_id = str(_get_any(interest_row, "id") or "")

    return {
        "id": deterministic_uuid("opportunity_point", "mobile_opportunity_interest", src_id),
        "town_id": None,
        "town_name_raw": town_raw,
        "town_name_norm": norm_town(town_raw),
        "_signal_source_ref": str(_get_any(interest_row, "signal_id") or "") or None,
        "signal_id": None,
        "name": name,
        "type": _map_op_point_type(_get_any(interest_row, "type", "interest_type")),
        "status": _map_op_point_status(_get_any(interest_row, "status")),
        "owner_name": clean_str(_get_any(interest_row, "owner_name")),
        "owner_contact": clean_str(_get_any(interest_row, "owner_contact")),
        "node": clean_str(_get_any(interest_row, "node", "ecosystem_node")),
        "lat": to_float(_get_any(interest_row, "lat")),
        "lng": to_float(_get_any(interest_row, "lng")),
        "activated_at": _parse_ts(_get_any(interest_row, "activated_at")),
        "created_at": _parse_ts(_get_any(interest_row, "created_at")) or _now_iso(),
    }


_OP_POINT_TYPE_VALUES = {"connect", "upgrade", "transform"}
_OP_POINT_STATUS_VALUES = {"identified", "assessed", "partnered", "funded", "active", "inactive"}


def _map_op_point_type(raw: Any) -> str:
    s = clean_str(raw)
    if not s:
        return "connect"
    low = s.lower()
    return low if low in _OP_POINT_TYPE_VALUES else "connect"


def _map_op_point_status(raw: Any) -> str:
    s = clean_str(raw)
    if not s:
        return "identified"
    low = s.lower()
    return low if low in _OP_POINT_STATUS_VALUES else "identified"


# ===========================================================================
# 7. cases -> signals (category='case')
# ===========================================================================

def transform_case(case_row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """D1 `cases` -> signals (with category='case' to preserve provenance).

    ASSUMED SOURCE COLUMNS:
      id, town/town_name, title/subject, description/details, status,
      created_by, lat, lng, created_at.

    RATIONALE: 0001 has no dedicated "cases" concept; `cases` rows describe
    a discrete, town-scoped issue that needs triage — semantically the same
    shape as `signals` (title/description/status/location). Rather than
    inventing a new target table not present in the canonical schema, cases
    are imported as signals with `category='case'` and `source='d1_cases'`
    so they remain filterable/distinguishable from organic field/mobile/web
    signals. If Phase 4 introduces a first-class cases table, this is the
    single function to repoint.

    MAPPING: identical field-for-field shape to
    transform_mobile_town_signal, with category and source fixed as above.
    """
    town_raw = clean_str(_get_any(case_row, "town", "town_name"))
    title = clean_str(_get_any(case_row, "title", "subject"))
    description = clean_str(_get_any(case_row, "description", "details"))
    if not title:
        title = (description[:120] + "…") if description and len(description) > 120 else description
    if not title:
        return None

    src_id = str(_get_any(case_row, "id") or "")
    return {
        "id": deterministic_uuid("signal", "case", src_id),
        "town_id": None,
        "town_name_raw": town_raw,
        "town_name_norm": norm_town(town_raw) if town_raw else None,
        "_created_by_pending_email": norm_email(_get_any(case_row, "created_by")),
        "created_by": None,
        "title": title,
        "description": description,
        "category": "case",
        "source": "d1_cases",
        "status": _map_signal_status(_get_any(case_row, "status")),
        "lat": to_float(_get_any(case_row, "lat")),
        "lng": to_float(_get_any(case_row, "lng")),
        "media_asset_id": None,
        "_media_asset": None,
        "created_at": _parse_ts(_get_any(case_row, "created_at")) or _now_iso(),
    }


# ===========================================================================
# 8. fh_* (Family House) / kb_* (KasiBuy) -> businesses / opportunity_points
# ===========================================================================

def transform_fh_business(fh_row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """D1 fh_* (Family House program) business-shaped rows -> businesses.

    ASSUMED SOURCE COLUMNS (e.g. fh_households / fh_providers / fh_listings
    — exact table name TBD from real export, see export_d1.py output):
      id, town/town_name, name/business_name, category/service_type,
      owner_email, is_verified, created_at.

    RATIONALE: Family House is described in the brief as an
    ecosystem/program name (fh_*), not a single table; this function targets
    whichever fh_* table represents a household/provider/service entity
    that behaves like a local business listing. Run this against each
    concrete fh_* table found by d1_inventory.py / export_d1.py — the
    function itself is table-name agnostic (it only reads row shape).

    MAPPING:
      name/business_name    -> name
      category/service_type    -> category
      town/town_name              -> town_id resolved at load time
      owner_email                    -> owner_profile_id resolution is
                                         DEFERRED — 0001's
                                         businesses.owner_profile_id points at
                                         `profiles`, which itself requires a
                                         `users` row (auth-linked). This
                                         migration does not fabricate auth
                                         identities for every business
                                         owner; owner_profile_id is left NULL
                                         unless load_supabase.py can resolve
                                         an existing profile by email (see
                                         `ensure_profile_for_email`, which is
                                         opt-in and OFF by default — see
                                         load_supabase.py --link-owners flag).
      is_verified                      -> is_verified (defaults False)
      (fixed)                             -> opportunity_point_id = NULL
                                             (fh_* rows are not, by default,
                                             linked to a specific
                                             opportunity_points row; wire
                                             this up manually per-program if
                                             Family House data models that
                                             relationship explicitly)
      created_at                            -> created_at
    """
    town_raw = clean_str(_get_any(fh_row, "town", "town_name"))
    name = clean_str(_get_any(fh_row, "name", "business_name", "household_name"))
    if not name:
        return None
    src_id = str(_get_any(fh_row, "id") or "")

    return {
        "id": deterministic_uuid("business", "fh", src_id),
        "town_id": None,
        "town_name_raw": town_raw,
        "town_name_norm": norm_town(town_raw) if town_raw else None,
        "opportunity_point_id": None,
        "name": name,
        "category": clean_str(_get_any(fh_row, "category", "service_type")) or "family_house",
        "owner_profile_id": None,
        "_owner_pending_email": norm_email(_get_any(fh_row, "owner_email")),
        "is_verified": bool(_get_any(fh_row, "is_verified")) if _get_any(fh_row, "is_verified") is not None else False,
        "created_at": _parse_ts(_get_any(fh_row, "created_at")) or _now_iso(),
        "_source": "d1_fh",
    }


def transform_kb_business(kb_row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """D1 kb_* (KasiBuy marketplace) listing rows -> businesses.

    ASSUMED SOURCE COLUMNS: same shape as transform_fh_business (id, town,
    name/listing_name, category/product_category, owner_email, is_verified,
    created_at) — KasiBuy is a local-commerce marketplace, so its listings
    map onto `businesses` the same way Family House providers do.

    MAPPING: identical to transform_fh_business except `category` defaults
    to 'kasibuy' and `_source` records the KasiBuy provenance, so verify.py
    / a human reviewer can distinguish which program originated each
    businesses row without relying on category alone (categories may
    legitimately overlap, e.g. both programs list "spaza_shop").
    """
    result = transform_fh_business(kb_row)
    if result is None:
        return None
    src_id = str(_get_any(kb_row, "id") or "")
    result["id"] = deterministic_uuid("business", "kb", src_id)
    result["category"] = clean_str(_get_any(kb_row, "category", "product_category")) or "kasibuy"
    result["_source"] = "d1_kb"
    return result


def transform_kb_opportunity_point(kb_row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """D1 kb_* (KasiBuy) rows that represent an unclaimed/prospective node
    (rather than an active listing) -> opportunity_points with node='KasiBuy'.

    Use this instead of transform_kb_business when the KasiBuy row
    represents a lead/prospect (no confirmed owner/listing yet) rather than
    a live business — the brief explicitly calls out KasiBuy as one of the
    `node` values opportunity_points.node is meant to hold (alongside
    "AI Café" / "FixEasy24"). Which of the two transforms applies depends on
    the concrete kb_* table's semantics once exported; both are provided so
    the operator can route each real kb_* table to whichever fits after
    inspecting export_d1.py's output.
    """
    town_raw = clean_str(_get_any(kb_row, "town", "town_name"))
    if not town_raw:
        return None
    name = clean_str(_get_any(kb_row, "name", "listing_name")) or "(unnamed KasiBuy opportunity)"
    src_id = str(_get_any(kb_row, "id") or "")

    return {
        "id": deterministic_uuid("opportunity_point", "kb", src_id),
        "town_id": None,
        "town_name_raw": town_raw,
        "town_name_norm": norm_town(town_raw),
        "_signal_source_ref": None,
        "signal_id": None,
        "name": name,
        "type": "connect",
        "status": _map_op_point_status(_get_any(kb_row, "status")),
        "owner_name": clean_str(_get_any(kb_row, "owner_name")),
        "owner_contact": clean_str(_get_any(kb_row, "owner_contact", "owner_email")),
        "node": "KasiBuy",
        "lat": to_float(_get_any(kb_row, "lat")),
        "lng": to_float(_get_any(kb_row, "lng")),
        "activated_at": _parse_ts(_get_any(kb_row, "activated_at")),
        "created_at": _parse_ts(_get_any(kb_row, "created_at")) or _now_iso(),
    }


# ===========================================================================
# 9. coordinators.earnings JSON blob (webapp Supabase) -> earnings
# ===========================================================================

def transform_coordinator_earnings_blob(
    coordinator_email: str,
    earnings_blob: Any,
) -> List[Dict[str, Any]]:
    """webapp Supabase coordinators.earnings (JSON blob) -> one or more
    `earnings` rows (the structured ledger 0001 introduces to REPLACE this
    blob per its section-7 comment: "replaces coordinators.earnings JSON
    blob").

    ASSUMED SOURCE SHAPE: a JSON array of period entries, e.g.
      [{"period": "2026-05-01", "revenue_share": 120.0, "stipend": 500.0,
        "total": 620.0, "source": {...}}, ...]
    or a single dict keyed by period:
      {"2026-05": {"revenue_share": ..., "stipend": ..., "total": ...}}
    Both shapes are handled by `_iter_earnings_entries`.

    MAPPING (per entry):
      period                -> period (date; coerced via _to_date_str,
                                defaulting to the 1st of the month if only
                                "YYYY-MM" is given)
      revenue_share            -> revenue_share
      stipend                     -> stipend
      total                          -> total (recomputed as
                                        revenue_share+stipend if absent,
                                        rather than trusting a possibly stale
                                        precomputed total)
      (everything else in the entry) -> source jsonb (preserves any
                                         program-specific breakdown fields
                                         the blob carried, e.g. per-workpack
                                         amounts, so no financial detail is
                                         silently discarded even though
                                         0001's earnings table doesn't model
                                         it as first-class columns)
      coordinator_id (resolved at load
        time from coordinator_email)      -> coordinator_id
    """
    entries = _iter_earnings_entries(earnings_blob)
    results: List[Dict[str, Any]] = []
    for entry in entries:
        period = _to_date_str(entry.get("period")) or _period_to_first_of_month(entry.get("period"))
        if not period:
            continue
        revenue_share = to_float(entry.get("revenue_share")) or 0.0
        stipend = to_float(entry.get("stipend")) or 0.0
        total = to_float(entry.get("total"))
        if total is None:
            total = round(revenue_share + stipend, 2)
        extra = {k: v for k, v in entry.items() if k not in ("period", "revenue_share", "stipend", "total")}
        results.append(
            {
                "id": deterministic_uuid("earnings", coordinator_email, str(period)),
                "_coordinator_pending_email": coordinator_email,
                "coordinator_id": None,
                "period": period,
                "revenue_share": revenue_share,
                "stipend": stipend,
                "total": total,
                "source": extra,
                "created_at": _now_iso(),
            }
        )
    return results


def _iter_earnings_entries(blob: Any) -> List[Dict[str, Any]]:
    data = blob
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except (json.JSONDecodeError, TypeError):
            return []
    if isinstance(data, list):
        return [e for e in data if isinstance(e, dict)]
    if isinstance(data, dict):
        # Could be {period: {...}} shape — normalize to a list with 'period' injected.
        out = []
        for k, v in data.items():
            if isinstance(v, dict):
                entry = dict(v)
                entry.setdefault("period", k)
                out.append(entry)
        return out
    return []


def _period_to_first_of_month(value: Any) -> Optional[str]:
    """Handle a bare "YYYY-MM" period key (common in JSON-blob ledgers) by
    anchoring it to the first of that month, since earnings.period is a
    Postgres `date` (day-granularity) not a year-month type.
    """
    s = clean_str(value)
    if not s:
        return None
    m = re.match(r"^(\d{4})-(\d{2})$", s)
    if m:
        return f"{m.group(1)}-{m.group(2)}-01"
    return None


# ===========================================================================
# MAPPING — single source of truth for source -> target field mapping,
# used by README.md and verify.py to describe/report on coverage. Kept as
# a plain nested dict (not code) so it can be dumped to JSON/markdown
# without executing anything.
# ===========================================================================

MAPPING: Dict[str, Dict[str, Any]] = {
    "coordinator_applications+coordinator_reviews": {
        "target_tables": ["applications"],
        "transform_fn": "transform_coordinator_application",
        "natural_key": "(email, town) — SAME key as the xlsx applicants importer",
        "fields": {
            "full_name|name": "applications.full_name",
            "email": "applications.email",
            "phone": "applications.phone",
            "town|town_name": "applications.town_name_raw -> applications.town_id (resolved at load)",
            "province": "applications.province",
            "role_track|role": "applications.role_track",
            "ecosystem|ecosystem_fit": "applications.ecosystem_fit",
            "score": "applications.score",
            "band": "applications.band",
            "town_status|townstatus": "applications.town_status_at_apply",
            "sub_scores": "applications.sub_scores (jsonb)",
            "status": "applications.status (mapped via _map_application_status)",
            "created_at": "applications.created_at",
            "submission_id": "applications.submission_id",
            "coordinator_reviews[].notes/decision": "applications.form_answers._reviews (jsonb array)",
            "(fixed)": "applications.source = 'd1_coordinator_applications'",
        },
    },
    "coordinators+coordinator_onboarding_*": {
        "target_tables": ["coordinators"],
        "transform_fn": "transform_coordinator",
        "natural_key": "email (resolved to users.id at load time; coordinators.id MUST equal users.id per FK)",
        "fields": {
            "email": "resolved to users.id via ensure_user_for_email() at load time",
            "full_name|display_name|name": "coordinators.display_name",
            "phone": "coordinators.phone",
            "town|town_name": "coordinators.town_name_raw -> coordinators.town_id (resolved at load)",
            "band": "coordinators.band",
            "status + onboarding_status": "coordinators.status (mapped via _map_coordinator_status)",
            "reliability_score": "coordinators.reliability_score",
            "started_at|started_field_work_at": "coordinators.started_at",
            "created_at": "coordinators.created_at",
            "(resolved)": "coordinators.application_id via (email, town) natural-key lookup against applications",
        },
    },
    "coordinator_town_assignments": {
        "target_tables": ["coordinator_assignments"],
        "transform_fn": "transform_coordinator_town_assignment",
        "natural_key": "(coordinator email, town, role_key)",
        "fields": {
            "coordinator_id": "resolved at load time to coordinators.id via pending-email link",
            "town|town_name": "coordinator_assignments.town_id (resolved at load)",
            "role|role_key": "coordinator_assignments.role_key",
            "status": "coordinator_assignments.status",
            "assigned_at": "coordinator_assignments.assigned_at",
            "ended_at": "coordinator_assignments.ended_at",
        },
    },
    "coordinator_proofs": {
        "target_tables": ["proofs", "media_assets"],
        "transform_fn": "transform_coordinator_proof",
        "natural_key": "D1 proof id",
        "fields": {
            "r2_key": "media_assets.r2_key (pointer preserved, bytes NOT re-uploaded)",
            "mime_type": "media_assets.mime_type",
            "bytes|size": "media_assets.bytes",
            "coordinator_id": "resolved at load time via pending-email link",
            "workpack_instance_id|task_id": "proofs.workpack_instance_id (resolved at load, nullable)",
            "kind|proof_kind": "proofs.kind",
            "lat, lng": "proofs.lat, proofs.lng",
            "notes": "proofs.notes",
            "status": "proofs.status",
            "reviewed_by_email": "proofs.reviewed_by (resolved at load time, nullable)",
            "reviewed_at": "proofs.reviewed_at",
            "created_at": "proofs.created_at / media_assets.created_at",
        },
    },
    "town_heartbeat_scores (D1) + town_metrics (webapp)": {
        "target_tables": ["town_scores"],
        "transform_fn": "transform_town_heartbeat_score / transform_town_metric_webapp",
        "natural_key": "(town, period) — matches town_scores' own unique constraint",
        "fields": {
            "town|town_name": "town_scores.town_id (resolved at load)",
            "period|computed_date": "town_scores.period",
            "opportunity_index": "town_scores.opportunity_index",
            "youth_population": "town_scores.youth_population",
            "vacant_spaces": "town_scores.vacant_spaces",
            "connectivity": "town_scores.connectivity",
            "entrepreneurship": "town_scores.entrepreneurship",
            "coordinator_readiness": "town_scores.coordinator_readiness",
            "funding_availability": "town_scores.funding_availability",
            "computed_at": "town_scores.computed_at",
        },
    },
    "mobile_town_signals (D1) + town_signals (webapp)": {
        "target_tables": ["signals", "media_assets"],
        "transform_fn": "transform_mobile_town_signal / transform_town_signal_webapp",
        "natural_key": "source id, prefixed by origin (mobile_town_signal | webapp_town_signal)",
        "fields": {
            "town|town_name": "signals.town_id (resolved at load)",
            "created_by|reporter_email": "signals.created_by (resolved at load)",
            "title": "signals.title (falls back to truncated description)",
            "description": "signals.description",
            "category": "signals.category",
            "(fixed)": "signals.source = 'mobile_app' | 'web'",
            "lat, lng": "signals.lat, signals.lng",
            "media_r2_key": "media_assets row + signals.media_asset_id",
            "status": "signals.status",
            "created_at": "signals.created_at",
        },
    },
    "mobile_opportunity_interests": {
        "target_tables": ["opportunity_points"],
        "transform_fn": "transform_mobile_opportunity_interest",
        "natural_key": "D1 interest id",
        "fields": {
            "town|town_name": "opportunity_points.town_id (resolved at load; row SKIPPED if unresolvable, NOT NULL column)",
            "signal_id": "opportunity_points.signal_id (resolved at load via matching signals natural key)",
            "name|business_name": "opportunity_points.name",
            "type|interest_type": "opportunity_points.type",
            "owner_name, owner_contact": "opportunity_points.owner_name, owner_contact",
            "node|ecosystem_node": "opportunity_points.node",
            "lat, lng": "opportunity_points.lat, lng",
            "status": "opportunity_points.status",
            "activated_at": "opportunity_points.activated_at",
            "created_at": "opportunity_points.created_at",
        },
    },
    "cases": {
        "target_tables": ["signals"],
        "transform_fn": "transform_case",
        "natural_key": "D1 case id, prefixed 'case'",
        "fields": {
            "town|town_name": "signals.town_id (resolved at load)",
            "title|subject": "signals.title",
            "description|details": "signals.description",
            "(fixed)": "signals.category = 'case', signals.source = 'd1_cases'",
            "status": "signals.status",
            "created_by": "signals.created_by (resolved at load)",
            "lat, lng": "signals.lat, lng",
            "created_at": "signals.created_at",
        },
    },
    "fh_* (Family House)": {
        "target_tables": ["businesses"],
        "transform_fn": "transform_fh_business",
        "natural_key": "D1 row id, prefixed 'fh'",
        "fields": {
            "name|business_name|household_name": "businesses.name",
            "category|service_type": "businesses.category (default 'family_house')",
            "town|town_name": "businesses.town_id (resolved at load)",
            "owner_email": "businesses.owner_profile_id (resolved at load ONLY with --link-owners; NULL otherwise)",
            "is_verified": "businesses.is_verified",
            "created_at": "businesses.created_at",
        },
    },
    "kb_* (KasiBuy)": {
        "target_tables": ["businesses", "opportunity_points"],
        "transform_fn": "transform_kb_business / transform_kb_opportunity_point",
        "natural_key": "D1 row id, prefixed 'kb'",
        "fields": {
            "name|business_name|listing_name": "businesses.name / opportunity_points.name",
            "category|product_category": "businesses.category (default 'kasibuy')",
            "town|town_name": "businesses.town_id / opportunity_points.town_id (resolved at load)",
            "(fixed, opportunity_points path only)": "opportunity_points.node = 'KasiBuy'",
            "is_verified": "businesses.is_verified",
            "created_at": "businesses.created_at / opportunity_points.created_at",
        },
    },
    "coordinators.earnings JSON blob (webapp)": {
        "target_tables": ["earnings"],
        "transform_fn": "transform_coordinator_earnings_blob",
        "natural_key": "(coordinator email, period)",
        "fields": {
            "period": "earnings.period",
            "revenue_share": "earnings.revenue_share",
            "stipend": "earnings.stipend",
            "total": "earnings.total (recomputed if absent from blob)",
            "(everything else in each entry)": "earnings.source (jsonb, preserves program-specific breakdown)",
        },
    },
    "xlsx: Candidate_Assessment": {
        "target_tables": ["applications"],
        "transform_fn": "import_applicants.candidate_row_to_application",
        "natural_key": "(email, town) — see import_applicants.py module docstring for the multi-town-applicant finding",
        "fields": "see import_applicants.py candidate_row_to_application docstring for the full column-by-column mapping",
    },
    "xlsx: Town_Assessment": {
        "target_tables": ["towns"],
        "transform_fn": "import_applicants.town_assessment_row_to_town",
        "natural_key": "slug(TOWN)",
        "fields": "see import_applicants.py town_assessment_row_to_town docstring",
    },
    "xlsx: Mailchimp_Clean_Upload": {
        "target_tables": ["applications (enrichment only)", "crm_contacts (optional, see note)"],
        "transform_fn": "import_applicants.build_phone_lookup",
        "natural_key": "email",
        "fields": {
            "PHONE, WHATSAPP": "joined onto applications.phone / form_answers._whatsapp by email",
            "note": (
                "Mailchimp_Clean_Upload also maps naturally onto crm_contacts "
                "(type='applicant', external_ids={'mailchimp_tags': TAGS, ...}) "
                "for the UhuruMail CRM surface (section 8 of 0001). This is NOT "
                "wired into load_supabase.py by default in Phase 3 (the brief's "
                "explicit deliverable is `applications`), but the mapping is "
                "straightforward 1:1 onto crm_contacts' columns and is a natural "
                "Phase 4 follow-up — flagged here rather than silently omitted."
            ),
        },
    },
}


if __name__ == "__main__":
    # `python transform.py` — dump the MAPPING as pretty JSON so an operator
    # (or verify.py / README generation) can inspect coverage without
    # reading the whole module.
    print(json.dumps(MAPPING, indent=2, default=str))
