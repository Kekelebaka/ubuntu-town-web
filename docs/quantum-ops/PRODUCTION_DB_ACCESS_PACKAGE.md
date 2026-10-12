# PRODUCTION_DB_ACCESS_PACKAGE.md — 0024_learnings production migration

Status: **BLOCKED — no production database authority exists in the Hermes execution environment.**
Produced 2026-10-12 per the Release Lock Resolution order (no credentials requested or exposed).

## Finding (why BLOCKED)
Verified the environment has NO authorized production DB access through any existing secret/environment
mechanism (all checks read-only, names/flags only — no secret values retrieved or shown):
- Environment variables: no `SUPABASE_*` / `DATABASE_*` / `POSTGRES_*` / `PG*` / `*_DB_URL` / `*_DB_PASS`.
- Hermes secret store: only `~/.hermes/config.yaml` (no secret/credential files).
- Supabase CLI: `AccessTokenRequiredError` (not logged in; no `SUPABASE_ACCESS_TOKEN`).
- Hermes vault: empty (no saved Supabase/DB login).
- Deploy env `.env.local.uto`: only public `SUPABASE_URL` + anon key (production `afiokbhuxfdacbsipoqk`);
  NO service-role key, NO direct DB connection string.
Consequence: production migration state (is 0024 applied?) and recovery mechanism cannot be independently
verified, and 0024 cannot be applied from here. **PRODUCTION MIGRATION: BLOCKED.**

---

## A. EXACT ACCESS REQUIRED
A one-transaction psql connection to the production Supabase Postgres, OR the Supabase Management API with
migration/SQL scope. Either enables verifying migration state + applying 0024 in a controlled transaction.
- Direct psql: host `db.afiokbhuxfdacbsipoqk.supabase.co`, port `5432`, dbname `postgres`, role `postgres`,
  and its database password.
- OR a Supabase **access token** (`SUPABASE_ACCESS_TOKEN`) with access to project `afiokbhuxfdacbsipoqk`,
  to link the project and read migration state (still apply via psql one-transaction, not `db push`).

## B. MINIMUM PRIVILEGE REQUIRED
- Connect to project `afiokbhuxfdacbsipoqk` Postgres.
- `CREATE` on schema `uto` (create table `uto.learnings` + function + triggers + policies + grants).
- `SELECT` on the migration ledger (`supabase_migrations.schema_migrations`) to verify state.
- Read on `uto.users`, `uto.towns`, `uto.community_work`, `uto.missions`, `uto.workpacks`, `uto.proofs`
  (FK targets — verify they exist before apply).
- NOT required: service-role API key; NOT a superuser beyond the migration DDL; no DML on existing tables.

## C. EXACT PRODUCTION PROJECT
Supabase project ref **`afiokbhuxfdacbsipoqk`** (project: Ubuntu Town OS production; `SUPABASE_URL`
`https://afiokbhuxfdacbsipoqk.supabase.co`). This must be independently confirmed to BE the intended
production project before any apply (distinct from staging `lgbkfthojyxhwemgkpgo`).

## D. EXACT RECOVERY EVIDENCE REQUIRED (before apply)
Establish the ACTUAL recovery mechanism for THIS project and that it is sufficient for this migration:
1. Supabase **PITR** (Point-in-Time Recovery) availability/retention for `afiokbhuxfdacbsipoqk` — OR
2. a verified logical **pg_dump** taken immediately pre-migration and confirmed restorable, OR
3. a confirmed project-level backup within the migration window.
Record: mechanism type, timestamp, retention window, restore method. "Backups exist somewhere" is NOT
sufficient — pre-migration recovery must be verified specific to this project.

