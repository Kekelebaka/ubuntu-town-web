import { redirect } from 'next/navigation';
import { createSupabaseClient } from '@/supabase-clients/server';
import { decideAdminAccess } from '@/lib/admin-gate';
import AdminFellowshipClient from './AdminFellowshipClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * /admin/fellowship — fellowship application review.
 *
 * Server-side admin gate (fail closed), identical to /admin:
 *   1. must be signed in (supabase.auth.getUser)
 *   2. must be HQ: uto.is_hq() == app.is_national() — an admin or ops role
 *      assignment with town_id IS NULL (supabase/migrations/0005_hq_dashboard.sql)
 * Previously this surface relied on a client-side signed-in check only; the
 * review data (builder_applications) was reachable by any signed-in user who
 * knew the URL. Authority stays in the database; this gate is the route-level
 * refusal in front of it.
 */
export default async function AdminFellowshipPage() {
  const supabase = await createSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: isHq, error } = await (supabase as any).rpc('is_hq');
  const decision = decideAdminAccess({
    user,
    isHq,
    rpcErrored: Boolean(error),
    pathname: '/admin/fellowship',
  });
  if (!decision.allowed) redirect(decision.redirectTo);

  return <AdminFellowshipClient />;
}
