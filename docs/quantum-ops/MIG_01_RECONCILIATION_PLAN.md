# MIG-01 RECONCILIATION PLAN

Status: **HOLD** (unchanged). This plan does NOT mutate production. `supabase db push` remains BANNED
(documented-unsafe: bidirectional drift + duplicate 0008–0014 rows in the production ledger).
Built from verified migration inventory on 2026-10-12.

## 1. Current state (verified)

- **Repo ledger**: 18 migrations `supabase/migrations/0001..0021` (0015–0017 absent), identical across
  `quantum-ops/repos/ubuntu-town`, `ut-os-wave1/ubuntu-town-web`, `ut-os-wave1/ubuntu-town-web-sql`.
- **Recovered production baseline**: 22 timestamped SQL + `RECONCILIATION.md` in
  `supabase/migrations.production-baseline/` (incl. `20260707002039_founding50_and_town_readiness.sql`).
- **Staging** (`ut-os-migration-staging`): 40 files, local Supabase `ubuntu-town-web-standalone`, plus
  `seed_fixtures.py` / `run_gate2_tests.py` (local gate tests) and `STAGING_DEVIATIONS.md` (5 documented
  staging-only deviations).

## 2. Schema divergence (CONFIRMED)

- Production operational home = **`uto`** (28 prod-only `uto.*` objects). Repo ledger `0001`/`0002` are
  **unqualified / public-targeted** DDL; `0003`+ use `uto.`-qualified names (346 occurrences).
- `public.*` twins are **repo-only**; `public.initiatives` is **prod-only with no DDL in the ledger**.
- Staging reproduces prod by prepending `search_path='uto, public'` to 0001–0014 (STAGING_DEVIATIONS).

## 3. Migrations 0015 / 0016 / 0017 — MISSING

- No `0015/0016/0017` SQL exists anywhere. Recovered production ledger: they were **git-only, never applied**
  (`threads`/`messages`/`guilds` absent from the live 46-table `uto` schema). Dropped via branch
  `chore/drop-unapplied-0015-0017`.
- **Contradiction C-06 UNRESOLVED**: `MIG_01_RECONCILIATION_REPORT.md` claims 0015–0017 "performed the
  uto-schema migration"; the recovered production ledger says never applied. Both cannot be true. Requires
  a **human ruling** against the live `supabase_migrations.schema_migrations` table before any action.

## 4. `uto.learnings` — ABSENT (BLOCKED)

- Zero DDL for `uto.learnings` anywhere. Learning / BMC / Passport-delta exist only as **schemas**
  (`bmc-block`, `bmc-delta`, `learning`, `passport-delta`). Learning has **NO persistence**. Planned
  `0024_learnings.sql` not written. This is a real architectural gap: the BMC/learning loop terminates in
  memory with no durable store.

## 5. RLS analysis (64 CREATE POLICY across 11 files)

- People RLS is **inside** the ledger (`0021_people_town_read.sql` town-scoped SELECT via `app.has_town_scope`
  + `0002` self/admin policies). No people RLS outside the ledger.
- **Town UPDATE**: only `town_update_signals` + `admin_all` on `towns`. **No UPDATE policy on `towns`** itself.
  MIG-01 step 6 (verify/add `uto.towns` update policy for `is_hq` only) is **PENDING/unverified**.
- `proofs`/`memories` base production DDL **undocumented** in ledger (planned `0022_proofs_ddl_baseline.sql` /
  `0023_memories_ddl_baseline.sql` not written); `0019` adds 4 cw-scoped policies on `uto.proofs`.

## 6. Migration dependency graph (ordering risk)

Production ledger has versions `0008`–`0014` recorded **twice** (bare + timestamped). The repo numbering
(0018–0021) does not match production apply order (kasibuy 2026-08-07 files landed between). Any replay must
reconcile duplicate ledger rows first. Staging already re-dates 0018–0021 after kasibuy (STAGING_DEVIATIONS).

## 7. Required actions (all gated; none executed here)

1. **Human ruling on C-06** (0015–0017 role) against the live `schema_migrations` table — BLOCKING.
2. Snapshot the live `uto` schema (46 tables) as an authoritative baseline; write `0022_proofs_ddl_baseline.sql`
   and `0023_memories_ddl_baseline.sql` from it (currently undocumented).
3. Decide `uto.towns` UPDATE policy (is_hq-only) — MIG-01 step 6.
4. Design `0024_learnings.sql` for a durable learning store (staging-first).
5. Reconcile duplicate `0008`–`0014` ledger rows; produce a single ordered apply plan.

## 8. Staging validation + rollback

- Validate every candidate migration in `ut-os-migration-staging` (local Supabase) via `run_gate2_tests.py`
  (GATE 2A/2B smoke + cross-tenant isolation matrix) before any production consideration.
- Rollback: production apply must be **one-transaction psql** (per `apply-founding-fifty-staging.yml` pattern),
  with a pre-apply schema dump as the rollback point. Never `db push`.

## 9. Production prerequisites to leave HOLD

- C-06 resolved; proofs/memories baselines written; `towns` UPDATE policy decided; `uto.learnings` designed;
  duplicate ledger rows reconciled; staging gate green. Until then MIG-01 stays **HOLD** — do not mutate
  production to make a report green.
