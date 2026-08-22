# MEGA BUILD 7 — RELEASE CANDIDATE

Captured: 2026-08-22T18:30:55Z
Operator: Hermes Agent
Branch: mission-6/auth-release-certification
HEAD before final commit: ba17f86bc1b19fbe1649ca54c7ba750f0ec49459
origin/main: 4da4c8bff6536bdadfea007dac6458ca59182a67
State: pre-commit, pre-deploy. Production mobile acceptance still pending.

## Verdict flags

| Flag | Value | Evidence |
|------|-------|----------|
| CODE_READY | YES | lint exit 0; typecheck exit 0; tests 52/52; build exit 0 after recovery handoff changes |
| CI_READY | CONDITIONAL | deploy-web workflow patched locally to run lint/typecheck/test before build:edge; remote CI not proven until pushed |
| CONFIG_READY | CONDITIONAL | Supabase password_min_length=8 and recovery template uses `/auth/recover`; sessions/HIBP remain plan-limited/open |
| EMAIL_READY | YES | Resend domain verified and Supabase recovery request previously returned 200 with delivered password-reset email after SMTP realignment; fresh production email must be reissued after deployment |
| AUTH_RUNTIME_READY | NO | Production Android recovery journey not yet completed by human |
| AUTHORIZATION_READY | NO | Town-boundary/workspace authorization journey not fully executed with a least-privilege coordinator fixture |
| CLOUDFLARE_READY | CONDITIONAL | canonical user app is `enter.ubuntutown.co.za` on Pages project `ubuntu-town-web`; CI project/domain drift remains documented |
| PROVENANCE_READY | NO | failed deployment recorded commit hash but was rolled back; live production `/api/release` remains 404 on prior deployment |
| SECURITY_READY | CONDITIONAL | open redirects hardened and secret scan clean; branch protection/session timeout/HIBP still unresolved human/platform gates |
| ROLLBACK_READY | YES | rollback references retained in evidence ledger; generated sitemap noise reverted |
| SAFE_TO_MERGE | NO | branch not yet committed/pushed; remote CI not yet proven |
| SAFE_TO_DEPLOY | NO | direct production deploy failed smoke tests and was rolled back; supported deploy path still required |

## Current quality evidence

| Check | Result | Source |
|-------|--------|--------|
| Lint | PASS exit 0, existing unused-var warnings | `npm run lint` previous continuation |
| Typecheck | PASS exit 0 | `npm run typecheck` after build wait |
| Tests | PASS 52/52 | `npm run test` previous continuation |
| Build | PASS exit 0 | `~/tmp-mb7/build-after-recovery-20260822T181711Z.txt` |
| Build routes | PASS | `/auth/recover`, `/update-password`, `/api/release` listed; 186 static pages generated |

Build warnings: `cacheComponents` is an unrecognized Next config key; edge runtime static generation warning; metadataBase defaulted to localhost for social images. These did not fail the build.

## Recovery flow implemented

1. `resetPasswordAction` builds recovery redirect to `/auth/recover?next=/update-password`.
2. Supabase recovery email template uses `{{ .SiteURL }}/auth/recover?token_hash={{ .TokenHash }}&type=recovery&next=/update-password`.
3. `/auth/recover` is a human-tap handoff that does not verify/consume the token on GET.
4. The handoff button calls `completeRecoveryAction`, which verifies `token_hash` server-side and redirects to `/update-password`.
5. `/update-password` enforces 8-character minimum, confirmation match, and redirects to `/workspace` after update.
6. Redirect sanitization rejects external/protocol-relative paths.

## Diff and safety inspection

- Complete diff inspected before documentation update.
- Unrelated generated `public/sitemap-0.xml` build churn was reverted.
- Secret scan over changed/untracked files found no exposed credentials; only documentation mentions of `service_role` were flagged.
- Remaining changed files are auth recovery, password policy, tests, CI provenance, `/api/release`, and evidence docs.


## Deployment attempt status

- Commit: `69060a67433b2877c8ce398118ed9111ec511824`.
- GitHub push: BLOCKED by 403, token lacks push permission.
- Edge build: PASS (`~/tmp-mb7/build-edge-20260822T183733Z.txt`).
- Direct Cloudflare Pages deployment: created production deployment `9fab7b83-9c25-4a61-984e-ee797e1e09a6`, but smoke tests returned HTTP 500 on auth/recovery routes and `/api/release`.
- Rollback: PASS to prior production deployment `0108a31e-08e4-4724-bdf7-667ce6ce6c85`; post-rollback `/forgot-password` and `/login` returned HTTP 200.
- Result: recovery release is **not live**; do not issue production password-recovery email yet.

## Human approvals / gates still required

1. Commit and push mission branch.
2. Remote CI must pass on the pushed commit.
3. Production deployment must be made to the canonical `enter.ubuntutown.co.za` path and read back via `/api/release`/health checks.
4. A fresh production password-recovery email must be issued after deployment.
5. Human must complete Android password-reset journey and report whether new password signs into workspace.
6. Branch protection, HIBP, session timeouts, and full town-scoped authorization fixture remain follow-up/human/platform gates unless explicitly approved.
