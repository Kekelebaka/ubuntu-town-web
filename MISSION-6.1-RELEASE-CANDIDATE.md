# MISSION 6.1 — PRODUCTION READINESS CLOSURE
## RELEASE CANDIDATE DOCUMENT

Date: 2026-08-21 (SAST)
Operator: Hermes Agent (z-ai/glm-5.2)
Branch: mission-6/auth-release-certification

---

## 1. COMMIT SHA

COMMIT_SHA: ba17f86bc1b19fbe1649ca54c7ba750f0ec49459
BRANCH: mission-6/auth-release-certification
BASE: 4da4c8bff6536bdadfea007dac6458ca59182a67 (origin/main)

Commits:
  cbe3ee9 — mission6: certify auth release and harden redirects (17 files)
  ba17f86 — mission6.1: remove ignoreBuildErrors from next.config.ts (1 file)

TOTAL_FILES_CHANGED: 18

## 2. TEST RESULTS

LINT: PASS (exit 0, 35 warnings, 0 errors)
TYPECHECK: PASS (exit 0, 0 errors)
TESTS: 49/49 PASS (2 test files, exit 0)
BUILD: PASS (exit 0, 186 routes, Next.js 15.5.2)
  - Build passes WITH ignoreBuildErrors removed
  - Full type checking enabled in build

## 3. SECURITY STATUS

OPEN_REDIRECT: FIXED and TESTED
  - /auth/callback rejects //, external hostnames, javascript:, encoded variants
  - 49 tests covering safe redirects + malicious redirect rejection
  - Hostname validation: resolved.hostname === requestUrl.hostname

SECRETS: None in diff (verified)
CREDENTIALS: None in diff (verified)
ENV FILES: None in diff (verified)

SECURITY_CRITICAL: 0
SECURITY_HIGH: 1 — Magic link template defect ({{ .Token }} used as href)
SECURITY_MEDIUM: 3 — Resend domain mismatch, password_min_length inconsistency, no CI quality gates
SECURITY_LOW: 5 — No branch protection, no session timeouts, HIBP disabled, unused lint, getClaims deprecated

## 4. CI STATUS

WORKFLOW: Deploy Web (.github/workflows/deploy-web.yml)
STATE: active
CURRENT GATES: checkout → setup-node → cp .env.local.uto → npm ci → build:edge → deploy
MISSING GATES: lint, typecheck, test
CI_RELEASE_GATE: PARTIAL — build succeeds but quality gates absent

PROPOSED DIFF (PROPOSED-CI-GATES.diff.md):
  Add after "npm ci":
    - name: Lint       → npm run lint
    - name: Typecheck  → npm run typecheck
    - name: Test       → npm run test
  Before:
    - name: Build      → npm run build:edge

BRANCH PROTECTION: NONE (protected=false on main)

## 5. CLOUDFLARE PROJECT STATUS

TWO Cloudflare Pages projects exist:

### Production Project: ubuntu-town-web
  SUBDOMAIN: ubuntu-town-web.pages.dev
  PRODUCTION_BRANCH: main
  CUSTOM_DOMAINS: enter.ubuntutown.co.za, johannesburg.ubuntutown.co.za, senekal.ubuntutown.co.za
  BUILD_COMMAND: npx @cloudflare/next-on-pages@1.13.16
  LAST_DEPLOYMENT: 2026-07-15T20:45 (deployment ID: 0108a31e)
  DEPLOYMENT_SOURCE: Unknown (no Git linkage, no commit SHA in metadata)
  CLASSIFICATION: CANONICAL_PRODUCTION_PROJECT

### CI/CD Project: ubuntu-town-web-git
  SUBDOMAIN: ubuntu-town-web-git.pages.dev
  PRODUCTION_BRANCH: main
  CUSTOM_DOMAINS: ubuntu-town-web-git.pages.dev only
  BUILD_COMMAND: None (direct upload via wrangler)
  LAST_DEPLOYMENT: 2026-08-17T21:50 (deployment ID: c604a1ba)
  DEPLOYMENT_SOURCE: GitHub Actions (deploy-web.yml)
  CLASSIFICATION: CI_ONLY_PROJECT

### Finding
CI/CD deploys to ubuntu-town-web-git (CI-only), NOT to the production project.
The production project was last deployed 2026-07-15 (5 weeks ago).
www.ubuntutown.co.za is NOT directly attached to any Pages project.
Both www and enter resolve to the same Cloudflare edge IP (104.21.60.235).

