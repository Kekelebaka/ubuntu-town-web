# ETL Runbook — D1 → Supabase (Phase 3 bulk migration)

Run `legacy_load.py` on your machine. It copies every operational Cloudflare D1
table **verbatim** into a Postgres `legacy` schema (jsonb), idempotently, with
verify + rollback. No MCP token/size limits apply when run locally.

> Already done by the assistant (do NOT redo): `uto.towns` (33) and
> `uto.applications` (46) canonical; and `legacy.d1_coordinators/‑reviews/‑town_assignments`
> (3/4/3). `legacy_load.py` is idempotent, so re-running is safe — it upserts.

## 1. Install
```bash
cd ubuntu-town-os-db/etl
pip install requests psycopg2-binary
```

## 2. Set credentials
```bash
export CF_API_TOKEN='<Cloudflare token with D1:read>'          # Cloudflare dashboard → My Profile → API Tokens
export CF_ACCOUNT_ID='c63d3d6d8c17db7487ab40b81d5e29d1'
export D1_DATABASE_ID='60a25642-4cf8-4778-ba7b-2e8d269c5be5'   # ubuntu-town-db
export SUPABASE_DB_URL='postgresql://postgres:<PASSWORD>@db.afiokbhuxfdacbsipoqk.supabase.co:5432/postgres'
#   Supabase dashboard → Settings → Database → Connection string → "Direct" (port 5432). Copy the password.
```

## 3. Dry-run (writes nothing — always do this first)
```bash
python3 legacy_load.py
```
Prints the target tables (all operational D1 tables minus the 3 derived log tables) and their live D1 row counts. Expect ~39 tables incl. `coordinator_applications` (19), `cases` (21), `case_actions` (12), `fh_*` (~40), `kb_*` (~6).

## 4. Commit the load
```bash
python3 legacy_load.py --commit
```
Creates `legacy.d1_<table>(src_id, d jsonb, migrated_at)` for each, upserts every row on `src_id` (idempotent), and writes a `legacy.migration_audit` row per table. Prints `loaded/d1` per table + a summary.

Options:
- `--all` also copies the 3 big derived tables (`coordinator_reliability_history`, `town_heartbeat_scores`, `autonomy_worker_logs` — ~6,500 rows; usually skip, they're recomputable).
- `--only cases,case_actions` restrict to a subset.

## 5. Verify
```bash
python3 legacy_load.py --verify
```
Prints `D1 vs LEGACY` counts per table with `OK` / `MISMATCH`. Every operational table should read `OK`.

## 6. Rollback (if needed)
```bash
python3 legacy_load.py --rollback --commit     # DROP SCHEMA legacy CASCADE
```
Only touches `legacy` — `uto` (canonical) and `public` (web app) are never affected.

## Safety
- Non-destructive: only creates/writes the `legacy` schema. Never alters `uto` or `public`.
- Idempotent: re-run any time; rows upsert on `src_id` (the D1 `id`, or a content hash).
- Transactional: the whole commit is one transaction — it all lands or none does.
- POPIA: `coordinator_applications` carries PII + consent flags; the jsonb preserves them verbatim for the consented reconciliation into `uto` later.

## After the legacy load — reconcile into canonical (next phase, assistant-assisted)
1. Map `legacy.d1_coordinator_applications` real (non-test) rows → `uto.applications` (dedupe vs Mailchimp by email).
2. Provision `auth.users` for the 3 real coordinators → then `uto.coordinators` + `uto.coordinator_assignments`.
3. Add canonical `uto` tables (or keep in legacy) for Family House / KasiBuy / cases as Phase-2 scope.
