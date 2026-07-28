# Ubuntu Town — Auth Runbook (Workspace login: magic link + password reset)

**Status before this PR:** only **8 of 49** users had ever signed in, despite **16**
password-recovery emails sent. Root causes found on 2026-07-28:

1. **No production SMTP.** Auth email is sent by Supabase's built-in service
   (`noreply@mail.app.supabase.io`), which is rate-limited (a few per hour) and
   deliverability is poor. Most coordinator emails never arrive.
2. **Cross-device link failure.** Magic-link and reset emails pointed at
   `/auth/callback` (PKCE `exchangeCodeForSession`). PKCE needs the code-verifier
   cookie on the *same* browser that requested the link. On mobile the link opens
   in a different (in-app) browser, so login fails silently.
3. **Broken fallbacks.** `/auth/callback` defaulted to `/dashboard` (404) and
   `/auth/confirm` hard-coded `type: 'magiclink'` (so recovery/signup tokens failed).

This PR fixes 2 and 3 in code and adds a **typed 6-digit code** path. Items that
are **dashboard/config only** (no code can set them) are below — the login flows
will not work until these are applied.

---

## 1. Configure production SMTP  ← highest impact
Supabase Dashboard → **Authentication → Emails → SMTP Settings** → enable custom SMTP.
Recommended: **Resend**, **Postmark**, or **Amazon SES** (all have free tiers).
- Sender: `no-reply@ubuntutown.co.za` (add the domain to the provider and set its
  SPF/DKIM — Cloudflare DNS for `ubuntutown.co.za` already runs Email Routing + DKIM).
- Raise **Auth → Rate Limits → Email** once real SMTP is in place.

## 2. Set Site URL + Redirect allow-list
Dashboard → **Authentication → URL Configuration**:
- **Site URL:** `https://enter.ubuntutown.co.za`
- **Redirect URLs (allow-list):**
  - `https://enter.ubuntutown.co.za/**`
  - `https://ubuntutown.co.za/**`
  - `https://www.ubuntutown.co.za/**`
  - `https://ubuntu-town-web.pages.dev/**` (and any preview host you sign in on)

## 3. Set NEXT_PUBLIC_SITE_URL in the Pages build
Cloudflare → Pages → **ubuntu-town-web** → Settings → Environment variables (Production):
- `NEXT_PUBLIC_SITE_URL = https://enter.ubuntutown.co.za`
Then redeploy. Without this, `toSiteURL()` falls back to `http://localhost:3000/`
and every email link is dead.

## 4. Update email templates to the cross-device pattern
Dashboard → **Authentication → Emails → Templates**. For **Magic Link**, **Confirm
signup**, and **Reset Password**, use the `/auth/confirm` token_hash link **and**
expose the numeric code:

```html
<p>Enter this code in Ubuntu Town: <strong>{{ .Token }}</strong></p>
<p>or tap:
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}&next=/workspace">
    Sign in to Ubuntu Town
  </a>
</p>
```

- `{{ .Token }}` powers the typed-code path (`verifyEmailOtpAction`) — the most
  reliable option for phone-first users.
- The `/auth/confirm?token_hash=...` link works cross-device.

## 5. (Recommended) Enable leaked-password protection
Dashboard → **Authentication → Providers → Email** → enable "Leaked password
protection" (checks HaveIBeenPwned). Flagged by the security advisor.

---

## What this PR changed (code)
- `src/app/(auth-pages)/auth/confirm/route.ts` — reads `type` dynamically
  (magiclink / recovery / signup / email / email_change), validates `next`,
  defaults to `/workspace`.
- `src/app/(auth-pages)/auth/callback/route.ts` — on exchange failure redirects to
  the error page; default destination `/workspace` (was `/dashboard`, a 404).
- `src/data/auth/auth.ts` — magic link now `shouldCreateUser: false`; password
  min length 8; **new `verifyEmailOtpAction`** for typed codes; reset link routed
  through `/auth/confirm`.

## Remaining code step (small)
Wire a "enter the 6-digit code" input into the Magic Link tab
(`src/app/(auth-pages)/login/Login.tsx`) that calls `verifyEmailOtpAction`
after the code is sent. The action is already exported and ready.

## How to verify after applying config
1. Magic Link tab → enter your email → you receive BOTH a code and a link.
2. Type the code (or open the link on any device) → land on `/workspace` signed in.
3. Forgot password → email → `/update-password` → set new password → signed in.
4. Confirm in Dashboard → Auth → Users that `last_sign_in_at` updates.
