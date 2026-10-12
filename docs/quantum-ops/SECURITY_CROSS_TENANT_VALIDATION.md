# SECURITY & CROSS-TENANT VALIDATION

Executed/read-derived 2026-10-12. This document distinguishes what is VERIFIED by executed tests from
what is only OBSERVED in prior commits and NOT re-verified against a live database this session. No
production mutation, no RLS bypass, no secret exposure was performed.

## 1. VERIFIED this session (executed tests)

Within the 386/386 passing suite (`npx vitest run`) these security-relevant suites PASS:

- `route-guard.test.ts` (266 lines) — **fail-closed route guard** (route-guard matrix 71→74). Unauthenticated
  and out-of-scope access denied by default.
- `admin-gate.test.ts` / `admin-rbac.test.ts` — admin gate + role-based access control.
- `role-scope-isolation.test.ts` — role/scope lenses (the initiative-head-leak bug is fixed; scope lenses are
  fail-closed, `scope.ts` verified).
- `public-routes-regression.test.ts` — public route surface regression.
- `profile-demo-data.test.ts` — profile demo-data removal (no synthetic data leaking into profile).
- `blueprint-roster.test.ts` — roster integrity.

Authorization boundary: enforced at the **route-guard + scope-lens layer** and at **RLS** (data boundary),
not merely by hiding UI. Scope lenses resolve National → Province → Town → Initiative → Person.

## 2. Cross-tenant model (§23) — modelled, live probes NOT run

Expected matrix: allowed→PASS, forbidden→DENIED, unauthenticated→DENIED, scope-escalation→DENIED,
cross-town→DENIED, cross-initiative→DENIED.

- **Code-level enforcement: TESTED** (role-scope-isolation + route-guard suites green).
- **Database-level RLS: PRESENT** (64 CREATE POLICY; `app.has_town_scope`, `0021_people_town_read`
  town-scoped SELECT, `0019` proof policies, `0020` creation-time tenancy).
- **Live adversarial probes against the deployed/production DB: NOT EXECUTED this session.** The
  cross-tenant isolation matrix runner (`ut-os-migration-staging/run_gate2_tests.py`, GATE 2A/2B) targets a
  **local** staging Supabase and was not run here. Status of live cross-tenant proof = **INSUFFICIENT_EVIDENCE**.

Recommendation before production GO: run `run_gate2_tests.py` against staging and capture the matrix as
CROSS_TENANT evidence; do not claim cross-tenant is proven until that output exists.

## 3. Historical security items (§22) — OBSERVED in commits, NOT re-verified in production

These were fixed in named commits/branches but I did not re-test them against a live deployment:

| Item | Where fixed | Re-verified in prod? |
|---|---|---|
| `/privacy`, `/terms`, `/profile`, `/workspace*`, `/admin` route behaviour | route-guard (d05e7b1) | NO |
| proof upload authentication | `feat/0019-proof-authz-audit`, field-os `0987c13` | NO |
| `kb_admin_sso` auth_id trust boundary | `wave1/kasibuy-sql-hardening` (0733408) | NO |
| plaintext POS PINs | `0733408` POS PIN safe verification path | NO |
| publish-outbox service-role exposure | `feat/community-work-reconciled` | NO |
| mobile navigation / auth redirects | route-guard + auth branches | NO |
| `is_admin()` constrained to national scope | `security/0018-authz-hardening` (05646f0) | NO |

Because these live on non-`main` branches that are **not deployed to the serving domain** (origin 522),
their production status is UNKNOWN. Do not assume historical fixes are in production (§22).

## 4. Concrete security/config FINDING (new)

**`wrangler.work-staging.jsonc` targets the PRODUCTION Supabase project `afiokbhuxfdacbsipoqk`** (with the
E005 header copy-pasted and `EXPERIENCE_005=1`). A "staging" worker pointed at production Supabase means a
staging deploy would read/write against production data under the publishable key. This is a real
misconfiguration risk.

- Severity: HIGH (staging→prod data exposure path).
- Note: the committed `SUPABASE_PUBLISHABLE_KEY` is a **publishable/anon** key (client-visible by design),
  not a service-role secret — so this is a target-misconfiguration issue, not a secret leak.
- Recommended fix (NOT applied — needs the correct staging project ref confirmed): point both `vars` and
  `env.experience-005.vars` at the **staging** project `lgbkfthojyxhwemgkpgo`, and correct the header.
  Left as a flagged finding because I cannot verify the correct staging target/deploy here.

## 5. ACT safety (§16) — preserved

CoS modes OBSERVE/EXPLAIN/CHALLENGE/COACH are non-mutating; ACT is **proposal-only** (surfaced in the
Passport commit and `universe.ts`/loop code). Consequential ACT requires human approval + recorded decision +
authorization. This boundary is intact and was not weakened.

## 6. Verdict

- Route-guard / RBAC / scope-isolation / fail-closed behavior: **VERIFIED (tests green)**.
- RLS policy surface: **PRESENT in ledger**.
- Live cross-tenant + historical-fix production verification: **INSUFFICIENT_EVIDENCE (not run)**.
- New config finding (staging→prod): **OPEN, HIGH**.

Overall SECURITY posture: **AMBER** — strong tested code-level authorization, but live DB-level cross-tenant
proof and production re-verification of historical fixes are outstanding, and one HIGH config finding is open.
