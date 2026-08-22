# EVIDENCE LEDGER — Mission 6: Auth Release Certification

Started: 2026-08-21 (SAST)
Operator: Hermes Agent (z-ai/glm-5.2)
Repository: Kekelebaka/ubuntu-town-web
Branch: mission-6/auth-release-certification
Base commit: 4da4c8bff6536bdadfea007dac6458ca59182a67

## 0. SESSION REHYDRATION

| CLAIM | SOURCE | METHOD | RESULT | CONFIDENCE |
|-------|--------|--------|--------|------------|
| Repository cloned from GitHub | `git clone` | terminal | Success, clean tree | DIRECT |
| Default branch: main | `git branch --show-current` + GitHub API | terminal + API | main | DIRECT |
| Local HEAD = GitHub HEAD = 4da4c8b | `git log` + GitHub API commits | terminal + API | Match | DIRECT |
| Working tree clean | `git status --short` | terminal | No changes | DIRECT |

## 1. PROVENANCE RECONCILIATION

| CLAIM | SOURCE | METHOD | RESULT | CONFIDENCE |
|-------|--------|--------|--------|------------|
| Canonical repository: Kekelebaka/ubuntu-town-web | GitHub API | GET /repos/Kekelebaka/ubuntu-town-web | full_name confirmed | DIRECT |
| Default branch: main | GitHub API | repo.default_branch | "main" | DIRECT |
| GitHub HEAD SHA: 4da4c8bff6536bdadfea007dac6458ca59182a67 | GitHub API | GET /commits?sha=main | 4da4c8b | DIRECT |
| Local HEAD SHA: 4da4c8bff6536bdadfea007dac6458ca59182a67 | git | `git rev-parse HEAD` | 4da4c8b | DIRECT |
| Local == GitHub: MATCH | comparison | — | MATCH | DIRECT |
| Latest CI run: success, sha=4da4c8b, 2026-08-17T21:48 | GitHub API | GET /actions/runs | conclusion=success | DIRECT |
| CI workflow: Deploy Web (active) | GitHub API | GET /actions/workflows | state=active | DIRECT |
| CI workflow: Deploy Outbox Worker (active) | GitHub API | GET /actions/workflows | state=active | DIRECT |
| Branch protection on main: UNKNOWN | GitHub API | 403 on protection endpoint | Token lacks permission | UNKNOWN |
| Cloudflare Pages project: ubuntu-town-web (production) | Cloudflare API | GET /pages/projects | production_branch=main, domains=enter.ubuntutown.co.za + johannesburg.ubuntutown.co.za + senekal.ubuntutown.co.za | DIRECT |
| Cloudflare Pages project: ubuntu-town-web-git (CI/CD) | Cloudflare API | GET /pages/projects | production_branch=main, domains=ubuntu-town-web-git.pages.dev only | DIRECT |
| Cloudflare latest deployment (ubuntu-town-web): 2026-07-15T20:45 | Cloudflare API | GET /deployments | 0108a31e-08e4-4724-bdf7-667ce6ce6c85, deploy:success | DIRECT |
| Cloudflare latest deployment (ubuntu-town-web-git): 2026-08-17T21:50 | Cloudflare API | GET /deployments | c604a1ba-a34d-424c-a37d-37d6a85879c2, deploy:success | DIRECT |
| Cloudflare zone: ubuntutown.co.za (active) | Cloudflare API | GET /zones | zone c7ce0ac588b913ec80fecd3ba4442bad | DIRECT |
| Cloudflare account: c63d3d6d8c17db7487ab40b81d5e29d1 | Cloudflare API | GET /accounts | Chiefops26@gmail.com | DIRECT |
| Branch protection on main: NOT PROTECTED | GitHub API | GET /branches/main | protected=false | DIRECT |
| GitHub latest CI run: success, sha=4da4c8b, 2026-08-17T21:48 | GitHub API | GET /actions/runs | conclusion=success, head_sha=4da4c8b | DIRECT |
| www.ubuntutown.co.za NOT in Cloudflare Pages domains | Cloudflare API | GET /pages/projects | Not listed on ubuntu-town-web or ubuntu-town-web-git | DIRECT |

## 2. SMTP RECONCILIATION

