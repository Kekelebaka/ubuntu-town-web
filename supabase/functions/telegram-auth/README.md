# telegram-auth — unified Telegram → Supabase session

One verifier that logs a person in from **either** Telegram surface and returns a
**real Supabase session**, so the Field OS Mini App and the Supabase workspace
share one identity (`uto.users`).

- **Field OS Mini App** → silent login on open (uses `initData`).
- **"Continue with Telegram"** button on the workspace/desktop → Login Widget.

Bonus: because it mints the session via `generateLink → verifyOtp`, **no email is
sent** — Telegram login works even while the email/SMTP flows are still being fixed.

---

## 1. Prerequisites
- Apply the migration `supabase/migrations/20260728000000_uto_users_telegram_id.sql`
  (adds `uto.users.telegram_id`). The function still logs users in without it, but
  the identity link is skipped until it's applied.
- Have the bot token for **@UIE_Kopano_bot** (BotFather → API token).

## 2. Set the secret
```bash
supabase secrets set TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
# optional overrides:
supabase secrets set TELEGRAM_AUTH_MAX_AGE_SECONDS="3600"
supabase secrets set TELEGRAM_EMAIL_DOMAIN="telegram.ubuntutown.co.za"
```
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically — do **not** set them yourself.

## 3. Deploy
```bash
supabase functions deploy telegram-auth --no-verify-jwt
```
`--no-verify-jwt` makes it a public endpoint; the Telegram HMAC **is** the auth.
Endpoint: `https://<project-ref>.functions.supabase.co/telegram-auth`
(project ref: `afiokbhuxfdacbsipoqk`).

## 4. Wire the clients

### Field OS Mini App (silent)
Replace the `/api/field/miniapp/auth` call in `src/lib/mini-app-api.ts` with:
```ts
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const initData = window.Telegram?.WebApp?.initData ?? '';
const r = await fetch('https://afiokbhuxfdacbsipoqk.functions.supabase.co/telegram-auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ initData }),
});
const s = await r.json();
if (s.ok) await supabase.auth.setSession({ access_token: s.access_token, refresh_token: s.refresh_token });
// s.actor_id (telegram_<id>) is still returned for the Phase-1 D1 Worker bridge.
```

### Workspace "Continue with Telegram" (desktop)
Add the Telegram Login Widget pointed at @UIE_Kopano_bot, then in its callback:
```ts
const r = await fetch('.../telegram-auth', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ widget: telegramUser }), // { id, first_name, username, auth_date, hash, ... }
});
const s = await r.json();
if (s.ok) await supabase.auth.setSession({ access_token: s.access_token, refresh_token: s.refresh_token });
```

## 5. Test
```bash
# invalid signature must be rejected
curl -sX POST .../telegram-auth -H 'Content-Type: application/json' \
  -d '{"initData":"user=%7B%22id%22%3A1%7D&auth_date=0&hash=deadbeef"}'
# → {"ok":false,"error":"invalid_signature"}  (or "expired")
```
Real `initData` from opening the Mini App in Telegram should return
`{ ok: true, access_token, refresh_token, uto_user_id, telegram_id }`.
Confirm in Dashboard → Auth → Users that a `tg_<id>@telegram.ubuntutown.co.za`
user exists and `uto.users.telegram_id` is set.

## Security notes
- initData/widget are verified **server-side only**. Do not trust a client-supplied
  `actor_id` for writes — retire the Field OS `?actor_id=` / manual-entry soft-gate
  once callers carry the Supabase JWT.
- `auth_date` older than `TELEGRAM_AUTH_MAX_AGE_SECONDS` (default 1h) is rejected.
- `TELEGRAM_BOT_TOKEN` and the service-role key live only as function secrets.
- Consider a rate limit (e.g. Cloudflare in front, or a per-IP KV counter) since the
  endpoint is public.

## Not deployed by merging
Merging this PR only adds the source. The function goes live only when you run
`supabase functions deploy telegram-auth`. Production is untouched until then.
