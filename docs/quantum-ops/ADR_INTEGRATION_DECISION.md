# ADR — Integration of the Intelligence/Experience/Passport line into Ubuntu Town OS

Status: PROPOSED (awaits human merge + deploy decision). Date 2026-10-12.

## Problem

The Passport + Pulse + Experience 001–005 + Total Binary integration lives entirely on branch
`utospulse/scope-resolver` (9dd2f69), 13 commits ahead of `main` (c177492), **never merged and never pushed
to GitHub**. `main` holds the real operational app (`/workspace`, auth, work engine, community-work publishing,
migration reconciliation, 9 CI workflows). The two lines have **zero content divergence** (scope-resolver is a
clean fast-forward descendant of main), but only `main` is the deployable production app.

## Existing alternatives

1. **Do nothing** — leaves the entire intelligence layer local-only; "local completion" masquerading as
   engineering control. Rejected (violates §25).
2. **Fast-forward merge scope-resolver → main and push** — smallest diff, but a push to `main` triggers
   `deploy-web.yml` → **production deploy** of five parallel experience surfaces (incl. synthetic E001) to
   the live Pages project. That is a consequential production change requiring approval. Rejected as an
   automatic action (§39).
3. **Blindly rebuild the Passport in the app** — rejected (§18: do not rebuild blindly; the work is verified).
4. **Publish scope-resolver as a reviewable branch + PR to main (CHOSEN).**

## Chosen design

Publish `utospulse/scope-resolver` to GitHub as a branch and open a **PR to `main`**, so the integration is
real, reviewable, diffable, and CI-checkable — without triggering a production deploy. The merge to `main`
and the deploy are then explicit **approval-boundary** actions.

Rationale:
- Converts local-only → genuine GitHub engineering control (the largest gap). Reversible (close PR / delete branch).
- Respects the approval boundary: `push:main` = production deploy, so `main` is left untouched.
- Preserves the read-only/no-fabrication design already verified (386/386, tsc, build, snapshot integrity).

## The integration decision the PR forces (for the reviewer)

The branch introduces **five parallel surfaces** (`/os`, `/operate`, `/real`, `/passport`, `/pulse`) alongside
the real `/workspace` app — a "second system in the UI" risk (§3). Recommendation to resolve before merge:

- Keep **`/passport`** (read-only intelligence over the versioned snapshot) and **`/pulse`** (derived) as the
  canonical intelligence surfaces — these are provenance-correct and non-mutating.
- Keep **`/workspace`** as the canonical operational app.
- Treat `/os`, `/operate`, `/real` as **quarantined preview surfaces** (the branch already redirects
  `/os`,`/real` → `/operate` via EXPERIENCE_ROOT_REDIRECT). Confirm they are excluded from the production nav
  and from the sitemap.
- E001 `universe.ts` is **synthetic demo data** — must not be reachable as production content.

## Trade-offs

- (+) Fast, reversible, reviewable; no production mutation; honest surface.
- (−) The five-surface proliferation is not fully collapsed yet; a follow-up UX consolidation (§31) is needed.
- (−) Learning/BMC persistence is still absent (`uto.learnings`), so the §14 loop is not durably closed.

## Migration path

1. Push branch + open PR (this action). CI on the PR runs lint/typecheck/test/build.
2. Reviewer decides surface canonicalization (above) and confirms E001 quarantine.
3. Human merges to `main` → `deploy-web.yml` deploys → fix `work.ubuntutown.co.za` origin (currently 522).
4. Follow-up: learning-store migration (staging-first), surface consolidation, live cross-tenant proof.

## Rollback

Close PR / delete branch, or `git revert` the merge commit on `main`. No production state is changed by
opening the PR. The deploy step (step 3) has its own rollback (Cloudflare Pages rollback to prior deployment).

## Consequences

- Engineering control becomes real (GitHub ref + PR exist).
- Production deploy and `main` merge remain **human decisions** — explicitly NOT executed here.
- The honest residual gaps (learning persistence, surface consolidation, live security proof, roster
  ratification) are documented rather than hidden.
