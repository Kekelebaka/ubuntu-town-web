# MIGRATION 0024 — LEARNINGS PLAN

Target: `uto.learnings` (canonical learning persistence). Status: **IMPLEMENTED + TESTED on LOCAL
STAGING** (2026-10-12). NOT production-applied — production is gated (see Production prerequisites).

Closes the primary capability gap: Learning / BMC Delta / Passport Delta had schemas but NO
persistence ("learning has NO persistence"). This is MIG-01 step 9.

## Reconciliation basis
- `ut-os-mission-zero/schemas/learning.schema.json` (core record; "persistence proposed, MIG-01 step 9")
- `.../bmc-delta.schema.json` (initiative business-model delta) and `.../passport-delta.schema.json`
  (town understanding delta) — kept DISTINCT per §14.
- Existing `uto` conventions: uuid PK, `town_id uuid`, `created_at/updated_at timestamptz`, RLS via
  `app.has_town_scope(uuid)` / `app.is_national()` / `auth.uid()`; `app.has_town_scope` accepts role_key
  in (coordinator,deputy,ops,admin); `app.is_national()` = role_key in (admin,ops) AND town_id IS NULL.

## Exact objects (supabase/migrations/0024_learnings.sql)
- Enums: `uto.learning_truth_class` (VERIFIED/ACTUAL/MODELLED/HYPOTHESIS/AUTHORED/INSUFFICIENT_EVIDENCE),
  `uto.learning_status` (draft/active/superseded/refuted), `uto.learning_scope_level`
  (national/province/town/initiative/person).
- Table `uto.learnings` (22 columns):
  id (uuid PK), statement (text), truth_class, scope_level, town_id (FK→uto.towns ON DELETE SET NULL),
  initiative_key (text), work_id (FK→uto.community_work), mission_id (FK→uto.missions),
  workpack_id (FK→uto.workpacks), proof_id (FK→uto.proofs), outcome_id (uuid), source (text),
  evidence_refs (jsonb, default '[]'), author_id (FK→uto.users ON DELETE RESTRICT),
  bmc_delta (jsonb), passport_delta (jsonb), status, version (int), supersedes (self-FK),
  provenance (jsonb), created_at, updated_at.
- Constraints: `learnings_evidence_or_authored` (anyOf: evidence_refs non-empty OR truth_class=AUTHORED),
  `learnings_statement_nonempty`, `learnings_evidence_is_array`, `learnings_bmc_delta_is_object`,
  `learnings_passport_delta_is_object`, `learnings_version_positive`.
- Indexes (9): town_id, initiative_key, work_id, author_id, status, truth_class, created_at desc, supersedes.
- Immutability trigger `uto.learnings_immutable()`: content fields (statement/truth_class/evidence_refs/
  author_id/created_at) immutable on UPDATE; corrections via `supersedes`; auto-updates updated_at.
- Grants: `select, insert, update` → authenticated; `revoke all` from anon (fail-closed).

## RLS (6 policies)
- read_national: `app.is_national()`
- read_town: `app.has_town_scope(town_id)`
- read_initiative: `uto.has_initiative_scope(initiative_key)` (new helper; profile `facts.initiative_scope`)
- read_author: `author_id = auth.uid()`
- insert_scoped: `author_id = auth.uid()` AND (national OR town-scope OR initiative-scope)
- update_lifecycle: author OR national (trigger enforces content immutability)
- NO delete policy for app roles (append-only; admin/service_role governed separately).

## Dependencies
Requires existing `uto.towns`, `uto.users`, `uto.community_work`, `uto.missions`, `uto.workpacks`,
`uto.proofs`, and `app.has_town_scope`/`app.is_national`/`auth.uid()`. All present in staging (46-table `uto`).

## Rollback
`drop table if exists uto.learnings; drop type if exists uto.learning_truth_class/status/scope_level; drop
function if exists uto.learnings_immutable(); drop function if exists uto.has_initiative_scope(text);`
(and the `0024` row in the migration ledger). Idempotent (`if not exists` / exception-on-duplicate).

## Staging validation — RESULT 11/11 PASS (scripts/validation/learnings_validation.py)
Schema: 22 columns, 9 indexes, 6 policies, RLS enabled. Executed at the DATA layer (JWT-claim role
simulation), not UI:
1. INSERT within own town scope — PASS (row created)
2. cross-town INSERT — DENIED ("violates row-level security policy")
3. unauthenticated SELECT — DENIED (permission denied)
4. cross-town SELECT (B→A's rows) — DENIED (0 rows)
5. own-town SELECT (A) — PASS (≥1)
6. content UPDATE — REJECTED ("learnings content is immutable; create a superseding row instead")
7. lifecycle UPDATE (status) — PASS
8. supersedes versioning insert — PASS
9. cross-initiative INSERT (no scope) — DENIED (RLS policy)
10a. coordinator is_national() = false — PASS
10b. national (ops) SELECT across towns — PASS (read-across visible)

## Learning-loop proof — PASS (scripts/validation/learning_loop_proof.py)
WORK→PROOF→OUTCOME→LEARNING→PERSISTENCE→PASSPORT_DELTA→NEXT_DECISION demonstrated with real Senekal
evidence; absent proof/outcome stages recorded as INSUFFICIENT_EVIDENCE (not fabricated). Persisted
learning `a34a4041-…` carries passport_delta `pd-senekal-2026-10-12-agri-fit` (human_decision=PROPOSED)
and provenance.chain. Confirmed persisted (uto.learnings rows present).

## Production prerequisites (to leave staging-only)
1. MIG-01 HOLD unchanged; resolve C-06 and proofs/memories baselines first.
2. Apply `0024` via one-transaction psql (NOT `db push`) with a pre-apply schema dump as rollback point.
3. Set the staging publishable key in `wrangler.work-staging.jsonc` (env-separation guard enforces no prod ref).
4. Wire the app learning-write path (work/proof/outcome → uto.learnings) — the persistence layer is proven;
   the application integration that writes learnings on outcome is a follow-up.
