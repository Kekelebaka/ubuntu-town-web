#!/usr/bin/env python3
"""
export_d1.py — export every D1 table to newline-delimited JSON (JSONL) under
etl/exports/{table}.jsonl, paginated by rowid (LIMIT/OFFSET).

Why export to disk first (rather than streaming D1 -> transform -> Supabase
in one pass)?
  1. Idempotency: transform.py and load_supabase.py can be re-run any number
     of times against the SAME frozen export without re-hitting the D1 API
     (which is rate-limited and, more importantly, may have moved on if the
     live app is still writing to D1 during the migration window).
  2. Auditability: exports/*.jsonl is the immutable "what we actually read
     from the source" record, independent of any bug in the transform layer.
  3. Offline development: this whole toolkit ships without live creds; once
     an operator has real exports, transform.py/verify.py can be developed
     and tested against them without ever touching the source system again.

Each line in {table}.jsonl is one JSON object = one D1 row, with an injected
`_export_meta` sibling file ({table}.meta.json) recording row count, export
timestamp, and the D1 columns seen — used by verify.py for row-count
reconciliation against d1_inventory.json.

Usage:
    python export_d1.py                    # export ALL discovered tables
    python export_d1.py --tables coordinators coordinator_applications
    python export_d1.py --page-size 500

TODO (operator): requires CF_API_TOKEN + CF_ACCOUNT_ID. Safe to re-run —
each run overwrites the previous export for the tables it touches (the
export itself is not "the load", so idempotency here just means
"deterministic given the same source state", not ON CONFLICT semantics).
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from config import CONFIG, EXPORTS_DIR
from d1_client import D1Client, D1ClientError


def export_table(client: D1Client, table: str, page_size: int, out_dir: Path) -> Dict:
    """Export a single D1 table to {out_dir}/{table}.jsonl.

    Returns a metadata dict (also written alongside as {table}.meta.json).
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    jsonl_path = out_dir / f"{table}.jsonl"
    meta_path = out_dir / f"{table}.meta.json"

    row_count = 0
    columns_seen: List[str] = []
    tmp_path = jsonl_path.with_suffix(".jsonl.tmp")

    with open(tmp_path, "w", encoding="utf-8") as f:
        for row in client.iter_all_rows(table, page_size=page_size):
            if not columns_seen:
                columns_seen = list(row.keys())
            f.write(json.dumps(row, ensure_ascii=False, default=str))
            f.write("\n")
            row_count += 1

    # Atomic-ish replace: only overwrite the real file once the full export
    # succeeded, so a failed/interrupted export never leaves a half-written
    # {table}.jsonl that a later step might silently treat as complete.
    tmp_path.replace(jsonl_path)

    meta = {
        "table": table,
        "row_count": row_count,
        "columns": columns_seen,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "d1_database_id": CONFIG.d1_database_id,
        "page_size": page_size,
        "jsonl_path": str(jsonl_path),
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    return meta


def export_all(
    client: D1Client,
    tables: Optional[List[str]] = None,
    page_size: int = 1000,
    out_dir: Path = EXPORTS_DIR,
) -> List[Dict]:
    target_tables = tables or client.list_tables()
    results: List[Dict] = []
    for table in target_tables:
        print(f"Exporting {table} ...", end=" ", flush=True)
        try:
            meta = export_table(client, table, page_size=page_size, out_dir=out_dir)
        except D1ClientError as exc:
            print(f"FAILED: {exc}")
            results.append({"table": table, "error": str(exc)})
            continue
        print(f"{meta['row_count']} rows -> {meta['jsonl_path']}")
        results.append(meta)

    # Write a manifest summarizing this export run, used by verify.py to
    # cross-check exports/*.jsonl row counts against reports/d1_inventory.json
    # (source-vs-export reconciliation, distinct from export-vs-load
    # reconciliation which verify.py also does against Postgres).
    manifest_path = out_dir / "_manifest.json"
    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "d1_database_id": CONFIG.d1_database_id,
        "tables": results,
    }
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nExport manifest -> {manifest_path}")
    return results


def main(argv: List[str] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--tables",
        nargs="*",
        default=None,
        help="Specific table names to export (default: every table discovered via sqlite_master).",
    )
    parser.add_argument(
        "--page-size",
        type=int,
        default=1000,
        help="Rows per D1 API page (LIMIT). Default 1000.",
    )
    parser.add_argument(
        "--out-dir",
        type=str,
        default=str(EXPORTS_DIR),
        help=f"Output directory for {{table}}.jsonl files. Default {EXPORTS_DIR}",
    )
    args = parser.parse_args(argv)

    client = D1Client()
    results = export_all(
        client,
        tables=args.tables,
        page_size=args.page_size,
        out_dir=Path(args.out_dir),
    )

    failed = [r for r in results if "error" in r]
    if failed:
        print(f"\n{len(failed)} table(s) failed to export:", file=sys.stderr)
        for r in failed:
            print(f"  - {r['table']}: {r['error']}", file=sys.stderr)
        return 1

    total_rows = sum(r["row_count"] for r in results)
    print(f"\nExported {len(results)} tables, {total_rows} total rows.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