### Reconciliation Plan
1. Add CI quality gates to deploy-web.yml
2. Change deploy target from ubuntu-town-web-git to ubuntu-town-web (production project)
3. Or: keep CI deploying to ubuntu-town-web-git as staging, add separate production deploy step
4. Requires human approval — do NOT change routing yet

### www.ubuntutown.co.za Routing
Both www.ubuntutown.co.za and enter.ubuntutown.co.za resolve to the same Cloudflare edge IP (104.21.60.235).
Both return HTTP 200 with Cloudflare server headers.
www.ubuntutown.co.za is NOT listed as a custom domain on any Pages project.
Likely routed via Cloudflare DNS CNAME/proxy to the same Pages project, or via a Worker.
DNS records cannot be inspected (token lacks DNS:Read permission).
CLASSIFICATION: PARTIAL — serving the same app but routing mechanism not fully proven.

## 6. PRODUCTION PROVENANCE

PRODUCTION_SHA: UNKNOWN
CONFIDENCE: LOW
EVIDENCE:
  - Cloudflare deployment metadata does not expose commit SHA
  - ubuntu-town-web project has no Git linkage (source = {})
  - Last production deployment: 2026-07-15T20:45
  - Last CI/CD deployment: 2026-08-17T21:50 (to different project)
  - GitHub latest CI run: sha=4da4c8b, 2026-08-17T21:48:18Z

REQUIREMENT: All future deployments must record:
  - repository
  - branch
  - commit SHA
  - build ID
  - deployment ID
  - timestamp
  - actor

## 7. SUPABASE CONFIG DIFF

### Current Configuration (READ-ONLY inspection)

| Field | Current | Target | Change Required |
|-------|---------|--------|-----------------|
| site_url | https://enter.ubuntutown.co.za | — | NONE (correct) |
| uri_allow_list | 5 entries | — | NONE (acceptable) |
|   - https://8178cd8b.ubuntu-town-os-web.pages.dev/auth/callback | | | |
|   - https://enter.ubuntutown.co.za/** | | | |
|   - https://ubuntutown.co.za/** | | | |
|   - https://www.ubuntutown.co.za/** | | | |
|   - https://ubuntu-town-web.pages.dev/** | | | |
| smtp_host | smtp.resend.com | — | NONE (correct) |
| smtp_port | 465 | — | NONE (correct) |
| smtp_admin_email | no-reply@ubuntutown.co.za | — | NONE (but domain not in Resend) |
| smtp_sender_name | Ubuntu Town | — | NONE |
| mailer_autoconfirm | true | — | NONE |
| mailer_otp_exp | 3600 (1hr) | — | NONE |
| mailer_otp_length | 8 | — | NONE |
| password_min_length | 6 | 8 | CHANGE REQUIRED |
| sessions_timebox | 0 | 604800 (7 days) | RECOMMENDED |
| sessions_inactivity_timeout | 0 | 1800 (30 min) | RECOMMENDED |
| password_hibp_enabled | false | true | RECOMMENDED |
| security_captcha_enabled | false | — | NONE (optional) |
| rate_limit_email_sent | 30 | — | NONE (adequate) |
| rate_limit_verify | 30 | — | NONE (adequate) |
| external_google | true | — | NONE |
| external_github | false | — | NONE |
| external_twitter | false | — | NONE |
| external_apple | false | — | NONE |

### Magic Link Template — CONFIRMED DEFECT

Current template (mailer_templates_magic_link_content):
  <h2>our Ubuntu Town code is: </h2>
  <p><a href="{{ .Token }}">Sign in</a></p>

DEFECT: {{ .Token }} is the 8-digit OTP code, NOT a URL.
The href attribute points to e.g. "12345678" which is not a valid URL.

CODE ANALYSIS:
- signInWithMagicLinkAction sends emailRedirectTo to /auth/callback (PKCE flow)
- The PKCE callback exchanges the code for a session
- The OTP code ({{ .Token }}) should be displayed as text for manual entry
- The magic link should use {{ .ConfirmationURL }} for same-device click
- For cross-device, the link should use:
  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}&next=/workspace

CORRECTED TEMPLATE (PROPOSED):
  <h2>Your Ubuntu Town code is: {{ .Token }}</h2>
  <p><a href="{{ .ConfirmationURL }}">Sign in</a></p>
  <p>Or enter the code manually: {{ .Token }}</p>

OR (for cross-device compatibility — RECOMMENDED):
  <h2>Your Ubuntu Town code is: {{ .Token }}</h2>
  <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}&next=/workspace">Sign in</a></p>
  <p>Or enter the code manually: {{ .Token }}</p>

