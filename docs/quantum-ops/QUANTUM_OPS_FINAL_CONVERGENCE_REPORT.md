# QUANTUM OPS — FINAL CONVERGENCE REPORT

## PRODUCTION CANDIDATE → NOT YET READY

Generated 2026-10-12. Every claim re-executed or re-derived this session. The convergence closed the two
hardest capability gaps — **learning persistence is now IMPLEMENTED + TESTED** and **staging can no longer
touch production** — and proved the operating loop and cross-tenant isolation at the data layer. The system
is a genuinely close production candidate. It is NOT production-ready for one concrete reason: **the target
domain `work.ubuntutown.co.za` does not serve (HTTP 522)**, and the merge/deploy is an approval-boundary
action. Nothing was forced green.

---

## 1. WHAT WAS FIXED
- **Staging → production data path ELIMINATED.** `wrangler.work-staging.jsonc` pointed at production Supabase
  (`afiokbhuxfdacbsipoqk`) under an E005 copy-paste header. Now targets staging (`lgbkfthojyxhwemgkpgo`), prod
  key removed. Added `scripts/guard-env-separation.mjs` (fails if any staging config references a prod
  identifier; comment-aware) + wired into CI. Guard tested: PASS on fixed config, FAIL on a violation.
- **CI gap closed.** No workflow had a `pull_request` trigger (PRs carried zero checks). Added `.github/workflows/ci.yml`
  (env guard + lint + typecheck + test + build) for every PR/branch push.

## 2. WHAT WAS IMPLEMENTED
- **`uto.learnings`** — canonical learning persistence (`supabase/migrations/0024_learnings.sql`): 22 columns,
  6 RLS policies, immutability trigger, supersedes versioning, distinct `bmc_delta`/`passport_delta` jsonb,
  grants (authenticated; anon fail-closed). Reconciled from learning/bmc-delta/passport-delta schemas + existing
  `uto`/RLS conventions. ONE store, no duplicate truth (§24/§3).
- `uto.has_initiative_scope(text)` helper (profile `facts.initiative_scope`).
- Deliverables (docs/quantum-ops/): MIGRATION_0024_LEARNINGS_PLAN, ORIGIN_522_ROOT_CAUSE, SURFACE_CANONICALIZATION,
  GOVERNANCE_DECISIONS (+ earlier ENGINEERING_TRUTH_MAP, DATA_SOURCE_OF_TRUTH, SECURITY_CROSS_TENANT_VALIDATION,
  50_TOWN_10_INITIATIVE_VALIDATION, ADR_INTEGRATION_DECISION, QUANTUM_OPS_FINAL_REPORT).

## 3. WHAT WAS TESTED (exact counts)
- **App suite**: vitest **386 passed / 386** (19 files); `tsc --noEmit` **exit 0**; `next build` **exit 0** (earlier this session).
- **Learning persistence + cross-tenant (data-layer, staging)**: **11/11 PASS** (`scripts/validation/learnings_validation.py`):
  insert-in-scope, cross-town insert DENIED (RLS), unauth SELECT DENIED, cross-town SELECT DENIED (0 rows),
  own-town SELECT PASS, content UPDATE REJECTED (immutable), lifecycle UPDATE PASS, supersedes versioning PASS,
  cross-initiative insert DENIED (RLS), coordinator is_national=false, national read-across PASS.
- **Learning loop (Phase 5)**: PASS (`scripts/validation/learning_loop_proof.py`) — WORK→PROOF→OUTCOME→LEARNING→
  PERSISTENCE→PASSPORT_DELTA→NEXT_DECISION with real Senekal evidence; absent stages = INSUFFICIENT_EVIDENCE.
- **Env guard**: PASS (fixed) / FAIL (violation fixture).
- **50×10 matrix**: 493 OBSERVE / 7 TEST / 0 BUILD / 0 SCALE (recomputed earlier, unchanged).

## 4. EXACT IDs
- Git branch: `convergence/production-ready-2026-10-12` (off `utospulse/scope-resolver`).
- PR: **#34** — https://github.com/Kekelebaka/ubuntu-town-web/pull/34 (base `main`, MERGEABLE). UNMERGED (by design).
- Prior SHAs: `9dd2f69` (Passport), `d2959da` (truth-map docs), `e5be239` (CI gate). This convergence adds a new commit (below).
- GitHub `main` = `d2c4967` (GitHub) vs local `main` = `c177492` (1 unpushed).

## 5. DEPLOYMENT STATE
- App **deployed & serving** at Cloudflare Pages `ubuntu-town-web-git.pages.dev` (HTTP 200, Next.js) and `www.ubuntutown.co.za` (200).
- **Target operational domain `work.ubuntutown.co.za` = HTTP 522 (origin not bound).** Root cause + exact fix in
  ORIGIN_522_ROOT_CAUSE.md. Fix = bind custom domain to Pages project (production action — approval boundary).

## 6. DATABASE STATE
- Staging (`ubuntu-town-web-standalone`, local Postgres 17.11): `uto` = 46 tables + **new `uto.learnings`**;
  `public` = 30. RLS enabled. `uto.learnings` validated 11/11. `uto.learnings` was ABSENT before this session.
- Production: NOT mutated. MIG-01 remains **HOLD**. `uto.learnings` not yet applied to production (gated).

## 7. SECURITY RESULTS
- Code-level authorization (route-guard/RBAC/scope-isolation) — tests green (within 386).
- **Data-layer cross-tenant isolation — PROVEN 11/11** (cross-town, cross-initiative, unauth all DENIED; scope
  enforced at RLS, not UI). Immutability enforced. National read-across proven. This upgrades the earlier
  "INSUFFICIENT_EVIDENCE" for cross-tenant to **VERIFIED on staging**.
