# PRODUCTION MIGRATION PACKAGE — 0024_learnings.sql

Status: **READY** (prepared, NOT applied). Production apply is a **production action** (approval boundary).
MIG-01 remains independently governed; **C-06 is NOT silently resolved** (see GOVERNANCE_DECISIONS.md).
This is a controlled one-transaction operation — **NEVER `db push`**.

- **Exact SQL file**: `supabase/migrations/0024_learnings.sql` (sha256 `3837eb98bf5dde4f059ca13391d72db5`).
- **Revalidated against**: the production `uto` baseline schema (46 tables; recovered production ledger +
  staging mirror `ubuntu-town-web-standalone`). NOT a live production query (production-safety: no prod reads
  for discovery). Preconditions below must be re-checked against prod at apply time by an authorised operator.

## 1. Dependencies
- Schema `uto` must exist (production operational home).
- `uto.users`, `uto.towns`, `uto.proofs`, `uto.outcomes`, `uto.workpacks` (FK targets; present in baseline).
- Enum types `truth_class_enum`, `work_learning_role`, `user_level_enum` (present in baseline).
- Roles `authenticated`, `anon`, `service_role` (Supabase standard).
- Helper `app.uto_rank(user_level_enum)` (present). New helper created: `uto.has_initiative_scope(text)`.

## 2. Preconditions (verify at apply time)
```sql
select to_regclass('uto.towns') is not null as towns_ok,
       to_regclass('uto.users')  is not null as users_ok;
select count(*) from pg_type t join pg_namespace n on n.oid=t.typnamespace
 where n.nspname='uto' and t.typname in ('truth_class_enum','work_learning_role','user_level_enum');
-- expect 3
select to_regclass('uto.learnings') is null as learnings_not_yet_created;  -- expect true (or skip if idempotent re-run)
```

## 3. Expected schema delta
- **NEW** table `uto.learnings` (22 columns): identity (id uuid pk default gen_random_uuid), scope
  (town_id FK towns, initiative_key, scope_level, mission_id, workpack_id, work_id), evidence
  (evidence_refs jsonb not null, proof_id FK proofs, outcome_id FK outcomes), learning
  (learning_statement text not null, statement text not null check <> '', statement_md, truth_class
  truth_class_enum not null default 'HYPOTHESIS', delta_type text, importance user_level_enum, status
  text not null default 'active'), identity/actor (author_id FK users, actor_kind work_learning_role,
  review_state, human_decision_status), deltas (**bmc_delta jsonb**, **passport_delta jsonb**, distinct),
  versioning (version int not null default 1, supersedes uuid), provenance (provenance jsonb not null
  default '{}'::jsonb), timestamps (recorded_at, source_timestamp, effective_from/to, created_at,
  updated_at).
- **CHECK** constraints: status IN (draft/active/superseded/refuted); scope_level IN
  (national/province/town/initiative/person); statement <> ''; evidence non-empty OR truth_class='AUTHORED'.
- **NEW** enum-value add (idempotent): `work_learning_role` += 'proof' (value 7).
- **NEW** indexes (9): town_id, initiative_key, (town_id,initiative_key), mission_id, workpack_id, work_id,
  truth_class, status, supersedes.
- **NEW** function `uto.has_initiative_scope(text)` + updated `uto.learnings_author_initiative_scope()` to use it.
- **NEW** trigger `learnings_immutability` + `fn_learnings_immutable()` (blocks UPDATE/DELETE of identity,
  evidence, learning, actor, provenance, version columns; allows status/version/supersedes/updated_at).
- **NEW** trigger `learnings_touch_updated_at`.
- **NO** change to existing tables. Reversible (see §6).

## 4. RLS policies (on `uto.learnings`; RLS ENABLED, FORCE)
- `learnings_insert_author`: `author_id = auth.uid()`.
- `learnings_read_author`: `author_id = auth.uid()`.
- `learnings_read_town`: `uto.has_town_scope(town_id)`.
- `learnings_read_initiative`: `has_initiative_scope(initiative_key)`.
- `learnings_update_author`: `author_id = auth.uid()` (only status/version/supersedes/updated_at — trigger-enforced).
- `learnings_national_read`: `app.is_national()`.
- **NO DELETE policy** (immutability). No service-role in app path.

## 5. Grants (RLS alone is insufficient in Postgres)
```sql
grant usage on schema uto to authenticated, anon;
grant select, insert, update on uto.learnings to authenticated;
grant select, insert, update on uto.learnings to anon;   -- RLS fail-closed; anon read = 0 rows
grant execute on function uto.has_initiative_scope(text) to authenticated, anon;
-- no DELETE grant (immutability)
```

## 6. Transaction boundary (ONE controlled transaction)
Apply with a single psql run — all-or-nothing:
```bash
# PRE-CHANGE: schema dump is the rollback point
PGPASSWORD=*** psql -h <prod-host> -p 54322 -U postgres -d postgres \
  -c '\n+' -c 'select pg_dump_schema();' > PRE_0024_schema.sql   # or pg_dump --schema=uto

# APPLY (one transaction)
PGPASSWORD=*** psql -h <prod-host> -p 54322 -U postgres -d postgres \
  --single-transaction -v ON_ERROR_STOP=1 -f supabase/migrations/0024_learnings.sql
```
`--single-transaction` + `ON_ERROR_STOP=1` ⇒ any failure rolls the whole migration back (no partial schema).

## 7. Rollback
```sql
begin;
  drop table if exists uto.learnings cascade;
  drop function if exists uto.has_initiative_scope(text);
  -- (optional) remove enum value 7 is NOT drop-safe in PG; leave 'proof' value harmless
commit;
```
Idempotent re-apply is safe (`create table if not exists`, `do $$` guard for enum value). Point-in-time:
restore `PRE_0024_schema.sql`.

## 8. Post-migration verification queries
```sql
select count(*) from information_schema.tables where table_schema='uto' and table_name='learnings'; -- 1
select count(*) from information_schema.columns where table_schema='uto' and table_name='learnings'; -- 22
select relrowsecurity, relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='uto' and c.relname='learnings';  -- t, t
select count(*) from pg_policies where schemaname='uto' and tablename='learnings';  -- 6
select count(*) from pg_indexes where schemaname='uto' and tablename='learnings';  -- 9
-- then run the data-layer suite: scripts/validation/learnings_validation.py (expect 11/11)
```

## 9. Failure conditions (abort & roll back)
- Any preconditions query fails (missing table/enum/helper).
- `ON_ERROR_STOP` trips mid-file (transaction auto-rolls back).
- Post-apply verification counts ≠ expected (1 table / 22 cols / 6 policies / 9 indexes / RLS+FORCE true).
- `learnings_validation.py` < 11/11 on a staging clone of prod before the prod apply.

## 10. Blast radius
Only the new `uto.learnings` (+ one helper function + one enum value). No existing row/table mutated. No
operational truth changed. Supabase remains the sole canonical persistence (§3/§24).
