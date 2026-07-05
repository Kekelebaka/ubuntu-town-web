#!/usr/bin/env python3
"""
Ubuntu Town OS — D1 -> Supabase legacy loader (Phase 3, bulk verbatim capture)

Copies Cloudflare D1 operational tables VERBATIM into a Postgres `legacy` schema
as jsonb (one row per D1 row). Idempotent, batched, with verify + rollback.
Runs directly against both APIs from your machine — no MCP token/size limits.

WHY legacy/jsonb:  D1 tables like cases, fh_*, kb_* have no canonical `uto`
target yet, and `coordinators` is FK-bound to auth.users. Verbatim-in-`legacy`
gets 100% of D1's unique data into Supabase now ("D1 holds no unique data"),
to reconcile into `uto` later.

Canonical recruitment data (34 towns + 46 applicants) is ALREADY loaded into
`uto` by the assistant — this script does NOT touch `uto`.

--------------------------------------------------------------------------------
SETUP
    pip install requests psycopg2-binary
    export CF_API_TOKEN=...            # Cloudflare token with D1:read
    export CF_ACCOUNT_ID=c63d3d6d8c17db7487ab40b81d5e29d1
    export D1_DATABASE_ID=60a25642-4cf8-4778-ba7b-2e8d269c5be5
    export SUPABASE_DB_URL='postgresql://postgres:PASSWORD@db.afiokbhuxfdacbsipoqk.supabase.co:5432/postgres'
    #   ^ Supabase dashboard -> Settings -> Database -> Connection string (Direct/Session, port 5432)

USAGE
    python3 legacy_load.py                 # DRY-RUN: discover + plan + row counts, writes nothing
    python3 legacy_load.py --commit        # load verbatim into legacy schema (idempotent upserts)
    python3 legacy_load.py --commit --all  # also include the big derived log tables
    python3 legacy_load.py --verify        # compare D1 vs legacy counts, print report
    python3 legacy_load.py --rollback --commit   # DROP the legacy schema (undo)
--------------------------------------------------------------------------------
"""
import os, sys, json, hashlib, argparse, time
import requests
import psycopg2
from psycopg2.extras import execute_values

CF_TOKEN = os.environ.get("CF_API_TOKEN")
CF_ACCT  = os.environ.get("CF_ACCOUNT_ID", "c63d3d6d8c17db7487ab40b81d5e29d1")
D1_DB    = os.environ.get("D1_DATABASE_ID", "60a25642-4cf8-4778-ba7b-2e8d269c5be5")
PG_URL   = os.environ.get("SUPABASE_DB_URL")

# Derived / high-volume machine tables — skipped by default (recomputable, not source-of-truth)
DERIVED_SKIP = {"coordinator_reliability_history", "town_heartbeat_scores", "autonomy_worker_logs"}
BATCH = 200

def die(msg):
    print(f"ERROR: {msg}"); sys.exit(1)

def d1(sql):
    """Run one SQL statement against Cloudflare D1, return list-of-dict rows."""
    if not CF_TOKEN: die("CF_API_TOKEN not set")
    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCT}/d1/database/{D1_DB}/query"
    r = requests.post(url, headers={"Authorization": f"Bearer {CF_TOKEN}",
                                    "Content-Type": "application/json"},
                      json={"sql": sql}, timeout=60)
    j = r.json()
    if not j.get("success"):
        die(f"D1 query failed: {j.get('errors')}")
    res = j["result"]
    # D1 returns [{results:[...], meta:{...}}]
    return (res[0].get("results") or []) if res else []

def list_tables(include_derived):
    rows = d1("SELECT name FROM sqlite_master WHERE type='table' "
              "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'd1_%' "
              "ORDER BY name")
    names = [r["name"] for r in rows]
    if not include_derived:
        names = [n for n in names if n not in DERIVED_SKIP]
    return names

def src_id(row):
    if isinstance(row, dict) and row.get("id") not in (None, ""):
        return str(row["id"])
    return hashlib.sha1(json.dumps(row, sort_keys=True).encode()).hexdigest()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--commit", action="store_true", help="actually write (default: dry-run)")
    ap.add_argument("--all", action="store_true", help="include derived/log tables")
    ap.add_argument("--verify", action="store_true", help="only compare counts")
    ap.add_argument("--rollback", action="store_true", help="drop the legacy schema")
    ap.add_argument("--only", default="", help="comma-separated table subset")
    args = ap.parse_args()
    if not PG_URL: die("SUPABASE_DB_URL not set")

    pg = psycopg2.connect(PG_URL)
    pg.autocommit = False
    cur = pg.cursor()

    if args.rollback:
        if not args.commit:
            print("[dry-run] would DROP SCHEMA legacy CASCADE. Re-run with --commit to execute."); return
        cur.execute("drop schema if exists legacy cascade;")
        pg.commit(); print("Rolled back: legacy schema dropped."); return

    tables = list_tables(args.all)
    if args.only:
        want = {t.strip() for t in args.only.split(",")}
        tables = [t for t in tables if t in want]
    print(f"Target tables ({len(tables)}): {', '.join(tables)}")
    if not args.all:
        print(f"(skipping derived: {', '.join(sorted(DERIVED_SKIP))} — use --all to include)")

    if args.commit and not args.verify:
        cur.execute("create schema if not exists legacy;")
        cur.execute("create table if not exists legacy.migration_audit("
                    "tbl text primary key, d1_count int, loaded int, ran_at timestamptz default now());")

    report = []
    for t in tables:
        d1_rows = d1(f'SELECT * FROM "{t}"')
        d1_count = len(d1_rows)
        legacy_tbl = f'd1_{t}'
        if args.verify:
            try:
                cur.execute(f'select count(*) from legacy."{legacy_tbl}"'); loaded = cur.fetchone()[0]
            except Exception: pg.rollback(); loaded = None
            status = "OK" if loaded == d1_count else "MISMATCH"
            report.append((t, d1_count, loaded, status)); continue
        if not args.commit:
            report.append((t, d1_count, "-", "dry-run")); continue
        # create target + upsert
        cur.execute(f'create table if not exists legacy."{legacy_tbl}"'
                    '(src_id text primary key, d jsonb not null, migrated_at timestamptz default now());')
        vals = [(src_id(r), json.dumps(r)) for r in d1_rows]
        for i in range(0, len(vals), BATCH):
            chunk = vals[i:i+BATCH]
            execute_values(cur,
                f'insert into legacy."{legacy_tbl}"(src_id, d) values %s '
                'on conflict (src_id) do update set d=excluded.d, migrated_at=now()',
                chunk, template="(%s, %s::jsonb)")
        cur.execute(f'select count(*) from legacy."{legacy_tbl}"'); loaded = cur.fetchone()[0]
        cur.execute("insert into legacy.migration_audit(tbl,d1_count,loaded) values(%s,%s,%s) "
                    "on conflict (tbl) do update set d1_count=excluded.d1_count, loaded=excluded.loaded, ran_at=now()",
                    (t, d1_count, loaded))
        report.append((t, d1_count, loaded, "OK" if loaded>=d1_count else "CHECK"))
        print(f"  loaded legacy.{legacy_tbl}: {loaded}/{d1_count}")

    if args.commit and not args.verify:
        pg.commit()

    print("\n%-34s %8s %8s  %s" % ("TABLE","D1","LEGACY","STATUS"))
    for t,a,b,s in report:
        print("%-34s %8s %8s  %s" % (t, a, b, s))
    print(f"\nTotal D1 rows across targets: {sum(r[1] for r in report)}")
    cur.close(); pg.close()

if __name__ == "__main__":
    main()