| CLAIM | SOURCE | METHOD | RESULT | CONFIDENCE |
|-------|--------|--------|--------|------------|
| Supabase project: ubuntu-town-os (ACTIVE_HEALTHY) | Supabase API | GET /v1/projects | id=afiokbhuxfdacbsipoqk | DIRECT |
| Supabase site_url: https://enter.ubuntutown.co.za | Supabase API | GET /config/auth | site_url field | DIRECT |
| SMTP host: smtp.resend.com | Supabase API | GET /config/auth | smtp_host field | DIRECT |
| SMTP port: 465 | Supabase API | GET /config/auth | smtp_port field | DIRECT |
| SMTP user: resend | Supabase API | GET /config/auth | smtp_user field | DIRECT |
| SMTP admin email: no-reply@ubuntutown.co.za | Supabase API | GET /config/auth | smtp_admin_email field | DIRECT |
| mailer_autoconfirm: true | Supabase API | GET /config/auth | field value | DIRECT |
| mailer_otp_exp: 3600 (1 hour) | Supabase API | GET /config/auth | field value | DIRECT |
| mailer_otp_length: 8 | Supabase API | GET /config/auth | field value | DIRECT |
| URI allow list: 5 entries | Supabase API | GET /config/auth | uri_allow_list field | DIRECT |
| Redirect allowlist includes: enter.ubuntutown.co.za/** | Supabase API | GET /config/auth | In uri_allow_list | DIRECT |
| Redirect allowlist includes: www.ubuntutown.co.za/** | Supabase API | GET /config/auth | In uri_allow_list | DIRECT |
| Redirect allowlist includes: ubuntutown.co.za/** | Supabase API | GET /config/auth | In uri_allow_list | DIRECT |
| Redirect allowlist includes: ubuntu-town-web.pages.dev/** | Supabase API | GET /config/auth | In uri_allow_list | DIRECT |
| Redirect allowlist includes: 8178cd8b.ubuntu-town-os-web.pages.dev/auth/callback | Supabase API | GET /config/auth | In uri_allow_list | DIRECT |
| Resend domain: kekelebaka.com (verified) | Resend API | GET /domains | status=verified | DIRECT |
| Resend domain: ubuntutown.co.za NOT registered | Resend API | GET /domains | Only kekelebaka.com returned | DIRECT |
| SMTP_CODE_READY: YES | derived | — | Code uses /auth/confirm?token_hash=... pattern | DIRECT |
| SMTP_CONFIG_READY: YES | derived | — | smtp.resend.com configured in Supabase | DIRECT |
| RESEND_READY: PARTIAL | derived | — | kekelebaka.com verified but no ubuntutown.co.za domain in Resend | DIRECT |
| RUNTIME_PROVEN: PREVIOUSLY | session history | prior SMTP test | HTTP 200 on password reset, email sent | INFERRED |
| OVERALL_SMTP_STATUS: PARTIAL | derived | — | SMTP configured, Resend domain mismatch (sends from kekelebaka.com, not ubuntutown.co.za) | DIRECT |

### SMTP Finding: Sender Domain Mismatch
- Supabase `smtp_admin_email` = `no-reply@ubuntutown.co.za`
- Resend only has domain `kekelebaka.com` verified
- `no-reply@ubuntutown.co.za` is NOT a verified Resend sender domain
- This means emails may fail or be sent from a different configured sender
- This is a PRE-EXISTING condition, not introduced by Mission 6
- No production mutation performed — observation only

## 3. TYPECHECK FORENSICS

| CLAIM | SOURCE | METHOD | RESULT | CONFIDENCE |
|-------|--------|--------|--------|------------|
| TypeScript errors: 16 (reproduced) | `npx tsc --noEmit` | terminal | 16 errors | DIRECT |
| Lint: PASS (0 errors, warnings only) | `npx oxlint src/` | terminal | exit 0 | DIRECT |
| Auth-related TS errors: 3 | analysis | TYPECHECK-ERROR-REGISTER.md | Errors 1-3 | DIRECT |
| Non-auth TS errors: 13 | analysis | TYPECHECK-ERROR-REGISTER.md | Errors 4-16 | DIRECT |
| next.config.ts has ignoreBuildErrors: true | `cat next.config.ts` | file read | Confirmed | DIRECT |

## 4. EMAIL TEMPLATE FINDING

| CLAIM | SOURCE | METHOD | RESULT | CONFIDENCE |
|-------|--------|--------|--------|------------|
| Magic link template uses {{ .Token }} as href | Supabase API | GET /config/auth | `<a href="{{ .Token }}">Sign in</a>` | DIRECT |
| Token should be displayed as code, not a URL | analysis | — | {{ .Token }} is the OTP code, not a link | DIRECT |
| Confirmation template uses {{ .ConfirmationURL }} | Supabase API | GET /config/auth | Correct usage | DIRECT |
| Recovery template uses {{ .ConfirmationURL }} | Supabase API | GET /config/auth | Correct usage | DIRECT |
| Template does NOT use {{ .TokenHash }} or {{ .SiteURL }} | Supabase API | GET /config/auth | Missing from recovery template | DIRECT |

### Template Finding:
The recovery (password reset) template uses `{{ .ConfirmationURL }}` which routes through the PKCE flow (/auth/callback).
The code's `resetPasswordAction` sets `redirectTo` to `/auth/confirm?token_hash=...&next=/update-password`.
But the template sends `{{ .ConfirmationURL }}` which Supabase constructs as the PKCE callback URL, not the token_hash URL.
This means password reset links may go through /auth/callback (PKCE) instead of /auth/confirm (token_hash).
On mobile (cross-device), PKCE fails because the code verifier cookie is missing.
This is a PRE-EXISTING condition that the code tries to address by setting redirectTo to /auth/confirm,
but the template may override this with {{ .ConfirmationURL }}.

No production mutation performed — observation only.

## 5. TYPE FIXES (Gate 2 → Gate 4)

| CLAIM | SOURCE | METHOD | RESULT | CONFIDENCE |
|-------|--------|--------|--------|------------|
| TypeScript errors: 0 (fixed from 16) | `npx tsc --noEmit` | terminal | exit 0 | DIRECT |
| Lint: PASS (0 errors, 35 warnings) | `npx oxlint src/` | terminal | exit 0 | DIRECT |
| Tests: 49/49 PASS | `npx vitest run` | terminal | 2 test files, 49 tests, exit 0 | DIRECT |
| Build: PASS | `npx next build` | terminal | exit 0, 186 routes generated | DIRECT |
| Build duration: ~5 min | terminal | process timing | compiled in 2.7min + static generation | DIRECT |
| Open redirect fix verified | auth-redirect.test.ts | vitest | 49 tests cover safe + malicious redirects | DIRECT |
| Auth schema validation verified | auth-schemas.test.ts | vitest | signUp, signIn, magic link, OTP, password reset schemas | DIRECT |

### Build Evidence:
- Node version: v26.3.1
- npm version: 11.17.0
- Framework: Next.js 15.5.2
- Build command: `npx next build` (production build)
- CI/CD build command: `npm run build:edge` (next-on-pages)
- Lint exit: 0
- Typecheck exit: 0
- Test exit: 0 (49/49)
- Build exit: 0

### Files Changed (uncommitted on mission-6/auth-release-certification):
- Modified: package.json, package-lock.json (vitest devDep added)
- Modified: src/app/(auth-pages)/auth/callback/route.ts (open redirect fix)
- Modified: src/app/(auth-pages)/login/Login.tsx
- Modified: src/app/(auth-pages)/sign-up/Signup.tsx
- Modified: src/app/admin/page.tsx
- Modified: src/app/coordinator/page.tsx
- Modified: src/app/town/[slug]/TownClient.tsx
- Modified: src/app/workspace/WorkspaceClient.tsx
- Modified: src/app/workspace/work/WorkDetailClient.tsx
- Modified: src/components/community-work/CommunityWorkSection.tsx
- Modified: src/data/auth/auth.ts
- Modified: src/data/townPhotos.ts
- Deleted: src/sometest.test.ts (stale vitest placeholder)
- Added: src/styles/declarations.d.ts (CSS module declarations)
- Added: src/tests/auth-redirect.test.ts (open redirect security tests)
- Added: src/tests/auth-schemas.test.ts (auth schema validation tests)

## 6. CI/CD ASSESSMENT

| CLAIM | SOURCE | METHOD | RESULT | CONFIDENCE |
|-------|--------|--------|--------|------------|
| CI workflow: Deploy Web | GitHub API + file read | .github/workflows/deploy-web.yml | active, triggers on push to main | DIRECT |
| CI steps: checkout → setup-node → cp .env.local.uto → npm ci → npm run build:edge → wrangler deploy | file read | deploy-web.yml | No lint, no typecheck, no test gates | DIRECT |
| CI deploys to: ubuntu-town-web-git (Cloudflare Pages) | file read | deploy-web.yml | --project-name=ubuntu-town-web-git | DIRECT |
| CI does NOT run typecheck | file read | deploy-web.yml | No `npm run typecheck` step | DIRECT |
| CI does NOT run tests | file read | deploy-web.yml | No `npm run test` or `npx vitest` step | DIRECT |
| CI does NOT run lint | file read | deploy-web.yml | No `npm run lint` step | DIRECT |
| CI Release Gate: PARTIAL | derived | — | Build runs but quality gates absent | DIRECT |
| Branch protection: NONE | GitHub API | GET /branches/main | protected=false | DIRECT |

### CI/CD Finding:
The deployment workflow runs `npm run build:edge` (which uses `next-on-pages` with `ignoreBuildErrors: true`) but does NOT run lint, typecheck, or tests before deploying. A release can go GREEN with type errors and test failures. This is a PARTIAL gate — the build itself succeeds, but quality gates are missing.

## 7. SUPABASE CONFIGURATION DIFF

| Field | Current | Target | Change Required |
|-------|---------|--------|-----------------|
| site_url | https://enter.ubuntutown.co.za | https://enter.ubuntutown.co.za | NONE (correct) |
| uri_allow_list | 5 entries (see above) | Same | NONE (acceptable) |
| smtp_host | smtp.resend.com | smtp.resend.com | NONE (correct) |
| smtp_port | 465 | 465 | NONE (correct) |
| smtp_admin_email | no-reply@ubuntutown.co.za | no-reply@ubuntutown.co.za | NONE (but domain not in Resend) |
| mailer_autoconfirm | true | true | NONE |
| mailer_otp_exp | 3600 | 3600 | NONE |
| mailer_otp_length | 8 | 8 | NONE |
| password_min_length | 6 | 8 | CHANGE REQUIRED (inconsistent with signUpSchema min(8)) |
| sessions_timebox | 0 | 604800 (7 days) | RECOMMENDED (not blocking) |
| sessions_inactivity_timeout | 0 | 1800 (30 min) | RECOMMENDED (not blocking) |
| password_hibp_enabled | false | true | RECOMMENDED (not blocking) |
| Google OAuth | enabled | enabled | NONE |
| magic_link template | {{ .Token }} as href | {{ .Token }} as text + {{ .ConfirmationURL }} as link | CHANGE REQUIRED |
| recovery template | {{ .ConfirmationURL }} | Consider {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }} | REVIEW RECOMMENDED |

## 8. CLOUDFLARE PRODUCTION PROVENANCE

| CLAIM | SOURCE | METHOD | RESULT | CONFIDENCE |
|-------|--------|--------|--------|------------|
| Production Pages project: ubuntu-town-web | Cloudflare API | GET /pages/projects | enter.ubuntutown.co.za + johannesburg.ubuntutown.co.za + senekal.ubuntutown.co.za | DIRECT |
| CI/CD Pages project: ubuntu-town-web-git | Cloudflare API | GET /pages/projects | ubuntu-town-web-git.pages.dev only | DIRECT |
| Production deployment last updated: 2026-07-15 | Cloudflare API | GET /deployments | 0108a31e, deploy:success | DIRECT |
| CI/CD deployment last updated: 2026-08-17 | Cloudflare API | GET /deployments | c604a1ba, deploy:success | DIRECT |
| www.ubuntutown.co.za: NOT attached to any Pages project | Cloudflare API | GET /pages/projects | Not in domain list for any project | DIRECT |
| Zone ubuntutown.co.za: active | Cloudflare API | GET /zones | status=active | DIRECT |
| Production commit cannot be proven (no commit SHA in deployment metadata) | Cloudflare API | GET /deployments | sha=N/A in all deployments | DIRECT |

### Cloudflare Finding:
There are TWO Cloudflare Pages projects:
1. `ubuntu-town-web` — the production project with custom domains (enter.ubuntutown.co.za, johannesburg.ubuntutown.co.za, senekal.ubuntutown.co.za). Last deployed 2026-07-15.
2. `ubuntu-town-web-git` — the CI/CD target (ubuntu-town-web-git.pages.dev only). Last deployed 2026-08-17.

The CI/CD pipeline deploys to ubuntu-town-web-git, NOT to the production project. The production project was last deployed on 2026-07-15 (over a month ago). www.ubuntutown.co.za is not attached to any Pages project — it may be served via a CNAME redirect or Cloudflare worker, not directly via Pages.

## 9. RELEASE CERTIFICATION SUMMARY

### Final Build Evidence (2026-08-21, SAST):
- LINT: PASS (exit 0, 35 warnings, 0 errors)
- TYPECHECK: PASS (exit 0, 0 errors)
- TESTS: PASS (49/49, 2 test files, exit 0)
- BUILD: PASS (exit 0, 186 routes, Next.js 15.5.2)

### Commits: 2 (on mission-6/auth-release-certification)
### Production Mutations: 0
### Regressions: 0
### Unknowns: Production deployment SHA (Cloudflare deployments don't expose commit SHA)

## 10. MISSION 6.1 — PRODUCTION READINESS CLOSURE

### Gate 1 — Commit
- COMMIT_SHA: cbe3ee91326c7a9bf6cfea669364ed1b3114e6f9
- No secrets, credentials, or env files in diff (verified)
- 17 files changed (13 modified, 1 deleted, 3 added)

### Gate 2 — Remove ignoreBuildErrors
- COMMIT_SHA: ba17f86bc1b19fbe1649ca54c7ba750f0ec49459
- ignoreBuildErrors: true removed from next.config.ts
- Build passes WITH full type checking (exit 0, 186 routes)
- No regressions

### Gate 3 — CI Quality Gates
- PROPOSED diff in PROPOSED-CI-GATES.diff.md
- Adds: Lint, Typecheck, Test steps before Build
- Not applied — awaiting human approval

### Gate 4 — Production Project Reconciliation
- Production project: ubuntu-town-web (enter.ubuntutown.co.za + 2 town domains)
- CI/CD project: ubuntu-town-web-git (ubuntu-town-web-git.pages.dev only)
- CI deploys to CI/CD project, NOT production project
- Last production deployment: 2026-07-15 (5 weeks stale)
- Reconciliation plan documented in MISSION-6.1-RELEASE-CANDIDATE.md

### Gate 5 — Production SHA Provenance
- PRODUCTION_SHA: UNKNOWN
- Cloudflare deployment metadata does not expose commit SHA
- No Git linkage on production project (source = {})

### Gate 6 — Supabase Auth Config
- Magic link template: CONFIRMED DEFECT — {{ .Token }} (OTP code) used as href
- Recovery template: Uses {{ .ConfirmationURL }} (PKCE) — cross-device issue
- password_min_length: 6 (should be 8)
- sessions_timebox: 0, sessions_inactivity_timeout: 0 (no expiry)
- HIBP: disabled
- Rate limits: 30/interval for email_sent and verify (adequate)

### Gate 7 — Resend Domain
- Only kekelebaka.com verified
- ubuntutown.co.za NOT registered in Resend
- Sender: no-reply@ubuntutown.co.za (domain not in Resend)

### Gate 8 — Runtime Auth Test Plan
- Prepared but NOT executed — requires template fix first
- 7 journeys: login, password reset, magic link, OTP, invalid link, logout, role resolution

### Gate 9 — Branch Protection
- main: NOT protected
- Proposed: require PR, require status checks, no force push, no deletion

### Gate 10 — Session Policy
- Current: no expiry (sessions_timebox=0, sessions_inactivity_timeout=0)
- Recommended: 7-day timebox, 30-min inactivity timeout
- Classification: POST_RELEASE_GOVERNANCE

### Gate 11 — HIBP / Password Policy
- Current: 3 different minimums (6, 8, 4) + HIBP disabled
- Target: unify at 8, enable HIBP
- Classification: CHANGE_REQUIRED

### Gate 12 — WWW / Enter Routing
- Both resolve to same Cloudflare edge IP (104.21.60.235)
- Both serve same Next.js application
- www NOT directly attached to any Pages project
- Routing mechanism: PARTIAL (likely DNS CNAME/proxy, cannot inspect DNS records)
