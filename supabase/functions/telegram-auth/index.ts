// supabase/functions/telegram-auth/index.ts
//
// POST /auth/telegram — the single verifier that turns a Telegram identity into
// a REAL Supabase session, for BOTH Telegram surfaces:
//   • Field OS Mini App  → body: { "initData": "<window.Telegram.WebApp.initData>" }
//   • "Continue with Telegram" Login Widget (desktop/browser) → body: { "widget": { id, hash, auth_date, ... } }
//
// Flow:
//   1. Verify the Telegram signature server-side (HMAC-SHA256).
//        - Mini App:  secret = HMAC_SHA256(key="WebAppData", msg=BOT_TOKEN)
//        - Widget:    secret = SHA256(BOT_TOKEN)
//      then hash = HMAC_SHA256(key=secret, msg=data_check_string), compared constant-time.
//   2. Enforce auth_date freshness.
//   3. Ensure a Supabase auth user keyed by the Telegram id (idempotent).
//   4. Mint a real GoTrue session via admin.generateLink → verifyOtp
//      (no email is sent — so this works even while SMTP is misconfigured).
//   5. Best-effort link into the identity spine: uto.users.telegram_id.
//   6. Return { access_token, refresh_token, ... } for the client to setSession().
//
// Deploy:  supabase functions deploy telegram-auth --no-verify-jwt
// Secret:  supabase secrets set TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected automatically.
//
// This file is a scaffold for review. It is NOT deployed by merging — deployment
// is an explicit `supabase functions deploy`. See README.md.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MAX_AGE = Number(Deno.env.get('TELEGRAM_AUTH_MAX_AGE_SECONDS') ?? '3600');
const EMAIL_DOMAIN = Deno.env.get('TELEGRAM_EMAIL_DOMAIN') ?? 'telegram.ubuntutown.co.za';

const ALLOWED_ORIGINS = [
  'https://enter.ubuntutown.co.za',
  'https://ubuntutown.co.za',
  'https://www.ubuntutown.co.za',
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allow =
    origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.pages.dev'))
      ? origin
      : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

const enc = (s: string) => new TextEncoder().encode(s);

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(key: ArrayBuffer | Uint8Array, msg: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, enc(msg));
}

// Constant-time-ish comparison to avoid leaking the signature via timing.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

type TgUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

// Mini App initData (query string). Values are used DECODED in the check string.
async function verifyInitData(initData: string): Promise<{ user: TgUser; authDate: number } | null> {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  params.delete('signature'); // Telegram's 3rd-party Ed25519 field — excluded from the HMAC check string
  const dcs = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');
  const secret = await hmac(enc('WebAppData'), BOT_TOKEN);
  const calc = toHex(await hmac(secret, dcs));
  if (!timingSafeEqual(calc, hash)) return null;
  const userRaw = params.get('user');
  if (!userRaw) return null;
  return { user: JSON.parse(userRaw) as TgUser, authDate: Number(params.get('auth_date') ?? '0') };
}

// Telegram Login Widget payload (bot auth). secret = SHA256(bot_token).
async function verifyWidget(payload: Record<string, string>): Promise<{ user: TgUser; authDate: number } | null> {
  const { hash, ...rest } = payload;
  if (!hash) return null;
  const dcs = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('\n');
  const secret = await crypto.subtle.digest('SHA-256', enc(BOT_TOKEN));
  const calc = toHex(await hmac(secret, dcs));
  if (!timingSafeEqual(calc, hash)) return null;
  return {
    user: {
      id: Number(rest.id),
      username: rest.username,
      first_name: rest.first_name,
      last_name: rest.last_name,
      photo_url: rest.photo_url,
    },
    authDate: Number(rest.auth_date ?? '0'),
  };
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('Origin'));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!BOT_TOKEN) return json({ ok: false, error: 'server_not_configured' }, 500);

  let body: { initData?: string; widget?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }

  let verified: { user: TgUser; authDate: number } | null = null;
  try {
    if (body.initData) verified = await verifyInitData(body.initData);
    else if (body.widget) verified = await verifyWidget(body.widget);
  } catch {
    verified = null;
  }
  if (!verified) return json({ ok: false, error: 'invalid_signature' }, 401);

  const nowSec = Math.floor(Date.now() / 1000);
  if (!verified.authDate || nowSec - verified.authDate > MAX_AGE) {
    return json({ ok: false, error: 'expired', detail: 'auth_date too old' }, 401);
  }

  const tg = verified.user;
  if (!tg?.id) return json({ ok: false, error: 'no_user' }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const email = `tg_${tg.id}@${EMAIL_DOMAIN}`;
  const fullName =
    [tg.first_name, tg.last_name].filter(Boolean).join(' ').trim() || tg.username || `tg_${tg.id}`;

  // 3. Ensure the auth user exists (idempotent: createUser errors if the email
  //    already exists — we ignore that and continue).
  let isNew = false;
  const created = await admin.auth.admin
    .createUser({
      email,
      email_confirm: true,
      user_metadata: {
        telegram_id: tg.id,
        telegram_username: tg.username ?? null,
        full_name: fullName,
        avatar_url: tg.photo_url ?? null,
      },
      app_metadata: { provider: 'telegram', providers: ['telegram'], telegram_id: tg.id },
    })
    .catch((e: unknown) => ({ data: { user: null }, error: e }));
  if ((created as { data?: { user?: unknown } })?.data?.user) isNew = true;

  // 4. Mint a real session without sending email (generateLink → verifyOtp).
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (linkErr || !link?.properties?.hashed_token || !link.user) {
    return json({ ok: false, error: 'session_mint_failed', detail: linkErr?.message ?? 'no link' }, 500);
  }
  const userId = link.user.id;

  const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: verifyData, error: verifyErr } = await anon.auth.verifyOtp({
    type: 'magiclink',
    token_hash: link.properties.hashed_token,
  });
  if (verifyErr || !verifyData?.session) {
    return json({ ok: false, error: 'session_verify_failed', detail: verifyErr?.message ?? 'no session' }, 500);
  }

  // 5. Best-effort link into the uto identity spine. Non-fatal if the column /
  //    row isn't there yet (apply the migration first — see README).
  try {
    await admin
      .schema('uto')
      .from('users')
      .update({
        telegram_id: tg.id,
        telegram_username: tg.username ?? null,
        telegram_photo_url: tg.photo_url ?? null,
      })
      .eq('id', userId);
  } catch (_) {
    /* non-fatal */
  }

  const s = verifyData.session;
  return json({
    ok: true,
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_in: s.expires_in,
    expires_at: s.expires_at,
    token_type: 'bearer',
    uto_user_id: userId,
    telegram_id: tg.id,
    actor_id: `telegram_${tg.id}`, // bridge value for the Field OS Worker during Phase 1
    is_new_user: isNew,
  });
});
