# CTSO ENABLEMENT NOTES — Mission 6

Captured: 2026-08-21 (SAST)
Purpose: Enable a future Technology Command layer to answer governance questions.

## WHAT IS DEPLOYED?

- **Application**: ubuntu-town-web (Next.js 15, TypeScript, App Router)
- **Platform**: Cloudflare Pages (TWO projects: production + CI/CD)
- **Repository**: https://github.com/Kekelebaka/ubuntu-town-web
- **Production branch**: main
- **Latest production commit**: 4da4c8bff6536bdadfea007dac6458ca59182a67
- **Latest CI run**: success (2026-08-17T21:48:18Z), sha=4da4c8b
- **Cloudflare Pages (production)**: ubuntu-town-web project
  - Custom domains: enter.ubuntutown.co.za, johannesburg.ubuntutown.co.za, senekal.ubuntutown.co.za
  - Last deployment: 2026-07-15T20:45 (deployment ID: 0108a31e)
  - NOTE: www.ubuntutown.co.za NOT directly attached (may be CNAME/worker)
- **Cloudflare Pages (CI/CD)**: ubuntu-town-web-git project
  - Domain: ubuntu-town-web-git.pages.dev only
  - Last deployment: 2026-08-17T21:50 (deployment ID: c604a1ba)
- **CI/CD**: GitHub Actions (Deploy Web) → Cloudflare Pages (direct upload via wrangler)

## FROM WHICH REPOSITORY?

- **Canonical**: Kekelebaka/ubuntu-town-web (public)
- **Lockfile**: package-lock.json (npm, lockfileVersion 3)
- **Node version**: >=20.0.0 (CI uses Node 20)

## FROM WHICH COMMIT?

- **Local HEAD**: 4da4c8b (matches GitHub)
- **GitHub HEAD**: 4da4c8b
- **Production deployment**: Cannot verify via Cloudflare API (token lacks Pages read permission)
- **CI latest successful run**: sha=4da4c8b (2026-08-17)

## WHO OWNS IT?

- **GitHub owner**: Kekelebaka
- **Cloudflare account**: Chiefops26@gmail.com
- **Supabase project**: ubuntu-town-os (id: afiokbhuxfdacbsipoqk)

## IS IT HEALTHY?

- **Supabase project status**: ACTIVE_HEALTHY
- **Cloudflare zone**: active (ubuntutown.co.za)
- **CI**: All recent runs successful (last 5 runs, sha=4da4c8b latest)
- **Typecheck**: PASS (0 errors, after Mission 6 fixes)
- **Tests**: PASS (49/49, 2 test files)
- **Lint**: PASS (0 errors, 35 warnings)
- **Build**: PASS (exit 0, 186 routes, Next.js 15.5.2)
- **CI/CD Quality Gates**: PARTIAL — no lint/typecheck/test gates in CI workflow
- **Branch protection**: NONE on main (protected=false)

## IS AUTHENTICATION HEALTHY?

- **Supabase Auth**: Active, email + Google OAuth enabled
- **SITE_URL**: https://enter.ubuntutown.co.za
- **SMTP**: Configured via smtp.resend.com (port 465)
- **Resend domain**: kekelebaka.com verified (ubuntutown.co.za NOT in Resend)
- **Password reset flow**: Uses /auth/confirm?token_hash=... (cross-device compatible)
- **PKCE callback**: /auth/callback (same-device)
- **OTP flow**: 8-digit code, 1-hour expiry
- **Open redirect**: FIXED (hostname validation added to callback)
- **Rate limiting**: Supabase GoTrue (30 req/interval for email/OTP/verify)

## ARE THERE SECURITY EXCEPTIONS?

1. **next.config.ts** has `typescript.ignoreBuildErrors: true` — pre-existing workaround for auth template type errors. Now resolved (16→0 errors). Can be removed.
2. **Resend domain mismatch**: Supabase sends from no-reply@ubuntutown.co.za but only kekelebaka.com is verified in Resend. This may cause email delivery issues.
3. **Magic link template**: Uses `{{ .Token }}` as an href in a link, which is the OTP code, not a URL. The link points to the code string, not a valid URL.
4. **Password min length**: Supabase config says 6, updatePasswordSchema says 4, signUpSchema says 8. Inconsistent.
5. **HIBP check**: Disabled (password_hibp_enabled = false)
6. **Apple OAuth**: Not enabled (type exists in AuthProvider but not in Supabase config)

## WHAT CHANGED?

Mission 6 + 6.1 changes (branch: mission-6/auth-release-certification):
- Fixed 16 TypeScript errors (3 auth, 13 non-auth)
- Added open redirect fix to /auth/callback (hostname validation)
- Added auth test suite (49 tests: redirect security + schema validation + protected routes)
- Added CSS module declarations
- Deleted stale sometest.test.ts (vitest placeholder)
- Added vitest as devDependency
- Added test script to package.json
- Removed ignoreBuildErrors: true from next.config.ts (build now enforces type safety)
- Commits: cbe3ee9, ba17f86 on mission-6/auth-release-certification

