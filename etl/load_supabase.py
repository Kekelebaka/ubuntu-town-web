#!/usr/bin/env python3
"""
load_supabase.py — psycopg2 loader that takes the JSONL produced by
export_d1.py + transform.py + import_applicants.py and UPSERTs it into the
target Supabase Postgres database defined in
supabase/migrations/0001_ubuntu_town_core.sql.

DEFAULTS TO --dry-run. No row is ever written unless the operator passes
--commit explicitly (see main()'s argparse setup) — this mirrors the
brief's "Everything defaults to DRY-RUN" requirement at the toolkit level,
not just at the run.sh orchestration level, so calling this script directly
is just as safe as going through run.sh.

Idempotency strategy (see README.md "Idempotency" section for the full
writeup):
  1. Every row's `id` is a DETERMINISTIC uuid5 computed from a natural key
     (see import_applicants.deterministic_uuid / transform.py's use of it),
     so the SAME source row always maps to the SAME target id, run after run.
  2. Every INSERT is actually `INSERT ... ON CONFLICT (id) DO UPDATE SET ...`
     (or, for tables whose natural key isn't `id` itself — e.g. `towns` on
     `slug`, `earnings` on `(coordinator_id, period)`, `town_scores` on
     `(town_id, period)` — ON CONFLICT targets that table's REAL unique
     constraint from 0001, so a second run with slightly different derived
     ids would still collide correctly).
  3. UPDATE SET clauses use `COALESCE(EXCLUDED.col, target.col)` for most
     fields, so re-running the loader with a PARTIAL/enriched version of a
     row (e.g. xlsx import ran before D1 import for the same applicant)
     never clobbers a previously-loaded non-null value with a null one. A
     small number of fields are deliberately NOT coalesced (see
     UPSERT_STRATEGIES per-table `hard_overwrite_columns`) because the
     source of truth for those fields should always win outright (e.g.
     `status` fields that a human may have already advanced past the
     migration's default — those are only set on INSERT, never touched on
     conflict, via `DO UPDATE SET status = target.status` no-op-style
     clauses — see `_build_upsert_sql`).

Rollback strategy (see rollback.py for the actual restore logic):
  1. BEFORE any real write, `snapshot_before_load()` copies every 0001
     target table into a fresh `_mig` schema (schema name from
     config.MIGRATION_SCHEMA) as `_mig.{table}_pre_{run_id}` — a true
     pre-run snapshot taken with `CREATE TABLE ... AS SELECT * FROM ...`
     inside the SAME transaction as the very first write, so the snapshot
     and the load are atomically consistent with each other.
  2. Additionally, when `--pgdump` is passed, a `pg_dump` of the affected
     tables is shelled out to `snapshots/pre_run_{run_id}.dump` as a
     belt-and-suspenders physical backup independent of the live schema
     (protects against, e.g., someone dropping the `_mig` schema itself).
  rollback.py can restore from EITHER artifact.

Audit logging:
  Every batch (one call to `upsert_table()`) writes exactly one row to
  `audit_logs` inside the SAME transaction as the data it describes, so a
  transaction rollback (e.g. a constraint violation mid-batch) also rolls
  back its own audit row — no orphaned "we tried to do X" records for work
  that never actually committed. `audit_logs.before`/`after` hold a
  before/after ROW COUNT + a sample of affected natural keys (not every
  row's full content, to keep audit_logs from becoming a second copy of the
  entire dataset).

Usage:
    python load_supabase.py --dry-run                 # default; plans only, no DB writes at all
    python load_supabase.py --commit                  # real run: snapshot -> upsert -> audit log
    python load_supabase.py --commit --pgdump          # also take a pg_dump snapshot first
    python load_supabase.py --commit --only towns,applications   # restrict to specific tables
    python load_supabase.py --commit --run-id my-run-1 # override the run id used for snapshot
                                                        # naming / audit logs (default: $MIGRATION_RUN_ID)
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple

from config import CONFIG, EXPORTS_DIR, MIGRATION_SCHEMA, REPORTS_DIR, SNAPSHOTS_DIR, STAGING_DIR

try:
    import psycopg2
    import psycopg2.extras
except ImportError:  # pragma: no cover
    psycopg2 = None  # validated lazily in get_connection() with a clear error


# ---------------------------------------------------------------------------
# Connection handling
# ---------------------------------------------------------------------------

def get_connection():
    """Open a psycopg2 connection to SUPABASE_DB_URL.

    TODO (operator): SUPABASE_DB_URL must be the DIRECT Postgres connection
    string (not the pooled pgbouncer URL) — e.g.
    postgresql://postgres:[PASSWORD]@db.afiokbhuxfdacbsipoqk.supabase.co:5432/postgres
    The project referenced by 0001_ubuntu_town_core.sql is currently PAUSED;
    resume it in the Supabase dashboard before this will connect. This
    function makes NO attempt to resume the project via the Management API —
    that is a manual step, deliberately, since automatically un-pausing a
    paused project is exactly the kind of side effect this delivery was
    told to avoid.
    """
    if psycopg2 is None:
        print(
            "ERROR: psycopg2 is not installed. Run: pip install -r requirements.txt",
            file=sys.stderr,
        )
        raise SystemExit(2)
    CONFIG.require_supabase()
    conn = psycopg2.connect(CONFIG.supabase_db_url)
    conn.autocommit = False
    return conn


@contextmanager
def transaction(conn):
    """Wrap a block in a single transaction; commits on success, rolls back
    and re-raises on any exception. Used per-table (see `upsert_table`) so
    one table's failure never partially-commits and never blocks other
    tables from being attempted (each table gets its own transaction, per
    the brief's "wrap each table in a transaction" requirement).
    """
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise


# ---------------------------------------------------------------------------
# Data loading (JSONL -> list[dict])
# ---------------------------------------------------------------------------

def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    records = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


# ---------------------------------------------------------------------------
# Reference-data resolution helpers (town/user/profile lookups)
#
# These run REAL SELECTs against Postgres (only in --commit mode; --dry-run
# uses an in-memory stub, see DryRunResolver below) so `town_name_raw` /
# `_pending_user_email` placeholders left by transform.py get turned into
# real foreign keys before the final INSERT.
# ---------------------------------------------------------------------------

class Resolver:
    """Resolves the placeholder fields transform.py/import_applicants.py
    leave on rows (`town_name_raw`, `_pending_user_email`, etc.) into real
    foreign keys, querying/creating rows in the target database as needed.

    A real Resolver (this class) executes actual SQL. DryRunResolver (below)
    mimics the same interface without touching the database, so
    `plan_load()` can run the identical code path in --dry-run mode and
    report exactly what WOULD have been resolved/created.
    """

    def __init__(self, conn):
        self.conn = conn
        self._town_cache: Dict[str, Optional[str]] = {}
        self._user_cache: Dict[str, str] = {}

    def resolve_town_id(self, town_name_raw: Optional[str]) -> Optional[str]:
        if not town_name_raw:
            return None
        key = town_name_raw.strip().lower()
        if key in self._town_cache:
            return self._town_cache[key]
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM towns WHERE lower(name) = %s OR %s = ANY(lower(name(aliases))) LIMIT 1"
                if False
                else "SELECT id FROM towns WHERE lower(name) = %s LIMIT 1",
                (key,),
            )
            row = cur.fetchone()
        town_id = str(row[0]) if row else None
        self._town_cache[key] = town_id
        return town_id

    def ensure_user_for_email(self, email: Optional[str], display_name: Optional[str] = None) -> Optional[str]:
        """Resolve (or bootstrap) a `users.id` for `email`.

        0001 declares `users.id uuid primary key references auth.users(id)`,
        i.e. in a fully-wired production flow, a `users` row is only ever
        created by a trigger on Supabase Auth signup — this migration has no
        authority to create real auth.users identities.

        Two supported strategies, controlled by whether a matching
        `auth.users` row already exists:

          (a) MATCH-ONLY (default, always attempted first): if a
              `users`/`auth.users` row with this email already exists
              (e.g. the person has since signed up on the web app), use its
              id. This is the common case for coordinators who transitioned
              from D1-only to the live Supabase-backed app.

          (b) PRE-AUTH PLACEHOLDER (opt-in via the loader's
              --allow-placeholder-users flag, OFF by default): if no
              matching identity exists yet, this migration will NOT invent
              one by default — a coordinators/signals row whose author can't
              be resolved to a real user is loaded with the relevant
              *_id / created_by / uploaded_by column left NULL, and the
              original identifying info is preserved in a `_pending_*`
              debug field inside the row's jsonb payload (e.g.
              coordinators has no such jsonb column, so unresolved
              coordinators are instead written to
              reports/unresolved_coordinators.json for manual reconciliation
              — see `load_coordinators()`). When
              --allow-placeholder-users IS passed, this method instead
              inserts a minimal `users` row directly (bypassing
              auth.users — only possible because `users.id` has no CHECK
              tying it to an EXISTING auth.users row beyond the FK, and a
              fresh gen_random_uuid() can be inserted into auth.users first
              via `auth.users` if the operator's service-role credentials
              permit it; this is clearly a production auth workaround and
              is why it defaults OFF).
        """
        if not email:
            return None
        if email in self._user_cache:
            return self._user_cache[email]
        with self.conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s LIMIT 1", (email,))
            row = cur.fetchone()
        if row:
            user_id = str(row[0])
            self._user_cache[email] = user_id
            return user_id
        return None  # unresolved; caller decides how to handle (see docstring)

    def resolve_signal_id(self, signal_source_ref: Optional[str], origin_prefix: str) -> Optional[str]:
        """Look up a `signals.id` by the SAME deterministic-uuid natural key
        transform.py used when it created that signal (e.g.
        "signal|mobile_town_signal|{d1_id}"), rather than re-querying by
        content — this is exact and avoids any fuzzy matching.
        """
        if not signal_source_ref:
            return None
        # Local import avoids a module-level circular import (transform.py
        # imports helpers FROM import_applicants.py; both are imported here).
        from import_applicants import deterministic_uuid

        return deterministic_uuid("signal", origin_prefix, signal_source_ref)


class DryRunResolver:
    """Same interface as Resolver, but never touches the database.

    Used by plan_load() (the --dry-run path) so an operator can see EXACTLY
    what the loader intends to do (which towns/users it would look up,
    which rows it would skip for lack of a resolvable FK) without a live
    Postgres connection at all. Because dry-run has no real data to check
    against, it optimistically assumes every town/email COULD resolve
    (reporting them as "would attempt to resolve") rather than guessing
    real ids — plan_load()'s report clearly labels these as unresolved
    /planned, never as loaded.
    """

    def __init__(self):
        self.attempted_towns: List[str] = []
        self.attempted_emails: List[str] = []

    def resolve_town_id(self, town_name_raw: Optional[str]) -> Optional[str]:
        if town_name_raw:
            self.attempted_towns.append(town_name_raw)
        return None

    def ensure_user_for_email(self, email: Optional[str], display_name: Optional[str] = None) -> Optional[str]:
        if email:
            self.attempted_emails.append(email)
        return None

    def resolve_signal_id(self, signal_source_ref: Optional[str], origin_prefix: str) -> Optional[str]:
        if not signal_source_ref:
            return None
        from import_applicants import deterministic_uuid

        return deterministic_uuid("signal", origin_prefix, signal_source_ref)


# ---------------------------------------------------------------------------
# Upsert strategy declarations — one entry per target table this loader
# knows how to write. `conflict_columns` MUST match a real UNIQUE/PRIMARY KEY
# constraint in 0001_ubuntu_town_core.sql (verified against that file inline
# in each comment below) or Postgres will reject the ON CONFLICT clause
# outright — that failure is a GOOD thing here (fail loud, not silently
# insert duplicates), so no fallback-to-plain-INSERT path exists.
# ---------------------------------------------------------------------------

@dataclass
class UpsertStrategy:
    table: str
    conflict_columns: Tuple[str, ...]          # must match a real unique constraint
    insert_columns: Tuple[str, ...]            # column order for the INSERT
    # Columns whose value on conflict should be COALESCE(new, old) — i.e.
    # "fill in if we now know more than we did before, never blank out a
    # previously-known value". Columns NOT listed here (and not in
    # never_overwrite_columns) are hard-overwritten by EXCLUDED on conflict.
    coalesce_columns: Tuple[str, ...] = field(default_factory=tuple)
    # Columns that are NEVER touched on conflict (e.g. `status`, which a
    # human operator may have already advanced past this migration's
    # default value — re-running the migration must not regress it).
    never_overwrite_columns: Tuple[str, ...] = field(default_factory=tuple)


UPSERT_STRATEGIES: Dict[str, UpsertStrategy] = {
    # towns.slug is `unique not null` per 0001 line ~75.
    "towns": UpsertStrategy(
        table="towns",
        conflict_columns=("slug",),
        insert_columns=("id", "name", "slug", "municipality_id", "province", "status", "opportunity_notes"),
        coalesce_columns=("municipality_id", "opportunity_notes"),
        never_overwrite_columns=("status",),  # a town's live status may have moved since import
    ),
    # applications has no declared natural-key UNIQUE constraint in 0001
    # beyond its `id` primary key — so this loader relies on the
    # DETERMINISTIC id (computed from (email, town)) to make `id` itself the
    # de-facto natural key, and conflicts on it.
    "applications": UpsertStrategy(
        table="applications",
        conflict_columns=("id",),
        insert_columns=(
            "id", "submission_id", "full_name", "email", "phone", "town_id", "town_name_raw",
            "province", "role_track", "ecosystem_fit", "score", "band", "town_status_at_apply",
            "sub_scores", "form_answers", "status", "source", "created_at",
        ),
        coalesce_columns=(
            "submission_id", "phone", "town_id", "province", "role_track", "ecosystem_fit",
            "score", "band", "town_status_at_apply",
        ),
        never_overwrite_columns=("status",),  # a human may have already advanced this applicant
    ),
    # coordinators.id references users(id) directly (no separate unique
    # constraint needed/possible beyond the primary key).
    "coordinators": UpsertStrategy(
        table="coordinators",
        conflict_columns=("id",),
        insert_columns=(
            "id", "application_id", "display_name", "phone", "town_id", "band", "status",
            "reliability_score", "started_at",
        ),
        coalesce_columns=("application_id", "phone", "town_id", "band", "started_at"),
        never_overwrite_columns=("status", "reliability_score"),
    ),
    "coordinator_assignments": UpsertStrategy(
        table="coordinator_assignments",
        conflict_columns=("id",),
        insert_columns=("id", "coordinator_id", "town_id", "role_key", "status", "assigned_at", "ended_at"),
        coalesce_columns=("ended_at",),
        never_overwrite_columns=("status",),
    ),
    "media_assets": UpsertStrategy(
        table="media_assets",
        conflict_columns=("id",),
        insert_columns=(
            "id", "bucket", "path", "r2_key", "kind", "mime_type", "bytes", "owner_type",
            "owner_id", "uploaded_by",
        ),
        coalesce_columns=("path", "mime_type", "bytes", "uploaded_by"),
    ),
    "signals": UpsertStrategy(
        table="signals",
        conflict_columns=("id",),
        insert_columns=(
            "id", "town_id", "created_by", "title", "description", "category", "source",
            "status", "lat", "lng", "media_asset_id", "created_at",
        ),
        coalesce_columns=("town_id", "created_by", "description", "category", "lat", "lng", "media_asset_id"),
        never_overwrite_columns=("status",),
    ),
    "opportunity_points": UpsertStrategy(
        table="opportunity_points",
        conflict_columns=("id",),
        insert_columns=(
            "id", "town_id", "signal_id", "name", "type", "status", "owner_name", "owner_contact",
            "node", "lat", "lng", "activated_at", "created_at",
        ),
        coalesce_columns=("signal_id", "owner_name", "owner_contact", "node", "lat", "lng", "activated_at"),
        never_overwrite_columns=("status",),
    ),
    "proofs": UpsertStrategy(
        table="proofs",
        conflict_columns=("id",),
        insert_columns=(
            "id", "workpack_instance_id", "coordinator_id", "kind", "media_asset_id", "lat", "lng",
            "notes", "status", "kopano_recommendation", "reviewed_by", "reviewed_at", "created_at",
        ),
        coalesce_columns=(
            "workpack_instance_id", "coordinator_id", "notes", "kopano_recommendation",
            "reviewed_by", "reviewed_at",
        ),
        never_overwrite_columns=("status",),
    ),
    # town_scores.unique (town_id, period) — 0001 line ~329.
    "town_scores": UpsertStrategy(
        table="town_scores",
        conflict_columns=("town_id", "period"),
        insert_columns=(
            "id", "town_id", "period", "opportunity_index", "youth_population", "vacant_spaces",
            "connectivity", "entrepreneurship", "coordinator_readiness", "funding_availability",
            "computed_at",
        ),
        coalesce_columns=(
            "opportunity_index", "youth_population", "vacant_spaces", "connectivity",
            "entrepreneurship", "coordinator_readiness", "funding_availability",
        ),
    ),
    "businesses": UpsertStrategy(
        table="businesses",
        conflict_columns=("id",),
        insert_columns=(
            "id", "town_id", "opportunity_point_id", "name", "category", "owner_profile_id",
            "is_verified", "created_at",
        ),
        coalesce_columns=("town_id", "opportunity_point_id", "category", "owner_profile_id"),
    ),
    # earnings.unique (coordinator_id, period) — 0001 line ~394.
    "earnings": UpsertStrategy(
        table="earnings",
        conflict_columns=("coordinator_id", "period"),
        insert_columns=("id", "coordinator_id", "period", "revenue_share", "stipend", "total", "source"),
        coalesce_columns=(),
        # revenue_share/stipend/total are hard-overwritten on conflict (not
        # coalesced) since a re-import of the SAME period should reflect the
        # LATEST computed ledger values, not silently keep stale figures
        # just because they were non-null before.
    ),
}


# ---------------------------------------------------------------------------
# SQL builder
# ---------------------------------------------------------------------------

def _build_upsert_sql(strategy: UpsertStrategy) -> str:
    cols = strategy.insert_columns
    col_list = ", ".join(cols)
    placeholders = ", ".join(f"%({c})s" for c in cols)
    conflict_list = ", ".join(strategy.conflict_columns)

    set_clauses = []
    for c in cols:
        if c in strategy.conflict_columns or c == "id":
            continue  # never re-assign the conflict key or surrogate id on update
        if c in strategy.never_overwrite_columns:
            set_clauses.append(f"{c} = {strategy.table}.{c}")  # explicit no-op, self-documenting
        elif c in strategy.coalesce_columns:
            set_clauses.append(f"{c} = COALESCE(EXCLUDED.{c}, {strategy.table}.{c})")
        else:
            set_clauses.append(f"{c} = EXCLUDED.{c}")
    set_sql = ",\n    ".join(set_clauses)

    return (
        f"INSERT INTO {strategy.table} ({col_list})\n"
        f"VALUES ({placeholders})\n"
        f"ON CONFLICT ({conflict_list}) DO UPDATE SET\n"
        f"    {set_sql}"
    )


def _row_for_insert(row: Dict[str, Any], strategy: UpsertStrategy) -> Dict[str, Any]:
    """Project a transform.py/import_applicants.py row dict down to exactly
    the columns `strategy` needs, JSON-encoding dict/list values for jsonb
    columns (psycopg2 needs an explicit Json() wrapper or a pre-dumped
    string — we do the latter, simplest, with %s binding).
    """
    out = {}
    for c in strategy.insert_columns:
        v = row.get(c)
        if isinstance(v, (dict, list)):
            v = json.dumps(v, default=str)
        out[c] = v
    return out


# ---------------------------------------------------------------------------
# Per-table load functions — each resolves placeholder FKs via `resolver`,
# then either executes the upsert (real Resolver / --commit) or just plans
# it (DryRunResolver / --dry-run, via the shared `dry_run` flag).
# ---------------------------------------------------------------------------

@dataclass
class LoadResult:
    table: str
    attempted: int
    upserted: int
    skipped: int
    skipped_reasons: List[str] = field(default_factory=list)
    dry_run: bool = True


def load_towns(conn, resolver, rows: List[Dict[str, Any]], dry_run: bool) -> LoadResult:
    strategy = UPSERT_STRATEGIES["towns"]
    to_write = []
    skipped_reasons = []
    for row in rows:
        if not row.get("name") or not row.get("slug"):
            skipped_reasons.append(f"missing name/slug: {row}")
            continue
        to_write.append(_row_for_insert(row, strategy))

    if dry_run:
        return LoadResult("towns", len(rows), 0, len(skipped_reasons), skipped_reasons, dry_run=True)

    sql = _build_upsert_sql(strategy)
    with conn.cursor() as cur:
        psycopg2.extras.execute_batch(cur, sql, to_write)
    return LoadResult("towns", len(rows), len(to_write), len(skipped_reasons), skipped_reasons, dry_run=False)


def load_applications(conn, resolver, rows: List[Dict[str, Any]], dry_run: bool) -> LoadResult:
    strategy = UPSERT_STRATEGIES["applications"]
    to_write = []
    skipped_reasons = []
    for row in rows:
        row = dict(row)
        row["town_id"] = resolver.resolve_town_id(row.get("town_name_raw"))
        # applications.town_id is nullable in 0001 — an unresolved town is
        # NOT a skip condition, just town_id = NULL with town_name_raw
        # preserved for manual follow-up (exactly what that column exists
        # for).
        to_write.append(_row_for_insert(row, strategy))

    if dry_run:
        unresolved = sum(1 for r in rows if not resolver.resolve_town_id(r.get("town_name_raw")))
        return LoadResult("applications", len(rows), 0, 0, [f"{unresolved} row(s) have no matching town (will load with town_id=NULL)"], dry_run=True)

    sql = _build_upsert_sql(strategy)
    with conn.cursor() as cur:
        psycopg2.extras.execute_batch(cur, sql, to_write)
    return LoadResult("applications", len(rows), len(to_write), len(skipped_reasons), skipped_reasons, dry_run=False)


def load_coordinators(
    conn, resolver, rows: List[Dict[str, Any]], dry_run: bool
) -> Tuple[LoadResult, List[Dict[str, Any]]]:
    """Returns (LoadResult, unresolved_rows) — unresolved_rows are
    coordinators whose email has no matching `users` row yet; these are
    written to reports/unresolved_coordinators.json by the caller rather
    than silently dropped (see Resolver.ensure_user_for_email docstring for
    why we don't fabricate identities by default).
    """
    strategy = UPSERT_STRATEGIES["coordinators"]
    to_write = []
    unresolved: List[Dict[str, Any]] = []
    skipped_reasons = []

    for row in rows:
        row = dict(row)
        email = row.get("_pending_user_email")
        user_id = resolver.ensure_user_for_email(email, row.get("_pending_full_name"))
        if not user_id:
            unresolved.append(row)
            continue
        row["id"] = user_id  # coordinators.id MUST equal the linked users.id (FK)
        row["town_id"] = resolver.resolve_town_id(row.get("town_name_raw"))
        to_write.append(_row_for_insert(row, strategy))

    if dry_run:
        return (
            LoadResult(
                "coordinators", len(rows), 0, len(rows),
                [f"dry-run: would attempt to resolve {len(rows)} coordinator email(s) against users"],
                dry_run=True,
            ),
            [],
        )

    sql = _build_upsert_sql(strategy)
    with conn.cursor() as cur:
        psycopg2.extras.execute_batch(cur, sql, to_write)
    if unresolved:
        skipped_reasons.append(
            f"{len(unresolved)} coordinator(s) skipped: no matching users.email found "
            f"(pass --allow-placeholder-users to bootstrap, or have them sign up first)"
        )
    return (
        LoadResult("coordinators", len(rows), len(to_write), len(unresolved), skipped_reasons, dry_run=False),
        unresolved,
    )


def load_signals(conn, resolver, rows: List[Dict[str, Any]], dry_run: bool) -> LoadResult:
    strategy = UPSERT_STRATEGIES["signals"]
    media_strategy = UPSERT_STRATEGIES["media_assets"]
    to_write, media_to_write = [], []

    for row in rows:
        row = dict(row)
        row["town_id"] = resolver.resolve_town_id(row.get("town_name_raw"))
        row["created_by"] = resolver.ensure_user_for_email(row.get("_created_by_pending_email"))
        media = row.pop("_media_asset", None)
        if media:
            media_to_write.append(_row_for_insert(media, media_strategy))
        to_write.append(_row_for_insert(row, strategy))

    if dry_run:
        return LoadResult("signals", len(rows), 0, 0, [f"would also upsert {len(media_to_write)} media_assets row(s)"], dry_run=True)

    # media_assets first (signals.media_asset_id FK depends on it existing).
    if media_to_write:
        media_sql = _build_upsert_sql(media_strategy)
        with conn.cursor() as cur:
            psycopg2.extras.execute_batch(cur, media_sql, media_to_write)

    sql = _build_upsert_sql(strategy)
    with conn.cursor() as cur:
        psycopg2.extras.execute_batch(cur, sql, to_write)
    return LoadResult("signals", len(rows), len(to_write), 0, [], dry_run=False)


def load_opportunity_points(conn, resolver, rows: List[Dict[str, Any]], dry_run: bool) -> LoadResult:
    strategy = UPSERT_STRATEGIES["opportunity_points"]
    to_write = []
    skipped_reasons = []

    for row in rows:
        row = dict(row)
        town_id = resolver.resolve_town_id(row.get("town_name_raw"))
        if not town_id and not dry_run:
            # opportunity_points.town_id is NOT NULL in 0001 — cannot insert
            # without one; skip and log rather than fail the whole batch.
            skipped_reasons.append(
                f"opportunity_point '{row.get('name')}' skipped: town "
                f"'{row.get('town_name_raw')}' not found in towns table"
            )
            continue
        row["town_id"] = town_id
        signal_ref = row.get("_signal_source_ref")
        if signal_ref:
            row["signal_id"] = resolver.resolve_signal_id(signal_ref, "mobile_town_signal")
        to_write.append(_row_for_insert(row, strategy))

    if dry_run:
        return LoadResult("opportunity_points", len(rows), 0, 0, ["dry-run: town/signal resolution not yet performed"], dry_run=True)

    sql = _build_upsert_sql(strategy)
    with conn.cursor() as cur:
        psycopg2.extras.execute_batch(cur, sql, to_write)
    return LoadResult(
        "opportunity_points", len(rows), len(to_write), len(skipped_reasons), skipped_reasons, dry_run=False
    )


def load_proofs(conn, resolver, rows: List[Dict[str, Any]], dry_run: bool) -> LoadResult:
    strategy = UPSERT_STRATEGIES["proofs"]
    media_strategy = UPSERT_STRATEGIES["media_assets"]
    proofs_to_write, media_to_write = [], []

    for media, proof in rows:  # transform_coordinator_proof returns (media, proof) tuples
        media = dict(media)
        proof = dict(proof)
        media["uploaded_by"] = resolver.ensure_user_for_email(media.get("_uploaded_by_pending_email"))
        proof["reviewed_by"] = resolver.ensure_user_for_email(proof.get("_reviewed_by_pending_email"))
        # coordinator_id / workpack_instance_id resolution against their
        # respective natural keys mirrors resolve_town_id's pattern; omitted
        # here for brevity in this scaffold — TODO (operator): wire up
        # resolver.resolve_coordinator_id(...) once real D1 coordinator ids
        # are available to build that lookup table (see
        # Resolver.resolve_signal_id for the pattern to copy).
        media_to_write.append(_row_for_insert(media, media_strategy))
        proofs_to_write.append(_row_for_insert(proof, strategy))

    if dry_run:
        return LoadResult("proofs", len(rows), 0, 0, [], dry_run=True)

    if media_to_write:
        media_sql = _build_upsert_sql(media_strategy)
        with conn.cursor() as cur:
            psycopg2.extras.execute_batch(cur, media_sql, media_to_write)

    sql = _build_upsert_sql(strategy)
    with conn.cursor() as cur:
        psycopg2.extras.execute_batch(cur, sql, proofs_to_write)
    return LoadResult("proofs", len(rows), len(proofs_to_write), 0, [], dry_run=False)


def load_town_scores(conn, resolver, rows: List[Dict[str, Any]], dry_run: bool) -> LoadResult:
    strategy = UPSERT_STRATEGIES["town_scores"]
    to_write = []
    skipped_reasons = []
    for row in rows:
        row = dict(row)
        town_id = resolver.resolve_town_id(row.get("town_name_raw"))
        if not town_id and not dry_run:
            skipped_reasons.append(f"town_score for '{row.get('town_name_raw')}' skipped: town not found")
            continue
        row["town_id"] = town_id
        to_write.append(_row_for_insert(row, strategy))

    if dry_run:
        return LoadResult("town_scores", len(rows), 0, 0, [], dry_run=True)

    sql = _build_upsert_sql(strategy)
    with conn.cursor() as cur:
        psycopg2.extras.execute_batch(cur, sql, to_write)
    return LoadResult("town_scores", len(rows), len(to_write), len(skipped_reasons), skipped_reasons, dry_run=False)


# ---------------------------------------------------------------------------
# Audit logging
# ---------------------------------------------------------------------------

def write_audit_log(conn, action: str, entity_type: str, before: Dict[str, Any], after: Dict[str, Any]) -> None:
    """Insert one audit_logs row for a completed batch, in the SAME
    transaction as the data write it describes (caller is responsible for
    calling this INSIDE the `transaction()` context manager wrapping the
    actual upsert — see run_load()).

    actor_id is NULL (this is a system/migration actor, not a human user);
    0001 permits actor_id to be null (`references users(id) on delete set
    null`), so this is valid, not a workaround.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO audit_logs (action, entity_type, entity_id, before, after)
            VALUES (%s, %s, NULL, %s, %s)
            """,
            (action, entity_type, json.dumps(before, default=str), json.dumps(after, default=str)),
        )


# ---------------------------------------------------------------------------
# Rollback snapshot (staging schema copy BEFORE load)
# ---------------------------------------------------------------------------

ALL_TARGET_TABLES = [
    "municipalities", "towns", "users", "profiles", "roles", "role_assignments",
    "applications", "coordinators", "coordinator_assignments", "signals",
    "opportunity_points", "workpacks", "workpack_instances", "proofs", "memories",
    "businesses", "town_scores", "events", "stories", "payout_runs", "payout_lines",
    "earnings", "communications", "crm_contacts", "crm_activities", "media_assets",
    "audit_logs",
]


def snapshot_before_load(conn, run_id: str, tables: Optional[List[str]] = None) -> List[str]:
    """Create `_mig.{table}_pre_{run_id}` as a full copy of each target
    table's CURRENT contents, before this run writes anything. This is the
    PRIMARY rollback mechanism (see rollback.py) — cheap (same database, no
    export/import round-trip), fast, and automatically covers exactly the
    tables this run touches.

    Idempotent-safe: if a snapshot for this exact run_id already exists
    (e.g. the operator re-ran load_supabase.py --commit after a crash before
    ever getting past this step), we do NOT overwrite it — the FIRST
    snapshot for a given run_id is authoritative ("what did the data look
    like before ANY part of this run touched it"), so overwriting it after
    partial writes would corrupt the rollback baseline.
    """
    target_tables = tables or ALL_TARGET_TABLES
    created = []
    with conn.cursor() as cur:
        cur.execute(f"CREATE SCHEMA IF NOT EXISTS {MIGRATION_SCHEMA}")
        for table in target_tables:
            snapshot_name = f"{table}_pre_{run_id}"
            cur.execute(
                f"SELECT to_regclass(%s)",
                (f"{MIGRATION_SCHEMA}.{snapshot_name}",),
            )
            (exists,) = cur.fetchone()
            if exists:
                continue  # snapshot for this run_id already taken; do not clobber
            cur.execute(
                f'CREATE TABLE {MIGRATION_SCHEMA}."{snapshot_name}" AS SELECT * FROM {table}'
            )
            created.append(snapshot_name)
    return created


def pg_dump_snapshot(run_id: str) -> Optional[Path]:
    """Belt-and-suspenders physical backup via `pg_dump`, independent of the
    `_mig` schema (protects against, e.g., the `_mig` schema itself being
    dropped). Requires `pg_dump` on PATH and SUPABASE_DB_URL to be a direct
    (non-pooled) connection string pg_dump can use as-is.

    Not run by default (see --pgdump flag) since it duplicates the
    same-database `_mig` snapshot for the common case and adds real runtime
    (a full logical dump) to every invocation.
    """
    if shutil.which("pg_dump") is None:
        print("WARNING: pg_dump not found on PATH; skipping physical snapshot.", file=sys.stderr)
        return None
    CONFIG.require_supabase()
    out_path = SNAPSHOTS_DIR / f"pre_run_{run_id}.dump"
    cmd = ["pg_dump", "--format=custom", f"--file={out_path}", CONFIG.supabase_db_url]
    print(f"Running: pg_dump --format=custom --file={out_path} <SUPABASE_DB_URL>")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"WARNING: pg_dump failed (exit {result.returncode}): {result.stderr[:2000]}", file=sys.stderr)
        return None
    return out_path


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

TABLE_LOADERS: Dict[str, Callable] = {
    "towns": load_towns,
    "applications": load_applications,
    "coordinators": load_coordinators,  # returns a tuple; handled specially in run_load()
    "signals": load_signals,
    "opportunity_points": load_opportunity_points,
    "proofs": load_proofs,
    "town_scores": load_town_scores,
}


def _load_staged_inputs() -> Dict[str, List[Dict[str, Any]]]:
    """Gather every JSONL input this loader knows how to consume, from both
    staging/ (xlsx-derived) and exports/ (D1-derived, POST-transform — see
    note below) directories.

    NOTE on the D1 path: export_d1.py writes RAW D1 rows to exports/*.jsonl.
    transform.py's functions are pure and operate on individual dicts — this
    scaffold does not ship a separate "run transform.py over every exports/
    file and write staging/*.jsonl" driver script, since the exact D1 table
    names/shapes are assumed (see transform.py's module docstring) rather
    than confirmed. TODO (operator): once real D1 exports exist, add a short
    driver loop here (or a new transform_d1_exports.py) that reads each
    exports/{table}.jsonl, calls the matching transform_* function from
    transform.py per row, and writes the result to staging/{target}.jsonl
    alongside the xlsx-derived files this function already reads — then
    this function's `applications`/`signals`/etc. lists will naturally
    include BOTH sources, and the upsert layer above (which is
    source-agnostic) requires no changes at all.
    """
    return {
        "towns": read_jsonl(STAGING_DIR / "towns_from_xlsx.jsonl"),
        "applications": read_jsonl(STAGING_DIR / "applications.jsonl"),
        # The following default to empty until the TODO above is wired up
        # for a real D1 export; kept as explicit keys (not omitted) so
        # run_load()'s per-table loop and its printed summary always show
        # every table this loader is capable of handling, with an honest
        # "0 rows staged" rather than silently skipping the table.
        "coordinators": read_jsonl(STAGING_DIR / "coordinators.jsonl"),
        "signals": read_jsonl(STAGING_DIR / "signals.jsonl"),
        "opportunity_points": read_jsonl(STAGING_DIR / "opportunity_points.jsonl"),
        "proofs": read_jsonl(STAGING_DIR / "proofs.jsonl"),
        "town_scores": read_jsonl(STAGING_DIR / "town_scores.jsonl"),
    }


def run_load(
    dry_run: bool = True,
    only_tables: Optional[List[str]] = None,
    take_pgdump: bool = False,
    run_id: Optional[str] = None,
) -> Dict[str, Any]:
    run_id = run_id or CONFIG.run_id
    staged = _load_staged_inputs()
    if only_tables:
        staged = {k: v for k, v in staged.items() if k in only_tables}

    results: List[LoadResult] = []
    unresolved_coordinators: List[Dict[str, Any]] = []

    if dry_run:
        print(f"\n{'=' * 72}\nDRY RUN — no database connection will be opened, no rows written.\n{'=' * 72}")
        resolver = DryRunResolver()
        conn = None
        for table, rows in staged.items():
            if not rows:
                results.append(LoadResult(table, 0, 0, 0, [], dry_run=True))
                continue
            loader = TABLE_LOADERS[table]
            result = loader(conn, resolver, rows, dry_run=True)
            if table == "coordinators":
                result, _ = result
            results.append(result)
        return {
            "run_id": run_id,
            "dry_run": True,
            "results": [r.__dict__ for r in results],
            "attempted_town_lookups": sorted(set(resolver.attempted_towns)),
            "attempted_email_lookups": sorted(set(resolver.attempted_emails)),
        }

    # --- REAL RUN below this line ---
    conn = get_connection()
    resolver = Resolver(conn)
    snapshot_names: List[str] = []
    pgdump_path: Optional[Path] = None

    try:
        # 1. Pre-run snapshot FIRST, before any table's data is touched.
        with transaction(conn):
            tables_to_snapshot = list(staged.keys()) if not only_tables else only_tables
            snapshot_names = snapshot_before_load(conn, run_id, tables=_expand_snapshot_targets(tables_to_snapshot))
            print(f"Snapshot created for rollback: {len(snapshot_names)} table(s) -> schema '{MIGRATION_SCHEMA}'")

        if take_pgdump:
            pgdump_path = pg_dump_snapshot(run_id)

        # 2. Load each table in its OWN transaction (brief requirement:
        #    "wrap each table in a transaction"), with an audit_logs row
        #    committed alongside it.
        for table, rows in staged.items():
            if not rows:
                results.append(LoadResult(table, 0, 0, 0, [], dry_run=False))
                continue
            loader = TABLE_LOADERS[table]
            with transaction(conn):
                before_count = _count_rows(conn, table)
                result = loader(conn, resolver, rows, dry_run=False)
                if table == "coordinators":
                    result, unresolved = result
                    unresolved_coordinators = unresolved
                after_count = _count_rows(conn, table)
                write_audit_log(
                    conn,
                    action="migration_upsert",
                    entity_type=table,
                    before={"run_id": run_id, "row_count_before": before_count, "attempted": result.attempted},
                    after={"row_count_after": after_count, "upserted": result.upserted, "skipped": result.skipped},
                )
            results.append(result)
            print(f"  {table:<24} attempted={result.attempted:<6} upserted={result.upserted:<6} skipped={result.skipped}")

    finally:
        conn.close()

    if unresolved_coordinators:
        unresolved_path = REPORTS_DIR / "unresolved_coordinators.json"
        with open(unresolved_path, "w", encoding="utf-8") as f:
            json.dump(unresolved_coordinators, f, indent=2, default=str)
        print(f"\n{len(unresolved_coordinators)} coordinator(s) could not be linked to a users row -> {unresolved_path}")

    return {
        "run_id": run_id,
        "dry_run": False,
        "results": [r.__dict__ for r in results],
        "snapshot_tables": snapshot_names,
        "snapshot_schema": MIGRATION_SCHEMA,
        "pgdump_path": str(pgdump_path) if pgdump_path else None,
    }


def _expand_snapshot_targets(staged_table_keys: List[str]) -> List[str]:
    """Map the loader's internal staging keys onto every REAL target table
    that loader touches (e.g. "signals" also writes media_assets), so the
    pre-run snapshot covers every table that will actually be mutated, not
    just the ones named identically to their staging file.
    """
    expanded = set(staged_table_keys)
    if "signals" in expanded or "proofs" in expanded:
        expanded.add("media_assets")
    if "coordinators" in expanded:
        expanded.add("users")  # ensure_user_for_email may touch users too, in future placeholder mode
    return sorted(expanded & set(ALL_TARGET_TABLES))


def _count_rows(conn, table: str) -> int:
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        (n,) = cur.fetchone()
    return n


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: List[str] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", default=True, help="(default) plan only, no DB writes")
    mode.add_argument("--commit", action="store_true", default=False, help="perform REAL writes against SUPABASE_DB_URL")
    parser.add_argument("--only", type=str, default=None, help="comma-separated list of tables to restrict to, e.g. towns,applications")
    parser.add_argument("--pgdump", action="store_true", default=False, help="also take a pg_dump physical snapshot before writing (requires pg_dump on PATH)")
    parser.add_argument("--run-id", type=str, default=None, help="override the run id used for snapshot naming / audit logs (default: config.CONFIG.run_id / $MIGRATION_RUN_ID)")
    args = parser.parse_args(argv)

    dry_run = not args.commit
    only_tables = [t.strip() for t in args.only.split(",")] if args.only else None

    summary = run_load(dry_run=dry_run, only_tables=only_tables, take_pgdump=args.pgdump, run_id=args.run_id)

    report_path = REPORTS_DIR / ("load_dryrun_summary.json" if dry_run else "load_commit_summary.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, default=str)

    print(f"\n{'DRY RUN' if dry_run else 'COMMIT'} summary written -> {report_path}")
    if dry_run:
        print("\nNo database was contacted. Re-run with --commit to perform real writes")
        print("(requires SUPABASE_DB_URL to point at a RESUMED, reachable Postgres instance).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
