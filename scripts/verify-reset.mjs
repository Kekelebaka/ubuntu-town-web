#!/usr/bin/env node
// scripts/verify-reset.mjs
//
// Verifies coordinator password reset works CROSS-DEVICE after go-live.
// It proves the /auth/confirm token_hash path redeems a recovery token with NO
// prior cookies — i.e. the reset link opened on a DIFFERENT device/browser than
// the one that requested it (the exact case that was silently failing on mobile).
//
// Run this AFTER: PR #5 is merged/deployed + Site URL & redirect allow-list are set.
//
//   SUPABASE_URL="https://afiokbhuxfdacbsipoqk.supabase.co" \
//   SUPABASE_SERVICE_ROLE_KEY="..." \
//   SUPABASE_ANON_KEY="..." \
//   SITE_URL="https://enter.ubuntutown.co.za" \
//   TEST_EMAIL="a-real-test-account@example.com" \
//   node scripts/verify-reset.mjs [--send]
//
// --send ALSO triggers a real recovery email (to confirm Resend delivery end-to-end).

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY,
  SITE_URL = 'https://enter.ubuntutown.co.za',
  TEST_EMAIL,
} = process.env;
const SEND = process.argv.includes('--send');

function need(k, v) {
  if (!v) {
    console.error(`✗ missing env ${k}`);
    process.exit(2);
  }
}
need('SUPABASE_URL', SUPABASE_URL);
need('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY);
need('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
need('TEST_EMAIL', TEST_EMAIL);

let pass = true;
const ok = (m) => console.log(`✓ ${m}`);
const bad = (m) => {
  pass = false;
  console.error(`✗ ${m}`);
};

// Step A — mint a recovery token via the Admin API (no inbox needed).
async function mintRecovery() {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'recovery',
      email: TEST_EMAIL,
      redirect_to: `${SITE_URL}/auth/confirm?next=/update-password`,
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    bad(`generate_link failed: ${r.status} ${JSON.stringify(j)} (is redirect_to in the allow-list? does the user exist?)`);
    return null;
  }
  const th = j.hashed_token || j.properties?.hashed_token;
  if (!th) {
    bad('no hashed_token in generate_link response');
    return null;
  }
  ok('minted recovery token via Admin API');
  return th;
}

// Step B — redeem via /auth/confirm with a FRESH client (no cookies) = cross-device.
async function crossDeviceConfirm(tokenHash) {
  const url = `${SITE_URL}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&next=/update-password`;
  const r = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'ubuntu-town-reset-test/1.0' } });
  const loc = r.headers.get('location') || '';
  const setCookie = r.headers.get('set-cookie') || '';
  if (r.status >= 300 && r.status < 400 && loc.includes('/update-password')) {
    ok(`cross-device confirm → ${r.status} → ${loc}`);
  } else if (loc.includes('/auth/auth-code-error')) {
    bad(`confirm rejected the token → ${loc}  (is PR #5 deployed? token already used/expired?)`);
  } else {
    bad(`unexpected confirm response: ${r.status} location=${loc || '(none)'}`);
  }
  if (/auth-token|sb-.*-auth/i.test(setCookie)) ok('recovery session cookie set (user can now set a new password)');
  else console.log('… note: no auth cookie seen server-side (may be set client-side) — also click through once in a real phone browser.');
}

// Step C — optional: trigger a real email to confirm Resend delivery.
async function sendReal() {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, options: { redirect_to: `${SITE_URL}/auth/confirm?next=/update-password` } }),
  });
  if (r.ok) ok(`recovery email requested for ${TEST_EMAIL} — check the inbox to confirm Resend delivery`);
  else bad(`recover endpoint failed: ${r.status} ${await r.text().catch(() => '')}`);
}

(async () => {
  console.log(`\nUbuntu Town — reset cross-device verification\n  site: ${SITE_URL}\n  user: ${TEST_EMAIL}\n`);
  if (SEND) await sendReal();
  const th = await mintRecovery();
  if (th) await crossDeviceConfirm(th);
  console.log(`\n${pass ? '✅ PASS — reset works cross-device' : '❌ FAIL — see ✗ lines above'}\n`);
  process.exit(pass ? 0 : 1);
})();
