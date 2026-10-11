import { redirect } from 'next/navigation';
import { createSupabaseClient } from '@/supabase-clients/server';
import { decideAdminAccess } from '@/lib/admin-gate';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createSupabaseClient();

  // Server-side admin gate (fail closed) — shared, tested decision path:
  //   1. must be signed in (supabase.auth.getUser)
  //   2. must be HQ: uto.is_hq() == app.is_national() — an admin or ops role
  //      assignment with town_id IS NULL (supabase/migrations/0005_hq_dashboard.sql)
  // The capability registry only decides visibility; authority is the database.
  const { data: { user } } = await supabase.auth.getUser();
  const { data: isHq, error } = await (supabase as any).rpc('is_hq');
  const decision = decideAdminAccess({
    user,
    isHq,
    rpcErrored: Boolean(error),
    pathname: '/admin',
  });
  if (!decision.allowed) redirect(decision.redirectTo);

  return <AdminDashboard />;
}
