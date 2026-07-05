#!/usr/bin/env python3
"""
rollback.py — restore target Supabase tables from a pre-run snapshot, undoing
a `load_supabase.py --commit` run.

Two independent rollback mechanisms, mirroring the two snapshot mechanisms
`load_supabase.py` can take (see its `snapshot_before_load()` /
`pg_dump_snapshot()`):

  1. LOGICAL ROLLBACK (default, always available for any --commit run)
     Every table `load_supabase.py` is about to touch gets copied, in full,
     into `_mig.{table}_pre_{run_id}` BEFORE any write happens. Rolling back
     means, for each such table, inside ONE transaction:
         DELETE FROM {table};
         INSERT INTO {table} SELECT * FROM _mig.{table}_pre_{run_id};
     This is a same-database operation — fast, no export/import round-trip,
     and works even if the operator never took a pg_dump. It restores the
     table to EXACTLY its pre-run state, including rows that existed before
     the migration touched the table and were not related to this migration
     at all (a full snapshot, not a diff).

  2. PHYSICAL ROLLBACK (only if `--pgdump` was passed to load_supabase.py)
     Restores the whole database (or a whitelisted set of tables) from the
     `pg_dump --format=custom` file at snapshots/pre_run_{run_id}.dump via
     `pg_restore`. This is the belt-and-suspenders path: it works even if
     the `_mig` schema itself was somehow dropped or corrupted, at the cost
     of requiring `pg_restore` on PATH and (for a full-database restore)
     usually more privileges / more downtime than the logical path.

SAFETY
  - This script REFUSES to run without an explicit `--run-id` (there is no
    "rollback whatever the last run was" default) — the operator must name
    the exact run being undone, visible in reports/load_commit_summary.json.
  - Like every other script in this toolkit, the default is DRY RUN: it
    prints exactly what it WOULD restore (which tables, from which snapshot,
    how many rows currently vs. how many rows the snapshot has) and makes
    zero writes unless `--commit` is passed.
  - Before overwriting a table, rollback.py takes its own
    "pre-rollback" safety snapshot (`_mig.{table}_pre_rollback_{run_id}`) —
    so even an accidental/wrong rollback is itself undoable by re-running
    this same table restore against that safety net.
  - Rollback of a single table is one transaction; rollback of the whole run
    is NOT one giant transaction across all tables (mirrors
    `load_supabase.py`'s own per-table transaction boundary), so a failure
    partway through a multi-table rollback leaves the already-rolled-back
    tables rolled back and reports exactly which tables were not reached.

Usage:
    # See what a rollback of run "2026-07-05T10-00-00Z" would do (no writes):
    python rollback.py --run-id 2026-07-05T10-00-00Z --dry-run

    # Actually perform the logical rollback for that run:
    python rollback.py --run-id 2026-07-05T10-00-00Z --commit

    # Restrict to specific tables (e.g. you only want to undo `applications`):
    python rollback.py --run-id 2026-07-05T10-00-00Z --commit --only applications

    # Physical rollback via pg_restore instead (requires --pgdump was used
    # on the original load_supabase.py run):
    python rollback.py --run-id 2026-07-05T10-00-00Z --commit --method pgdump

    # List every snapshot currently sitting in the _mig schema (across all
    # run_ids) so you can find the right --run-id in the first place:
    python rollback.py --list-snapshots

TODO (operator): requires SUPABASE_DB_URL (see config.py / README.md). This
script makes NO attempt to resume a paused Supabase project — do that first
in the dashboard.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from config import CONFIG, MIGRATION_SCHEMA, REPORTS_DIR, SNAPSHOTS_DIR

try:
    import psycopg2
except ImportError:
    psycopg2 = None

# Reuse load_supabase.py's own list of every table this toolkit ever writes
# to, so rollback.py never drifts out of sync with what a real load run can
# touch (importing this constant, rather than copy-pasting it, means a
# future edit to 0001's table list only needs to happen in one place).
from load_supabase import ALL_TARGET_TABLES, get_connection, transaction


@dataclass
class TableRollbackPlan:
    table: str
    snapshot_name: str
    snapshot_exists: bool
    current_row_count: Optional[int] = None
    snapshot_row_count: Optional[int] = None
    note: str = ""


@dataclass
class RollbackResult:
    table: str
    action: str  # "restored" | "skipped_no_snapshot" | "would_restore" | "failed"
    rows_before: Optional[int] = None
    rows_after: Optional[int] = None
    safety_snapshot: Optional[str] = None
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Discovery
# ---------------------------------------------------------------------------

def list_all_snapshots(conn) -> List[Dict[str, Any]]:
    """List every `_mig.{table}_pre_{run_id}` (and `_pre_rollback_{run_id}`)
    table currently in the database, grouped so an operator can find the
    right --run-id without having to remember it. Read-only; safe to call
    any time.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT table_name,
                   (SELECT reltuples::bigint FROM pg_class
                     WHERE oid = (quote_ident(table_schema) || '.' || quote_ident(table_name))::regclass) AS approx_rows
            FROM information_schema.tables
            WHERE table_schema = %s
            ORDER BY table_name
            """,
            (MIGRATION_SCHEMA,),
        )
        rows = cur.fetchall()
    return [{"snapshot_table": r[0], "approx_row_count": r[1]} for r in rows]


def _snapshot_name_for(table: str, run_id: str, suffix: str = "pre") -> str:
    if suffix == "pre":
        return f"{table}_pre_{run_id}"
    return f"{table}_pre_rollback_{run_id}"


def _table_exists(conn, schema: str, table: str) -> bool:
    with conn.cursor() as cur:
        cur.execute("SELECT to_regclass(%s)", (f"{schema}.{table}",))
        (exists,) = cur.fetchone()
    return exists is not None


def _count_rows(conn, schema: str, table: str) -> int:
    with conn.cursor() as cur:
        cur.execute(f'SELECT COUNT(*) FROM {schema}."{table}"' if schema else f"SELECT COUNT(*) FROM {table}")
        (n,) = cur.fetchone()
    return n


def build_rollback_plan(conn, run_id: str, tables: Optional[List[str]] = None) -> List[TableRollbackPlan]:
    """Inspect (read-only) which of `tables` (default: ALL_TARGET_TABLES)
    actually have a `_mig.{table}_pre_{run_id}` snapshot to roll back to, and
    how many rows are on each side, WITHOUT changing anything. This is what
    both --dry-run and --commit run first, so --commit's plan is guaranteed
    to be exactly what --dry-run showed the operator a moment earlier.
    """
    target_tables = tables or ALL_TARGET_TABLES
    plans = []
    for table in target_tables:
        snapshot_name = _snapshot_name_for(table, run_id)
        exists = _table_exists(conn, MIGRATION_SCHEMA, snapshot_name)
        plan = TableRollbackPlan(table=table, snapshot_name=snapshot_name, snapshot_exists=exists)
        if exists:
            plan.current_row_count = _count_rows(conn, None, table)
            plan.snapshot_row_count = _count_rows(conn, MIGRATION_SCHEMA, snapshot_name)
            if plan.current_row_count == plan.snapshot_row_count:
                plan.note = "row counts match current snapshot — rollback may be a no-op, but will still run (contents could differ with same count)"
        else:
            plan.note = f"no snapshot named {MIGRATION_SCHEMA}.{snapshot_name} — this table was not touched by run {run_id}, or the snapshot was already cleaned up"
        plans.append(plan)
    return plans


# ---------------------------------------------------------------------------
# Logical rollback (from _mig schema)
# ---------------------------------------------------------------------------

def rollback_table_logical(conn, plan: TableRollbackPlan, run_id: str, take_safety_snapshot: bool = True) -> RollbackResult:
    """Restore a single table from its `_mig.{table}_pre_{run_id}` snapshot,
    inside one transaction: take a "pre-rollback" safety snapshot of the
    table's CURRENT (about-to-be-discarded) contents, DELETE everything from
    the live table, then INSERT everything back from the snapshot.

    Safe to call even if a previous attempt at this same rollback partially
    ran and failed — DELETE + INSERT is naturally idempotent given the SAME
    snapshot source (re-running it just deletes-and-reinserts the same
    target rows again).
    """
    if not plan.snapshot_exists:
        return RollbackResult(table=plan.table, action="skipped_no_snapshot")

    safety_name = _snapshot_name_for(plan.table, run_id, suffix="rollback")
    try:
        with transaction(conn):
            with conn.cursor() as cur:
                if take_safety_snapshot and not _table_exists(conn, MIGRATION_SCHEMA, safety_name):
                    cur.execute(f"CREATE SCHEMA IF NOT EXISTS {MIGRATION_SCHEMA}")
                    cur.execute(
                        f'CREATE TABLE {MIGRATION_SCHEMA}."{safety_name}" AS SELECT * FROM {plan.table}'
                    )
                rows_before = _count_rows(conn, None, plan.table)
                cur.execute(f'DELETE FROM {plan.table}')
                cur.execute(
                    f'INSERT INTO {plan.table} SELECT * FROM {MIGRATION_SCHEMA}."{plan.snapshot_name}"'
                )
                rows_after = _count_rows(conn, None, plan.table)
        return RollbackResult(
            table=plan.table,
            action="restored",
            rows_before=rows_before,
            rows_after=rows_after,
            safety_snapshot=f"{MIGRATION_SCHEMA}.{safety_name}" if take_safety_snapshot else None,
        )
    except Exception as exc:  # noqa: BLE001 - report per-table failure, let sibling tables still be attempted
        return RollbackResult(table=plan.table, action="failed", error=str(exc))


# ---------------------------------------------------------------------------
# Physical rollback (from pg_dump / pg_restore)
# ---------------------------------------------------------------------------

def rollback_via_pgdump(run_id: str, tables: Optional[List[str]] = None, dry_run: bool = True) -> Dict[str, Any]:
    """Restore from snapshots/pre_run_{run_id}.dump via pg_restore.

    Requires that `load_supabase.py --commit --pgdump` was used for the
    original run (otherwise the dump file will not exist — checked and
    reported clearly rather than raising an obscure subprocess error).

    `pg_restore --clean --if-exists` is used so re-running this is itself
    idempotent (each object is dropped-if-exists before being recreated),
    and `--data-only` is NOT used by default — a full schema+data restore is
    the safest way to guarantee an exact return to the pre-run state,
    including any structural change (unlikely mid-migration, but possible)
    that might have happened between snapshot and now.
    """
    dump_path = SNAPSHOTS_DIR / f"pre_run_{run_id}.dump"
    if not dump_path.exists():
        return {
            "method": "pgdump",
            "status": "error",
            "message": f"No pg_dump snapshot found at {dump_path}. This run must have been made with "
                       f"`load_supabase.py --commit --pgdump` for a physical rollback to be available; "
                       f"otherwise use the default logical rollback (omit --method pgdump).",
        }
    if shutil.which("pg_restore") is None:
        return {"method": "pgdump", "status": "error", "message": "pg_restore not found on PATH."}

    CONFIG.require_supabase()
    cmd = ["pg_restore", "--clean", "--if-exists", "--no-owner", f"--dbname={CONFIG.supabase_db_url}"]
    if tables:
        for t in tables:
            cmd.extend(["--table", t])
    cmd.append(str(dump_path))

    if dry_run:
        return {
            "method": "pgdump",
            "status": "dry_run",
            "would_run": " ".join(cmd[:-1]) + f" {dump_path}",
            "dump_path": str(dump_path),
            "note": "pg_restore has no built-in --dry-run; this shows the exact command --commit would execute. "
                    "Inspect the dump's table of contents first with: pg_restore --list " + str(dump_path),
        }

    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    return {
        "method": "pgdump",
        "status": "restored" if result.returncode == 0 else "failed",
        "returncode": result.returncode,
        "stdout_tail": result.stdout[-2000:],
        "stderr_tail": result.stderr[-2000:],
        "dump_path": str(dump_path),
    }


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def run_rollback(
    run_id: str,
    dry_run: bool = True,
    only_tables: Optional[List[str]] = None,
    method: str = "logical",
) -> Dict[str, Any]:
    if method == "pgdump":
        result = rollback_via_pgdump(run_id, tables=only_tables, dry_run=dry_run)
        return {"run_id": run_id, "method": "pgdump", "dry_run": dry_run, "result": result}

    # method == "logical"
    conn = get_connection()
    try:
        plans = build_rollback_plan(conn, run_id, tables=only_tables)
        available = [p for p in plans if p.snapshot_exists]
        missing = [p for p in plans if not p.snapshot_exists]

        if dry_run:
            return {
                "run_id": run_id,
                "method": "logical",
                "dry_run": True,
                "would_restore": [p.__dict__ for p in available],
                "no_snapshot_found": [p.table for p in missing],
            }

        results: List[RollbackResult] = []
        for plan in available:
            result = rollback_table_logical(conn, plan, run_id)
            results.append(result)
            status_word = result.action.upper()
            print(f"  {plan.table:<24} {status_word:<20} rows_before={result.rows_before} rows_after={result.rows_after}")
            if result.error:
                print(f"    ERROR: {result.error}", file=sys.stderr)

        return {
            "run_id": run_id,
            "method": "logical",
            "dry_run": False,
            "restored": [r.__dict__ for r in results if r.action == "restored"],
            "failed": [r.__dict__ for r in results if r.action == "failed"],
            "no_snapshot_found": [p.table for p in missing],
        }
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: List[str] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--run-id", type=str, default=None, help="the exact run_id to roll back (see reports/load_commit_summary.json). Required unless --list-snapshots.")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", default=True, help="(default) show the rollback plan, make no writes")
    mode.add_argument("--commit", action="store_true", default=False, help="perform the REAL rollback (writes to the database)")
    parser.add_argument("--only", type=str, default=None, help="comma-separated list of tables to restrict the rollback to")
    parser.add_argument("--method", type=str, choices=["logical", "pgdump"], default="logical", help="'logical' (default, restores from the _mig schema) or 'pgdump' (restores from a pg_dump file; requires the original load used --pgdump)")
    parser.add_argument("--list-snapshots", action="store_true", default=False, help="list every snapshot currently in the _mig schema and exit (does not require --run-id)")
    args = parser.parse_args(argv)

    if args.list_snapshots:
        if psycopg2 is None:
            print("ERROR: psycopg2 is not installed. Run: pip install -r requirements.txt", file=sys.stderr)
            return 2
        CONFIG.require_supabase()
        conn = psycopg2.connect(CONFIG.supabase_db_url)
        try:
            snapshots = list_all_snapshots(conn)
        finally:
            conn.close()
        if not snapshots:
            print(f"No snapshots found in schema '{MIGRATION_SCHEMA}'.")
        else:
            print(f"Snapshots in schema '{MIGRATION_SCHEMA}':")
            for s in snapshots:
                print(f"  - {s['snapshot_table']:<50} ~{s['approx_row_count']} rows")
        return 0

    if not args.run_id:
        parser.error("--run-id is required (see reports/load_commit_summary.json for the run_id of the load you want to undo), unless using --list-snapshots")

    if psycopg2 is None:
        print("ERROR: psycopg2 is not installed. Run: pip install -r requirements.txt", file=sys.stderr)
        return 2

    # Fail fast on missing credentials BEFORE printing the dry-run/commit
    # banner below. The "logical" method needs a live (read-only, for
    # --dry-run) connection to inspect current row counts, so there is no
    # meaningful offline plan for it (unlike verify.py, which has a real
    # offline mode) — better to say so immediately than print a banner and
    # then error. The "pgdump" method's dry-run needs no connection at all
    # (it only inspects the local dump file), so it is exempt here and
    # checks credentials itself, lazily, only when it actually restores.
    if args.method == "logical":
        CONFIG.require_supabase()

    dry_run = not args.commit
    only_tables = [t.strip() for t in args.only.split(",")] if args.only else None

    if dry_run:
        print(f"{'=' * 72}\nDRY RUN — showing rollback plan for run_id={args.run_id!r}. No writes will be made.\n{'=' * 72}")
    else:
        print(f"{'=' * 72}\nCOMMIT — rolling back run_id={args.run_id!r}. This WILL overwrite live tables.\n{'=' * 72}")

    summary = run_rollback(run_id=args.run_id, dry_run=dry_run, only_tables=only_tables, method=args.method)

    report_path = REPORTS_DIR / f"rollback_{'dryrun' if dry_run else 'commit'}_{args.run_id}.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, default=str)

    print(json.dumps(summary, indent=2, default=str))
    print(f"\nRollback report written -> {report_path}")

    if dry_run:
        print("\nNo database was contacted for writes. Re-run with --commit to perform the real rollback.")

    pgdump_status = summary.get("result", {}).get("status")
    had_failure = pgdump_status in ("failed", "error") or bool(summary.get("failed"))
    return 1 if had_failure else 0


if __name__ == "__main__":
    sys.exit(main())
