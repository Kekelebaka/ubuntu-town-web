# RELEASE CONTROL BOARD — Production Reconciliation + Release Recovery
Generated 2026-10-12. Classifications: FACT / VERIFIED / INFERENCE / HYPOTHESIS / RECOMMENDATION / BLOCKED / HUMAN ACTION REQUIRED.
No production mutation performed. No migration history fabricated.

---

## 1. CURRENT PRODUCTION FACTS  (human-verified via Supabase dashboard)
- **FACT** Project `ubuntu-town-os`, ref `afiokbhuxfdacbsipoqk`, branch main/PRODUCTION.
- **FACT** Backups: "Free Plan does not include project backups" → NO scheduled project backups.
- **FACT** Migration history: latest `20260826040717 fix_my_missions_completion_and_town_scope`; includes `0014_announcements`, `0013_work_assignments`, `0011_missions_scores`, `0010_verification_consent`, `0009_comments_notifications`, `0008_realtime_activity`.
- **FACT** Migration history does NOT contain 0015, 0016, 0017.
- **FACT** `supabase_migrations.schema_migrations where version='0024'` → 0 rows (0024 NOT recorded).
- **FACT** `to_regclass('uto.learnings')` → NULL (table ABSENT).

## 2. REPOSITORY FACTS  (VERIFIED via git/GitHub)
- **VERIFIED** Migration dir `supabase/migrations/`: 0001–0014, 0018–0021, 0024. No 0015/0016/0017 files.
- **VERIFIED** `0024_learnings.sql` added at `9837b10`; present at release SHA `5c097b8a`.
- **VERIFIED** Release SHA `5c097b8a916e894d2c06137407159cfd51d784c0` == current PR #34 head.
- **VERIFIED** 0024 sha256 = `3837eb98bf5dde4f059ca13391d72db591425bb9fb45adbef19fd46a3d9826fa`.
- **VERIFIED** CI `validate` PASS on head (2m6s / 1m56s). Suite 400/400, tsc clean, build PASS.
- **VERIFIED** Env separation: staging config → `lgbkfthojyxhwemgkpgo`; prod env `.env.local.uto` → `afiokbhuxfdacbsipoqk`. Guard PASS (staging config has no prod identifiers).
- **VERIFIED** No secret VALUES in repo (only prose/env-var-name/config-key references; `verify-reset.mjs` reads `SUPABASE_SERVICE_ROLE_KEY` from env at runtime — not committed).

## 3. MIGRATION 0015–0017 FINDINGS
- **VERIFIED (what they are)** from git `3c7dad7 feat: add matrix organization structure`:
  `0015_org_structure` (provinces, districts), `0016_threads_messages` (threads, messages),
  `0017_initiatives_guilds` (initiatives, guilds).