RISK: Low — the template change is in Supabase dashboard, not in code
ROLLBACK: Revert template in Supabase dashboard
STATUS: PROPOSED — not applied. Requires human approval.

### Recovery Template — REVIEW RECOMMENDED

Current template (mailer_templates_recovery_content):
  <h2>Reset your password</h2>
  <p><a href="{{ .ConfirmationURL }}">Reset password</a></p>

The code's resetPasswordAction sets redirectTo to /auth/confirm?next=/update-password.
But {{ .ConfirmationURL }} routes through the PKCE flow (/auth/callback).
For cross-device, the template should use:
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/update-password">Reset password</a>

RISK: Medium — affects cross-device password reset (common for mobile users)
STATUS: REVIEW RECOMMENDED — not applied. Requires human approval.

## 8. RESEND DOMAIN READINESS

CURRENT_VERIFIED_DOMAINS: kekelebaka.com (verified, us-east-1, sending enabled)
CURRENT_AUTH_SENDER: no-reply@ubuntutown.co.za (via Supabase SMTP config)
RECOMMENDED_SENDER_DOMAIN: ubuntutown.co.za (or auth.ubuntutown.co.za)
DNS_CHANGES_REQUIRED: YES — ubuntutown.co.za needs to be added to Resend and verified via DNS
SPF_STATUS: Cannot inspect (token lacks DNS:Read)
DKIM_STATUS: Cannot inspect (token lacks DNS:Read)
DMARC_STATUS: Cannot inspect (token lacks DNS:Read)

FINDING:
Supabase sends emails from no-reply@ubuntutown.co.za but only kekelebaka.com is verified in Resend.
This means:
1. Emails may fail delivery (Resend rejects unverified sender domains)
2. Or emails are being sent from kekelebaka.com with a spoofed reply-to
3. Email deliverability may be compromised

SAFE_TO_CONFIGURE: NO — requires DNS changes and human approval

## 9. RUNTIME AUTH TEST PLAN

Prepared for execution AFTER template/config fixes are approved.

### Test Identity
Use one designated test email (e.g. mission6-test@ubuntutown.co.za)
Do NOT use real coordinator accounts.

### Journeys

A. Email/password login
  request → authenticate → session → /workspace

B. Password reset
  request → email delivered → click → callback → update password → authenticate → /workspace

C. Magic link
  request → email → click link → callback → session → /workspace
  (Requires template fix first)

D. OTP/code
  request → code delivered → enter code → verify → session → /workspace
  (Requires template fix first — current template has no {{ .Token }} displayed)

E. Invalid/expired link
  expired token → /auth/confirm → safe failure → /auth/auth-code-error → no session

F. Logout
  session → logout → session invalidated → /workspace blocked → redirect to /login

G. Role/town resolution
  authenticated coordinator → profile → role → town → correct workspace context

### Status
DO NOT EXECUTE until magic link template is fixed.
Current template defect will cause journey C and D to fail.

## 10. BRANCH PROTECTION PLAN

CURRENT: main is NOT protected (protected=false)

RECOMMENDED PROTECTION:
  - Require pull request before merge
  - Require status checks to pass (Deploy Web workflow)
  - Require branches to be up to date before merge
  - Do not allow force push
  - Do not allow deletion
  - Allow admin bypass (for emergency fixes)
  - Required review count: 1 (appropriate for small team)

STATUS: PROPOSED — not applied. Requires human approval.

## 11. SESSION POLICY DECISION

CURRENT: sessions_timebox = 0, sessions_inactivity_timeout = 0 (no expiry)

ASSESSMENT:
Ubuntu Town coordinators access the workspace from mobile devices.
No session timeout means sessions persist indefinitely.
Risk: stolen device = permanent access until manual logout.

RECOMMENDATION: CHANGE
  sessions_timebox: 604800 (7 days) — balances security with mobile usability
  sessions_inactivity_timeout: 1800 (30 min) — auto-logout after 30 min idle

CLASSIFICATION: POST_RELEASE_GOVERNANCE — not a release blocker, but should be set before production launch

## 12. HIBP / PASSWORD POLICY

CURRENT_POLICY:
  - Supabase password_min_length: 6
  - Application signUpSchema: min(8)
  - Application updatePasswordSchema: min(4)
  - HIBP check: disabled

INCONSISTENCY: Three different minimums (6, 8, 4)

TARGET_POLICY:
  - Supabase password_min_length: 8 (align with signUpSchema)
  - updatePasswordSchema: min(8) (align with signUpSchema)
  - HIBP: enabled (check passwords against Have I Been Pwned)

