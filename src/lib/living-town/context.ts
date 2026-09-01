import 'server-only';
import { createSupabaseClient } from '@/supabase-clients/server';
import { notFound, redirect } from 'next/navigation';
import { canUseStaging } from './contracts';
import { fixture } from './fixture';
import { loadToday } from './queries';
export async function todayContext(town?: string, scenario?: string) {
  const mode = process.env.LIVING_TOWN_MODE;
  if (!canUseStaging({ enabled: process.env.LIVING_TOWN_ENABLED, mode, url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, stagingRef: process.env.LIVING_TOWN_STAGING_SUPABASE_REF, stagingOrigin: process.env.LIVING_TOWN_STAGING_ORIGIN, siteUrl: process.env.NEXT_PUBLIC_SITE_URL, outbound: process.env.LIVING_TOWN_OUTBOUND })) notFound();
  if (mode === 'fixture') return { data: fixture(scenario), fixture: true };
  const client = await createSupabaseClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect('/login?next=/living-town');
  // Metadata is display-only; never used to determine permissions.
  const name = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : 'Builder';
  return { data: await loadToday(client, user.id, name, town), fixture: false };
}