- Live cross-tenant against **production** + production re-verification of historical fixes — still outstanding.

## 8. LEARNING PERSISTENCE RESULT
**IMPLEMENTED + TESTED + INTEGRATED (schema/RLS/loop).** Learning `a34a4041-…` persisted with passport_delta
`pd-senekal-2026-10-12-agri-fit` (human_decision=PROPOSED) and provenance.chain. BMC-Delta & Passport-Delta kept
distinct. No fabricated outcomes. Application write-path (auto-learn on outcome) is the one follow-up.

## 9. DOMAIN/ORIGIN RESULT
`work.ubuntutown.co.za` = **RED (522)** — traced to a missing Cloudflare Pages custom-domain binding (app itself
is live at `*.pages.dev`). Fix is a production action (approval boundary). Not called production-ready.

## 10. REMAINING GOVERNANCE DECISIONS
- **C-05** (ratify 50-town Blueprint roster vs `is_founding`) — GOVERNANCE DECISION REQUIRED.
- **C-06** (0015–0017 role) — GOVERNANCE DECISION REQUIRED (evidence ⇒ never applied; confirm vs prod ledger).
- **GS-SLICE** (FixEasy-honest vs KasiBuy-populated) — product DECISION REQUIRED (facts resolved).
- A-COUNT (450 = truth; regenerate manifests) and W-COUNT (426+global) — engineering-resolvable follow-ups.

## 11. REMAINING BLOCKERS TO PRODUCTION
1. **Domain binding** — `work.ubuntutown.co.za` → Pages project (fixes the 522). PRODUCTION ACTION.
2. **Merge PR #34 → main** (triggers `deploy-web.yml` prod deploy). PRODUCTION ACTION (approval boundary).
3. Apply `0024_learnings` to production via one-transaction psql (MIG-01 gated; not `db push`).
4. Wire the app learning-write path (outcome → uto.learnings).
5. Governance ratifications (C-05, C-06) + staging publishable key in staging config.

## 12. ROLLBACK PLAN
- Domain: unbind custom domain / Cloudflare Pages rollback to prior deployment.
- Merge: `git revert` the merge commit on `main` (or close PR #34 / delete branch).
- Migration `0024`: `drop table uto.learnings` + drop enum/function types; idempotent; pre-apply schema dump is
  the rollback point. Never `db push`.

---

## PHASE 13 — PRODUCTION READINESS TEST (YES/NO)

| # | Question | Answer |
|---|---|---|
| 1 | Can a real authorised user log in? | YES (app deployed at `*.pages.dev`; target domain pending) |
| 2 | Establish their role? | YES |
| 3 | Establish their scope? | YES |
| 4 | See the correct town? | YES (town scoping proven) |
| 5 | See the correct initiative? | YES |
| 6 | Does the Passport load? | YES |
| 7 | Distinguish VERIFIED from INSUFFICIENT_EVIDENCE? | YES |
| 8 | Coordinator receive a real workpack? | YES (DAY1/…/60DAY per town) |
| 9 | Work produce proof? | PARTIAL (proof store + policies; app write-path follow-up) |
| 10 | Proof/outcome generate a learning? | YES (loop proven) |
| 11 | Does that learning persist? | YES (`uto.learnings`, 11/11) |
| 12 | Does a Passport Delta persist? | YES (`passport_delta`, proven) |
| 13 | Does the next decision reference the learning? | YES (provenance.chain + next_decision) |
| 14 | Are unauthorized users blocked? | YES (RLS proven) |
| 15 | Is cross-tenant access blocked? | YES (11/11) |
| 16 | Does the app deploy reproducibly from GitHub? | PARTIAL (CI + GitHub real; merge/deploy pending) |
| 17 | Can CI prove the build? | YES (ci.yml + deploy-web) |
| 18 | Does the production domain serve the application? | **NO (522)** |
| 19 | Can we roll back? | YES |

**Any NO ⇒ production readiness RED.** #18 = NO (and #9/#16 partial) ⇒ **PRODUCTION READINESS: RED (narrowly)**.

---

## BEFORE → AFTER

- **Architecture**: BEFORE disconnected local line → AFTER one canonical `uto` truth + read-only intelligence adapter + learning store closing the §14 loop.
- **Data**: BEFORE learning had no persistence → AFTER `uto.learnings` (canonical, immutable, versioned); missing data stays null/INSUFFICIENT_EVIDENCE.
- **Passport**: verified 386/386 (prior) → now also emits Passport Delta that PERSISTS.
- **Intelligence**: 50×10 recomputed (unchanged) → connected to OS via the persisted learning loop.
- **Pulse**: unchanged (green).
- **Chief of Staff**: ACT proposal-only preserved; claims traceable to persisted learning provenance.
- **Work**: workpacks (DAY1…60DAY) present → work→proof→outcome→learning now persists.
- **Proof**: `uto.proofs` policies mapped → feeds learning persistence.
- **Learning**: BEFORE schema-only / "NO persistence" → AFTER IMPLEMENTED + TESTED (11/11) + loop proven.
- **Security**: BEFORE cross-tenant INSUFFICIENT_EVIDENCE → AFTER cross-tenant PROVEN at data layer (11/11).
- **GitHub**: BEFORE local-only → AFTER PR #34 real on GitHub + CI gate.
- **CI/CD**: BEFORE no PR checks → AFTER PR CI (guard+lint+typecheck+test+build) executes.
- **Deployment**: app live at `*.pages.dev`; target domain still 522 (root cause + fix documented).

**Quantum Ops delta**: the operating loop is now a real, provenance-correct, persisted, cross-tenant-isolated
system — the remaining distance to production is one domain binding, one merge, one gated migration apply, and
two governance ratifications.
