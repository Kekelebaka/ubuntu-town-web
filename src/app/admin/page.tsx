import { redirect } from 'next/navigation';
import { createSupabaseClient } from '@/supabase-clients/server';
import AdminDashboard from './AdminDashboard';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createSupabaseClient();

  // Gate 1: must be signed in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/workspace');

  // Gate 2: must be HQ (admin/ops with null town_id)
  const { data: isHq, error } = await supabase.rpc('is_hq');
  if (error || !isHq) redirect('/workspace');

  return <AdminDashboard />;
}
