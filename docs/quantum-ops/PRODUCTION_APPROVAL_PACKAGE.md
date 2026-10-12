# PRODUCTION APPROVAL PACKAGE — Ubuntu Town OS

One concise package. **Nothing below is executed — all four cross the production approval boundary.**

---

## A. DOMAIN
- **What**: Bind `work.ubuntutown.co.za` to Cloudflare Pages project `ubuntu-town-web-git`.
- **Why**: Make the target production origin reachable (currently HTTP 522 — root cause: custom domain not bound).
- **Risk**: Public production exposure of the OS at the operational domain.
- **Rollback**: `wrangler pages domain remove work.ubuntutown.co.za --project-name=ubuntu-town-web-git` (or dashboard unbind); DNS unchanged.
- **Expected**: `https://work.ubuntutown.co.za` → HTTP 200.
- **Command**: `npx wrangler pages domain add work.ubuntutown.co.za --project-name=ubuntu-town-web-git` (see PRODUCTION_DOMAIN_CHANGE.md).

## B. CODE
- **What**: Merge PR #34 (`utospulse/scope-resolver`, SHA `9837b100`) → `main`.
- **Why**: Promote the validated release (400/400 tests, tsc clean, build PASS, learning persistence, staging safety).
- **Risk**: Triggers `deploy-web.yml` production deployment from the approved SHA.
- **Rollback**: Cloudflare Pages rollback to prior deployment / `git revert` the merge commit on `main`.
- **Expected**: production deployment from approved SHA; CI `validate` green on PR.

## C. DATABASE
- **What**: Apply `supabase/migrations/0024_learnings.sql` (sha256 `3837eb98bf5dde4f059ca13391d72db5`) to production via ONE transaction.
- **Why**: Enable canonical learning persistence (`uto.learnings`) in production.
- **Risk**: Schema change (new table + RLS + grants + helper; no existing rows mutated).
- **Rollback**: `drop table uto.learnings cascade` + drop helper; restore pre-change `uto` schema dump. Idempotent.
- **Expected**: `uto.learnings` present (22 cols / 6 RLS policies / 9 indexes / RLS+FORCE) and `learnings_validation.py` = 11/11.
- **Command**: `psql ... --single-transaction -v ON_ERROR_STOP=1 -f supabase/migrations/0024_learnings.sql` (see PRODUCTION_MIGRATION_0024.md). **Never `db push`.**

## D. POST-DEPLOY (after A+B+C approved & executed)
Run and record:
1. health check (`work.ubuntutown.co.za` → 200)
2. auth check (login + role)
3. scope check (town/initiative boundaries)
4. Passport load
5. Pulse
6. workspace
7. learning write (createLearning under a real user session)
8. learning read (author + national visibility)
9. cross-tenant denial (cross-town/cross-initiative/unauth → DENIED)
10. domain check (only `work` host changed; www/apex unaffected)

---

**Approval status: PENDING HUMAN.** Production actions A (domain), B (merge/deploy), C (migration) are not executed.
Governance C-05 (roster ratification) and C-06 (0015–0017 provenance) remain **DECISION REQUIRED** and are
independent of A–D.
