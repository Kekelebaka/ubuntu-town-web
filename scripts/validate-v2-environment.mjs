import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
import { pathToFileURL } from 'node:url';

// Errors identify configuration names only. Never log environment values.
export function validateV2Environment(env) {
  if (env.LIVING_TOWN_ENABLED !== 'true') return [];
  const errors = [];
  const production = /afiokbhuxfdacbsipoqk|(?:^|[./])ubuntutown\.co\.za(?:[/:]|$)|ubuntu-town-web(?:-git)?\.pages\.dev/i;
  for (const [name, value] of Object.entries(env)) {
    if (!value) continue;
    if (name.startsWith('NEXT_PUBLIC_')) {
      let privileged = String(value).startsWith('sb_secret_');
      if (String(value).split('.').length === 3) {
        try { privileged ||= JSON.parse(Buffer.from(String(value).split('.')[1], 'base64url').toString()).role === 'service_role'; } catch { /* not a JWT */ }
      }
      if (privileged) errors.push(`${name}: secret key cannot be browser-exposed`);
    }
    if (/(URL|ORIGIN|HOST|REF|TARGET|ENDPOINT|DOMAIN)$/.test(name) && production.test(value)) errors.push(`${name}: production target forbidden`);
    if (/(SERVICE_ROLE|SECRET_KEY|REVALIDATE_SECRET|REVALIDATE_TOKEN|REVALIDATION_SECRET|OPENAI_API_KEY|CLOUDFLARE_API_TOKEN|RESEND_API_KEY|STRIPE_SECRET|PAYMENT_SECRET|WEBHOOK_SECRET)/.test(name)) errors.push(`${name}: privileged or outbound credential forbidden`);
  }
  if (env.LIVING_TOWN_OUTBOUND !== 'disabled') errors.push('LIVING_TOWN_OUTBOUND: must be disabled');
  if (env.LIVING_TOWN_MODE === 'fixture') {
    if (env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== 'placeholder-key') errors.push('Fixture mode: only inert placeholder database configuration is permitted');
  } else if (env.LIVING_TOWN_MODE === 'staging') {
    const ref = env.LIVING_TOWN_STAGING_SUPABASE_REF;
    const origin = env.LIVING_TOWN_STAGING_ORIGIN;
    if (!ref || !/^[a-z]{20}$/.test(ref) || ref === 'afiokbhuxfdacbsipoqk') errors.push('LIVING_TOWN_STAGING_SUPABASE_REF: explicit non-production ref required');
    if (env.NEXT_PUBLIC_SUPABASE_URL !== `https://${ref}.supabase.co`) errors.push('NEXT_PUBLIC_SUPABASE_URL: must exactly match approved staging ref');
    try {
      const url = new URL(origin);
      if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password || production.test(url.hostname)) throw new Error();
    } catch { errors.push('LIVING_TOWN_STAGING_ORIGIN: explicit HTTPS staging origin required'); }
    if (env.NEXT_PUBLIC_SITE_URL !== origin) errors.push('NEXT_PUBLIC_SITE_URL: must exactly match approved staging origin');
    if (!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === 'placeholder-key') errors.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: staging publishable key required');
  } else errors.push('LIVING_TOWN_MODE: fixture or staging required');
  for (const key of Object.keys(env)) {
    if (/(PUBLISH|REVALIDAT|WEBHOOK|PAYMENT|MESSAGING).*?(URL|TARGET|ENDPOINT)$/.test(key) && env[key]) errors.push(`${key}: outbound endpoint must be absent`);
  }
  return [...new Set(errors)];
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
  const errors = validateV2Environment(process.env);
  if (errors.length) { console.error('V2 environment rejected:\n' + errors.join('\n')); process.exitCode = 1; }
  else console.log('Environment guard passed; this does not attest infrastructure isolation.');
}