CHANGE_REQUIRED:
  1. Update Supabase password_min_length to 8 (dashboard)
  2. Update updatePasswordSchema min(4) to min(8) (code)
  3. Enable HIBP in Supabase (dashboard)

RELEASE_IMPACT: LOW — current users with 6-7 char passwords would need to reset on next login if password_min_length is enforced retroactively. Check Supabase behavior.

## 13. WWW / ENTER DOMAIN MODEL

VERIFIED:
  - www.ubuntutown.co.za → 104.21.60.235 (Cloudflare edge)
  - enter.ubuntutown.co.za → 104.21.60.235 (same Cloudflare edge)
  - Both return HTTP 200 with Cloudflare server headers
  - Both serve the same Next.js application (confirmed by matching headers, x-nextjs-prerender on enter)

ROUTING:
  - www.ubuntutown.co.za is NOT listed as a custom domain on any Cloudflare Pages project
  - enter.ubuntutown.co.za IS listed on the ubuntu-town-web Pages project
  - www likely routed via Cloudflare DNS CNAME or proxy to the same Pages project
  - DNS records cannot be inspected (token lacks DNS:Read permission)

CLASSIFICATION: PARTIAL — both serve the same app but www routing mechanism is not fully proven

TARGET ARCHITECTURE:
  - www.ubuntutown.co.za = public experience
  - enter.ubuntutown.co.za = authenticated operating environment
  - No routing changes in this gate

## 14. ROLLBACK

GIT: Yes — revert to any commit on main (git revert)
CLOUDFLARE PAGES: Yes — wrangler-action supports rollback to previous deployment
SUPABASE: Auth config changes are reversible via dashboard/API
DATABASE: Migrations are forward-only; rollback requires manual SQL
NEXT.CONFIG: Yes — revert the ignoreBuildErrors removal commit

ROLLBACK_READY: YES

## 15. HUMAN APPROVALS REQUIRED

1. Merge mission-6/auth-release-certification to main
2. Apply CI quality gates to deploy-web.yml
3. Enable branch protection on main
4. Fix magic link template in Supabase dashboard
5. Fix recovery template in Supabase dashboard (cross-device compatibility)
6. Update Supabase password_min_length from 6 to 8
7. Update updatePasswordSchema min(4) to min(8) in code
8. Enable HIBP password check in Supabase
9. Add ubuntutown.co.za to Resend verified domains (requires DNS changes)
10. Set session timeouts (sessions_timebox, sessions_inactivity_timeout)
11. Reconcile CI/CD deployment target (ubuntu-town-web-git → ubuntu-town-web)
12. Attach www.ubuntutown.co.za to the production Pages project
13. Production deployment

---

## FINAL VERDICT

MISSION 6.1 — PRODUCTION READINESS CLOSURE

CODE: PASS
TYPECHECK: PASS
TESTS: 49/49 PASS
BUILD: PASS
SECURITY: PARTIAL (open redirect fixed, magic link template defect remains)
CI_GATE: CHANGE_REQUIRED (no lint/typecheck/test gates)
BRANCH_PROTECTION: CHANGE_REQUIRED (not enabled)
PRODUCTION_PROJECT: PARTIAL (production project identified, CI/CD targets different project)
PRODUCTION_SHA: UNKNOWN (Cloudflare deployment metadata does not expose commit SHA)
SUPABASE_CONFIG: CHANGE_REQUIRED (password_min_length, magic link template, session timeouts)
MAGIC_LINK_TEMPLATE: FAIL ({{ .Token }} used as href — confirmed defect)
PASSWORD_POLICY: CHANGE_REQUIRED (inconsistent minimums: 6, 8, 4)
RESEND_DOMAIN: CHANGE_REQUIRED (ubuntutown.co.za not verified in Resend)
RUNTIME_AUTH: UNTESTED (requires template fix first)
WWW_ROUTING: PARTIAL (same app served, routing mechanism not fully proven)
ROLLBACK: READY
TECHNICALLY_READY: YES
CONFIG_READY: NO
RUNTIME_READY: NO
SAFE_TO_MERGE: NO
SAFE_TO_CONFIGURE_PRODUCTION: NO
SAFE_TO_DEPLOY: NO
HUMAN_APPROVALS_REQUIRED: YES (see section 15)

NEXT_EXACT_ACTION:
Fix the magic link template in Supabase dashboard, then execute the runtime auth test plan (Gate 8) with a designated test identity. This requires human approval to modify production Supabase configuration.