## E. EXACT MIGRATION COMMAND (one transaction; NO `db push`)
```bash
# 1) PRE-MIGRATION RECOVERY POINT (required by D)
PGPASSWORD='<prod-db-password>' pg_dump -h db.afiokbhuxfdacbsipoqk.supabase.co -p 5432 -U postgres -d postgres \
  --schema=uto --schema=supabase_migrations > PRE_0024_$(date -u +%Y%m%dT%H%M%SZ).sql

# 2) VERIFY NOT ALREADY APPLIED
PGPASSWORD='<prod-db-password>' psql -h db.afiokbhuxfdacbsipoqk.supabase.co -p 5432 -U postgres -d postgres \
  -tAc "select count(*) from supabase_migrations.schema_migrations where version like '0024%';"   # expect 0

# 3) APPLY — one controlled transaction, abort on any error
PGPASSWORD='<prod-db-password>' psql -h db.afiokbhuxfdacbsipoqk.supabase.co -p 5432 -U postgres -d postgres \
  --single-transaction -v ON_ERROR_STOP=1 -f supabase/migrations/0024_learnings.sql
```
Checksum of `supabase/migrations/0024_learnings.sql`: sha256 `3837eb98bf5dde4f059ca13391d72db5`.
Rules: one transaction; `ON_ERROR_STOP`; never `db push`; no unrelated migrations; do not modify 0015–0017;
no destructive rollback once real learning records exist (prefer app rollback + forward-fix).

## F. EXACT POST-MIGRATION VERIFICATION QUERIES
```sql
select count(*) from information_schema.tables where table_schema='uto' and table_name='learnings';      -- 1
select count(*) from information_schema.columns where table_schema='uto' and table_name='learnings';      -- 22
select relrowsecurity, relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='uto' and c.relname='learnings';                                                        -- t, t
select count(*) from pg_policies where schemaname='uto' and tablename='learnings';                        -- 6
select count(*) from pg_indexes where schemaname='uto' and tablename='learnings';                         -- 9
select count(*) from pg_trigger tg join pg_class c on c.oid=tg.tgrelid
  where tg.tgname='learnings_immutable_trg' and c.relname='learnings';                                    -- 1
```
Behavioral (run `scripts/validation/learnings_validation.py` against the project, expect 11/11):
- `uto.learnings` exists; 22 columns; expected RLS policies; expected indexes; expected grants;
  immutability trigger works; supersedes/versioning works; BMC Delta distinct from Passport Delta;
  unauthenticated write denied; unauthorized write denied; cross-town access denied; cross-initiative access denied.

## G. EXACT OPERATOR STEPS (if the operator runs it manually)
1. Supabase Dashboard → project `afiokbhuxfdacbsipoqk` → Database → Backups → confirm PITR/backup (Section D).
2. Database → SQL Editor → run the Section F pre-checks (confirm `uto.learnings` not present).
3. Database → SQL Editor → run the ENTIRE `supabase/migrations/0024_learnings.sql` in ONE query tab/transaction
   (the file is idempotent and self-contained). Alternatively `\i` via the dashboard's psql.
4. Run the Section F verification queries; confirm counts (1/22/t,t/6/9/1).
5. Run `scripts/validation/learnings_validation.py` (11/11) against this project.
6. Capture the evidence in Section H and return it.

## H. EXACT EVIDENCE HERMES NEEDS AFTERWARD (to unblock the migration gate)
- Confirmation of the target project ref (`afiokbhuxfdacbsipoqk`) as intended production.
- Migration state result (0024 not previously applied) + the apply result (exit 0 / committed).
- Migration execution timestamp + operator identity + the checksum applied (`3837eb98…`).
- Recovery evidence: PITR availability window or the pre-migration dump filename + timestamp.
- The Section F verification query outputs (counts 1/22/t,t/6/9/1) and the `learnings_validation.py` result (11/11).
- (For the later golden slice) an authorized operator identity + scope for a real, non-fabricated slice.

---
**No production mutation performed. No credentials requested or exposed.** Release sequence remains gated at
DATABASE AUTHORITY → RECOVERY VERIFIED before DOMAIN → MERGE → DEPLOY → MIGRATION → …
