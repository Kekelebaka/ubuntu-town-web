#!/usr/bin/env python3
"""
d1_inventory.py — snapshot the existing data volume in the source D1 database
BEFORE touching anything, so every later step (export, load, verify) has a
ground-truth baseline to reconcile against.

What it does:
  1. Lists every user table in D1 (via sqlite_master, excluding internal
     sqlite_/_cf_/d1_ tables).
  2. Counts rows in each table (SELECT COUNT(*)).
  3. Writes the result to etl/reports/d1_inventory.json.
  4. Prints a human-readable table to stdout ("existing data volume").

This is the FIRST step in run.sh and is read-only against D1 — it never
mutates anything, so it is always safe to re-run.

Usage:
    python d1_inventory.py                  # hits the live D1 API (needs creds)
    python d1_inventory.py --tables-only    # just print discovered table names, skip counts

TODO (operator): requires CF_API_TOKEN + CF_ACCOUNT_ID in the environment/.env.
Will not run against the live API without them — see config.py.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

from config import CONFIG, REPORTS_DIR
from d1_client import D1Client, D1ClientError

INVENTORY_JSON_PATH = REPORTS_DIR / "d1_inventory.json"


def build_inventory(client: D1Client) -> Dict:
    """Query D1 for every table + its row count, returning a JSON-serializable dict."""
    tables = client.list_tables()
    per_table: List[Dict] = []
    total_rows = 0
    errors: List[Dict] = []

    for table in tables:
        try:
            count = client.count_rows(table)
            columns = client.table_columns(table)
        except D1ClientError as exc:
            errors.append({"table": table, "error": str(exc)})
            continue
        per_table.append(
            {
                "table": table,
                "row_count": count,
                "column_count": len(columns),
                "columns": columns,
            }
        )
        total_rows += count

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "d1_database_id": CONFIG.d1_database_id,
        "table_count": len(per_table),
        "total_rows": total_rows,
        "tables": sorted(per_table, key=lambda t: t["table"]),
        "errors": errors,
    }


def print_inventory_table(inventory: Dict) -> None:
    """Pretty-print the 'existing data volume' table to stdout."""
    print()
    print("=" * 72)
    print(f"D1 SOURCE INVENTORY — existing data volume  (db={inventory['d1_database_id']})")
    print(f"Generated: {inventory['generated_at']}")
    print("=" * 72)
    name_w = max([len("TABLE")] + [len(t["table"]) for t in inventory["tables"]]) + 2
    print(f"{'TABLE'.ljust(name_w)}{'ROWS'.rjust(10)}{'COLUMNS'.rjust(10)}")
    print("-" * (name_w + 20))
    for t in inventory["tables"]:
        print(f"{t['table'].ljust(name_w)}{str(t['row_count']).rjust(10)}{str(t['column_count']).rjust(10)}")
    print("-" * (name_w + 20))
    print(f"{'TOTAL'.ljust(name_w)}{str(inventory['total_rows']).rjust(10)}{str(inventory['table_count']).rjust(10)} tables")
    if inventory["errors"]:
        print()
        print(f"WARNING: {len(inventory['errors'])} table(s) failed to inventory:")
        for e in inventory["errors"]:
            print(f"  - {e['table']}: {e['error']}")
    print("=" * 72)
    print()


def write_inventory_json(inventory: Dict, path: Path = INVENTORY_JSON_PATH) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(inventory, f, indent=2, sort_keys=False)
    return path


def main(argv: List[str] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--tables-only",
        action="store_true",
        help="Only list table names (skip COUNT(*) queries); useful for a quick connectivity check.",
    )
    args = parser.parse_args(argv)

    client = D1Client()

    if args.tables_only:
        tables = client.list_tables()
        print(f"Found {len(tables)} user tables in D1 database {CONFIG.d1_database_id}:")
        for t in tables:
            print(f"  - {t}")
        return 0

    inventory = build_inventory(client)
    print_inventory_table(inventory)
    out_path = write_inventory_json(inventory)
    print(f"Wrote inventory JSON -> {out_path}")

    if inventory["errors"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