- **VERIFIED (why absent)** explicitly dropped as unapplied/never-in-production:
  `6891a9f` (drop 0015), `5187747` (drop 0016), `72293e7` (drop 0017), `de88b3a` (drop 0015–0017, #18).
  Human-verified prod history confirms absent. **Provenance: they were authored, never applied, then removed.**
- **INFERENCE (applied manually?)** Likely NOT applied — prior staging (restored prod copy) had 46 uto tables with NO threads/messages/guilds. MUST be confirmed against production (query in §9).
- **INFERENCE (superseded?)** `initiatives`/`guilds` partially overlap `uto.initiatives_catalog` (production-baseline `20260728174400`). Some intent superseded elsewhere → provenance drift.
- **C-06 PRESERVED** as a governance hold. Migration history NOT rewritten; no rows invented. 0015–0017 are NOT validated architectural precedent.

## 4. MIGRATION 0024 FINDINGS
- **VERIFIED** Self-contained DDL: creates schema `uto` (if absent), enums `learning_truth_class`/`learning_status`/`learning_scope_level` (duplicate-safe), table `uto.learnings`, 8 indexes, immutability trigger+function, `uto.has_initiative_scope()`, 6 RLS policies, grants (authenticated select/insert/update; revoke anon).
- **VERIFIED** Hard prerequisites (MUST pre-exist in production): tables `uto.towns`, `uto.users`, `uto.community_work`, `uto.missions`, `uto.workpacks`, `uto.proofs`, `uto.profiles`(+`facts` jsonb); functions `app.is_national()`, `app.has_town_scope(uuid)`; roles `authenticated`/`anon`; `gen_random_uuid()` (PG13+/pgcrypto).
- **VERIFIED** NO dependency on 0015–0017 (no FK/refs to threads/messages/guilds/provinces/districts). FK targets are core uto tables only.
- **VERIFIED** Transaction-safe: single `psql --single-transaction -v ON_ERROR_STOP=1`; idempotent (`if not exists` / `duplicate_object` / `drop if exists` + `create`).
- **VERIFIED** No service-role/bypass required (app path uses `authenticated` + RLS; `anon` fail-closed).
- **VERIFIED** BMC Delta (`bmc_delta`) and Passport Delta (`passport_delta`) are distinct jsonb columns with object-type CHECKs (§14 preserved).

## 5. PRODUCTION/REPO SCHEMA DELTA (relevant to 0024)
- **VERIFIED** Repo `supabase/migrations/` (public-schema lineage) does NOT reproduce production (guard `1a4795c`). Production schema was built via `supabase/migrations.production-baseline/` (timestamped: `20260707002039_founding50`, `town_profiles`, `initiatives_catalog`, `kasibuy_*`, …) + the MIG-01 uto-schema migration.
- **BLOCKED (delta item)** Whether 0024's prerequisite objects exist in production `uto` (towns/users/community_work/missions/workpacks/proofs/profiles + `app.is_national` + `app.has_town_scope`) is NOT verifiable by Hermes (no prod access). This is the single schema delta that gates 0024. → §9 Phase 1 query, **HUMAN ACTION REQUIRED**.

## 6. RECOVERY STATUS
- **FACT** No scheduled project backups (Free Plan).
- **INFERENCE (NOT CLAIMED)** PITR likely unavailable (Free Plan excludes the PITR add-on). Hermes cannot inspect PITR — **does not assert it exists**.
- **RECOMMENDATION** Only defensible recovery = operator `pg_dump` (logical backup) immediately pre-migration (command §9). Requires prod DB credentials (operator).
- **BLOCKED** No recovery is currently VERIFIED. Per rule "no usable recovery ⇒ RELEASE NO-GO." → **RELEASE = NO-GO** until a pre-migration dump or PITR is established.

## 7. SECURITY / RLS STATUS
- **VERIFIED (design + staging)** 0024: RLS enabled+FORCE; 6 policies (read_national/town/initiative/author, insert_scoped, update_lifecycle); immutability trigger blocks content UPDATE/DELETE; no app DELETE path; grants authenticated, revoke anon; supersedes/versioning.
- **VERIFIED (staging)** 11/11 data-layer: cross-town INSERT/SELECT denied, cross-initiative denied, unauth denied, immutability, national read-across, supersedes/versioning. BMC≠Passport.
- **BLOCKED (production)** live RLS verification pending apply. No service-role used for user writes.

## 8. EXACT REPAIR PLAN  (PHASE 0–6)
| Phase | Name | Mode | Human auth | Gate |
|---|---|---|---|---|
| 0 | Recovery | READ-ONLY (PITR check) + operator dump | REQUIRED | must precede all mutation |
| 1 | Schema/Provenance Forensics | READ-ONLY | REQUIRED (SQL editor) | prerequisites present |
| 2 | Dependency Reconciliation | READ-ONLY | — | 0024 ⟂ 0015–0017 confirmed |
| 3 | 0024 Migration | MUTATING | REQUIRED | one-transaction apply |
| 4 | RLS/Grants/Immutability Verify | READ-ONLY | REQUIRED | 22/6/9 + 11/11 |
| 5 | Application Release (merge/deploy) | MUTATING | REQUIRED | CI+SHA+env+domain |
| 6 | Live End-to-End Verification | READ-ONLY + 1 governed write | REQUIRED | golden slice + security |

## 9. EXACT COMMANDS
**PHASE 0 — Recovery (before ANY mutation):**
```bash
# Operator pre-migration recovery point (REQUIRED; Free Plan has no auto backups)
PGPASSWORD='<prod-pw>' pg_dump -h db.afiokbhuxfdacbsipoqk.supabase.co -p 5432 -U postgres -d postgres \
  --schema=uto --schema=app --schema=supabase_migrations > PRE_0024_$(date -u +%Y%m%dT%H%M%SZ).sql
# Then confirm PITR status in Dashboard → Database → Backups (do NOT assume it exists).
```
Expected: a restorable dump file (or a confirmed PITR window covering the apply time). Failure: neither → **NO-GO**.

**PHASE 1 — Forensics (READ-ONLY, SQL editor):**
```sql
-- prerequisites for 0024
select to_regclass('uto.towns') t, to_regclass('uto.users') u, to_regclass('uto.community_work') cw,
       to_regclass('uto.missions') m, to_regclass('uto.workpacks') wp, to_regclass('uto.proofs') p,
       to_regclass('uto.profiles') pf;                -- all must be non-null
select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='app' and p.proname in ('is_national','has_town_scope');  -- expect 2
-- 0015-0017 object presence (expect NULL / 0 = correctly absent)
select to_regclass('uto.threads') th, to_regclass('uto.messages') ms, to_regclass('uto.guilds') gd,
       to_regclass('uto.provinces') pv, to_regclass('uto.districts') ds;
-- 0024 not yet applied
select count(*) from supabase_migrations.schema_migrations where version like '0024%';  -- expect 0
```
Expected: prerequisites present; 0015–0017 objects absent; 0024 unrecorded. Failure: a prerequisite missing ⇒ resolve it before Phase 3.

**PHASE 3 — Apply (MUTATING; after Phase 0 recovery + Phase 1 clean):**
```bash
PGPASSWORD='<prod-pw>' psql -h db.afiokbhuxfdacbsipoqk.supabase.co -p 5432 -U postgres -d postgres \
  --single-transaction -v ON_ERROR_STOP=1 -f supabase/migrations/0024_learnings.sql
```
Expected: exit 0. Failure: any error ⇒ whole transaction rolls back (no partial schema). Rollback: `drop table uto.learnings cascade; drop function uto.has_initiative_scope(text); drop function uto.learnings_immutable();` + restore PRE_0024 dump. NO destructive rollback once real learning records exist (forward-fix + app rollback).

**PHASE 4 — Verify (READ-ONLY):** §13 queries + `scripts/validation/learnings_validation.py` (11/11).

## 10. HUMAN APPROVALS REQUIRED
1. **Recovery** (Phase 0): run/confirm pre-migration `pg_dump` or PITR for `afiokbhuxfdacbsipoqk`.
2. **Phase 1 forensics**: run the READ-ONLY prerequisite/0015–0017 queries (SQL editor) and return results.
3. **Migration 0024** (Phase 3): explicit go to apply (after 1+2 green).
4. **Application release** (Phase 5): merge PR #34 @ `5c097b8a` → deploy.
5. **Domain** (Phase 8): bind `work.ubuntutown.co.za` → Pages `ubuntu-town-web-git`.
6. **C-05/C-06**: already recorded (ratified / provenance-held) — no further action.

## 11. NO-GO CONDITIONS (any ⇒ NO-GO)
- No verified recovery (no dump + no PITR). **← CURRENTLY TRUE**
- Phase 1 shows a 0024 prerequisite missing in production.
- Migration fails / partial apply.
- Any RLS/cross-tenant leak after apply.
- Secret/credential found in repo or logs.
- Migration history would need fabrication to "pass."
- Domain bind affects an unintended host.

## 12. GO CONDITIONS (all required for FULL BINARY / PRODUCTION GO)
- Recovery verified (dump or PITR). · Prerequisites verified. · 0024 applied + verified (22/6/9, 11/11). · RLS/cross-tenant proven in production. · App deployed from `5c097b8a`. · Golden slice loop proven live. · Domain healthy (no 522). · Passport/Pulse integrity confirmed.

## 13. POST-RELEASE VERIFICATION (READ-ONLY)
`uto.learnings` exists · 22 columns · RLS enabled · 6 policies · 9 indexes · grants correct · immutability trigger · supersedes/versioning · cross-town denied · cross-initiative denied · unauth denied · national read-across · governed learning write · BMC/Passport delta persistence. Then end-to-end:
BLUEPRINT→TOWN PASSPORT→ENGINE→INITIATIVE FIT→OPPORTUNITY→READINESS→TARGET→WORKPACK→ACTION→PROOF→OUTCOME→CONTRIBUTION→REWARD→LEARNING→PASSPORT DELTA→TOWN/INITIATIVE→PROVINCE/NATIONAL. Missing evidence stays null/INSUFFICIENT_EVIDENCE.

## 14. FINAL RELEASE VERDICT
**RELEASE = NO-GO.** The schema/migration/RLS/release engineering is prepared and verified on staging, and the migration is dependency-clean (⟂ 0015–0017), but **recovery is not established** (Free Plan: no backups; PITR not confirmed; Hermes cannot verify it). Per the governing rule, no production migration runs without a defensible recovery strategy. Everything is staged to execute the moment a pre-migration dump/PITR is confirmed — that is the single gate to FULL BINARY / PRODUCTION GO.