## CAN IT BE ROLLED BACK?

- **Git**: Yes — revert to any commit on main
- **Cloudflare Pages**: Yes — wrangler-action supports rollback to previous deployment
- **Supabase**: Auth config changes are reversible via dashboard/API
- **Database**: Migrations are forward-only; rollback requires manual SQL

## WHAT REQUIRES HUMAN APPROVAL?

1. Merging mission-6/auth-release-certification to main
2. Adding CI quality gates (lint, typecheck, test) to deploy-web.yml
3. Enabling branch protection on main
4. Adding ubuntutown.co.za to Resend verified domains (requires DNS changes)
5. Fixing magic link template in Supabase dashboard ({{ .Token }} → {{ .ConfirmationURL }} + display code)
6. Fixing recovery template in Supabase dashboard ({{ .ConfirmationURL }} → token_hash flow)
7. Updating Supabase password_min_length from 6 to 8
8. Updating updatePasswordSchema min(4) to min(8) in code
9. Enabling HIBP password check in Supabase
10. Setting session timeouts (7-day timebox, 30-min inactivity)
11. Reconciling CI/CD deployment target (ubuntu-town-web-git → ubuntu-town-web)
12. Attaching www.ubuntutown.co.za to production Pages project
13. Any production DNS changes
14. Any production deployment

## SUPABASE CONFIGURATION

- **Project ID**: afiokbhuxfdacbsipoqk
- **Project name**: ubuntu-town-os
- **Region**: eu-west-1
- **Status**: ACTIVE_HEALTHY
- **Site URL**: https://enter.ubuntutown.co.za
- **URI allow list**:
  - https://8178cd8b.ubuntu-town-os-web.pages.dev/auth/callback
  - https://enter.ubuntutown.co.za/**
  - https://ubuntutown.co.za/**
  - https://www.ubuntutown.co.za/**
  - https://ubuntu-town-web.pages.dev/**
- **SMTP**: smtp.resend.com:465 (user: resend, admin email: no-reply@ubuntutown.co.za)
- **External providers**: Google (enabled), GitHub (disabled), Twitter (disabled), Apple (disabled)
- **mailer_autoconfirm**: true
- **mailer_otp_exp**: 3600 (1 hour)
- **mailer_otp_length**: 8
- **password_min_length**: 6
- **sessions_timebox**: 0 (no expiry)
- **sessions_inactivity_timeout**: 0 (no inactivity timeout)

## CLOUDFLARE CONFIGURATION

- **Account**: c63d3d6d8c17db7487ab40b81d5e29d1 (Chiefops26@gmail.com)
- **Zone**: ubuntutown.co.za (c7ce0ac588b913ec80fecd3ba4442bad, active)
- **Pages project (production)**: ubuntu-town-web
  - Domains: enter.ubuntutown.co.za, johannesburg.ubuntutown.co.za, senekal.ubuntutown.co.za
  - Last deployment: 2026-07-15 (0108a31e)
  - NOTE: www.ubuntutown.co.za NOT directly attached to this project
- **Pages project (CI/CD)**: ubuntu-town-web-git
  - Domain: ubuntu-town-web-git.pages.dev only
  - Last deployment: 2026-08-17 (c604a1ba)
- **CI/CD deploys to**: ubuntu-town-web-git (NOT the production project)
- **Token permissions**: Zone:Read + Pages:Read (verified)
- **Production deployment provenance**: CANNOT be proven — Cloudflare deployment metadata does not expose commit SHA

## RESEND CONFIGURATION

- **Domains**: kekelebaka.com (verified); ubuntutown.co.za registered, status not_started
- **Claim pending**: ba1b1fb3-3706-4fd1-bd8a-c2b4b16cc56c expires 2026-08-29 10:41:19 UTC
- **Claim TXT**: ubuntutown.co.za → resend-domain-verification=c7f450041609ec9f2d3a428fffcb1feb
- **Then**: DKIM TXT resend._domainkey; MX+SPF on send. DNS write not done.

## MEGA BUILD 7 ADDENDUM — 2026-08-22T11:57Z

- Working branch still mission-6/auth-release-certification @ ba17f86, dirty, not on remote.
- Production still ubuntu-town-web 0108a31e / 20ce5586 (2026-07-15). CI still ubuntu-town-web-git c604a1ba / 4da4c8b.
- www.ubuntutown.co.za is a 1423-byte Vite/Telegram SPA, not the Next.js app. enter is the canonical Next app.
- Supabase: password_min_length=8; magic/recovery templates use token_hash. sessions/HIBP unchanged (Pro 402).
- Resend/Supabase email: ubuntutown.co.za verified with DKIM/SPF/MX; Supabase SMTP credential realigned to the current Resend key; password recovery email to kekelebaka@outlook.com accepted by Supabase and delivered by Resend 2026-08-22T16:20Z.
- ignoreBuildErrors is gone. CI quality gates exist only in the local workflow file.
- /api/release exists locally, 404 in production.
- SAFE_TO_DEPLOY = NO. See MEGA-BUILD-7-RELEASE-CANDIDATE.md.
