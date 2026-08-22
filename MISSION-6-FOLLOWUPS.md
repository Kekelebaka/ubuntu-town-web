# MISSION 6/6.1 — FOLLOWUPS

Items discovered during Mission 6 and 6.1 that require future work.

## RESOLVED (Mission 6.1)

### ~~ignoreBuildErrors: true~~ — RESOLVED
- Removed from next.config.ts in commit ba17f86
- Build passes with full type checking enabled
- No longer a followup item

## PRIORITY: HIGH

### 1. Resend Domain — ubuntutown.co.za not registered
- Supabase sends emails from no-reply@ubuntutown.co.za
- Resend only has kekelebaka.com verified
- ubuntutown.co.za needs to be added and verified in Resend
- This may cause email delivery failures or spam classification
- Requires DNS changes (SPF, DKIM records for Resend)

### 2. Magic Link Email Template — {{ .Token }} used as href — CONFIRMED DEFECT
- Current template: `<a href="{{ .Token }}">Sign in</a>`
- {{ .Token }} is the 8-digit OTP code, not a URL
- The link points to e.g. "12345678" which is not a valid URL
- The code should be displayed as text, not linked: `<p>Your code: {{ .Token }}</p>`
- The link should use {{ .ConfirmationURL }} for same-device
- For cross-device: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}&next=/workspace
- STATUS: PROPOSED fix in MISSION-6.1-RELEASE-CANDIDATE.md — not applied

### 3. Password Reset Email Template — uses {{ .ConfirmationURL }} not token_hash
- The recovery template uses {{ .ConfirmationURL }} which routes through PKCE
- The code sets redirectTo to /auth/confirm?token_hash=... but the template may override
- Should use: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/update-password
- This affects cross-device password reset (mobile users)

### 4. Password Min Length Inconsistency
- Supabase config: password_min_length = 6
- updatePasswordSchema: min(4)
- signUpSchema: min(8)
- Target: unify all at 8 + enable HIBP
- Should be unified (recommend 8)

### ~~5. next.config.ts — ignoreBuildErrors: true~~ — RESOLVED
- Removed in commit ba17f86 (Mission 6.1)
- Build passes with full type checking enabled

## PRIORITY: MEDIUM

### 6. Cloudflare Token Permissions
- Current token has Zone:Read but not Pages:Read or DNS:Read
- Cannot verify Cloudflare Pages deployment provenance
- Cannot read DNS records to verify custom domain routing
- Consider creating a token with Pages:Read for observability

### 7. Branch Protection on main
- Cannot verify if branch protection exists (token lacks permission)
- Should have: require CI pass, require PR review, no direct push to main

### 8. CI/CD — No typecheck or test gate
- deploy-web.yml runs `npm run build:edge` (which uses ignoreBuildErrors)
- Does NOT run `npm run typecheck` or `npm test`
- CI can go GREEN even with type errors and test failures
- Should add: lint → typecheck → test → build gates

### 9. Protected Route Coverage in Middleware
- Middleware protects: /dashboard, /private-item, /private-items, /items, /item
- Does NOT protect: /workspace (uses separate enforcement via layout)
- path-to-regexp match('/private-item') does NOT match /private-item/123 (nested routes)
- Need to use wildcards: match('/private-item/*') or match('/private-item/:id')

### 10. sessions_timebox and sessions_inactivity_timeout both 0
- No session expiry by default
- Consider setting a reasonable timeout (e.g. 7 days timebox, 30 min inactivity)

## PRIORITY: LOW

### 11. HIBP Password Check Disabled
- password_hibp_enabled = false
- Consider enabling to check passwords against Have I Been Pwned database

### 12. Unused Lint Warnings
- 30+ unused import/variable warnings across the codebase
- Not blocking but should be cleaned up

### 13. next-safe-action Logging in Development
- safe-action.ts logs all inputs in development mode
- Could leak sensitive data in dev environments
- Consider removing or using a safer log level

### 14. GitHub Token Permissions
- Fine-grained PAT cannot read branch protection
- Consider adding "Administration: Read" permission for observability

### 15. getClaims vs getUser in user.ts
- src/data/user/user.ts uses `supabase.auth.getClaims()` (deprecated in auth-js v2)
- src/rsc-data/supabase.ts uses `supabase.auth.getUser()` (current API)
- The getClaims call in user.ts may break in future Supabase versions

## Recovery template follow-up update (2026-08-22T18:30:55Z)

The password recovery template recommendation has changed from direct `/auth/confirm` to `/auth/recover` handoff. The handoff avoids email security scanners consuming recovery tokens before a human opens the email. Current target:

`{{ .SiteURL }}/auth/recover?token_hash={{ .TokenHash }}&type=recovery&next=/update-password`
