# Ubuntu Town Auth Runbook

Canonical email and callback behaviour for Mega Build 7.

## Routes

- `/auth/callback` — PKCE `code` exchange. Same-device OAuth / same-device email.
- `/auth/confirm` — `token_hash` + `type` via `verifyOtp`. Magic-link and signup-confirmation cross-device links.
- `/auth/recover` — password-recovery handoff. This route does **not** consume the token on GET; the user must tap `Continue to set a new password`, then the server verifies `token_hash` and redirects to `/update-password`.
- OTP / typed code — `verifyEmailOtpAction` uses `{{ .Token }}` as a numeric code, never as a URL.

## Email templates

`{{ .Token }}` is an OTP/code. It must never be used as an `href`.

Magic link / OTP:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}&next=/workspace
```

and display `{{ .Token }}` as readable text.

Password recovery:

```
{{ .SiteURL }}/auth/recover?token_hash={{ .TokenHash }}&type=recovery&next=/update-password
```

Rationale: `/auth/recover` prevents email security scanners from consuming the recovery token before the human opens the message on Android or desktop.

## Password policy

Minimum length is 8 everywhere:

- signup schema
- update-password schema
- HTML `minLength`
- Supabase `password_min_length`
