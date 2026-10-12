// src/app/operate/admin/layout.tsx — TOP ADMINISTRATION gate.
// Authority is the database: signed-in + uto.is_hq() (admin/ops with national scope), fail
// closed, re-checked on every write. Navigation visibility NEVER implies authority —
// the ADMIN world is visible to all with an explicit gate state, not hidden theatre.

import Link from 'next/link';
import { createSupabaseClient } from '@/supabase-clients/server';
import { decideAdminAccess } from '@/lib/admin-gate';
import { OSFooter } from '@/components/e003/shell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: isHq, error } = await (supabase as any).rpc('is_hq');
  const decision = decideAdminAccess({ user, isHq, rpcErrored: Boolean(error), pathname: '/operate/admin' });

  if (!decision.allowed) {
    const signedIn = Boolean(user);
    return (
      <div>
        <div className="mb-6">
          <Link href="/operate" className="text-xs font-semibold text-[#5B2A86] hover:underline">← back to the operating system</Link>
        </div>
        <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-10 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">Top administration</p>
          <h1 className="mt-2 text-3xl font-black">{signedIn ? 'AUTHORISATION REQUIRED' : 'SIGNED-IN SESSION REQUIRED'}</h1>
          <p className="mt-3 max-w-2xl text-sm text-[#E9DDF5]">
            {signedIn
              ? 'You are signed in, but this session is not HQ. Top administration requires an admin or ops role assignment with national scope (town_id NULL) — the database decides, and it said no. Nothing on this surface pretends otherwise.'
              : 'Administration is a real operating surface for authorised humans — adding coordinators, initiative heads and staff, and maintaining town records. Sign in with an authorised account to continue.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {!signedIn && <Link href="/login" className="rounded-full bg-[#D9822B] px-5 py-2.5 text-sm font-semibold text-white">Sign in</Link>}
            <Link href="/operate/people" className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold">View the ownership map</Link>
          </div>
        </section>
        <div className="mt-6 rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">What this surface does when authorised</p>
          <ul className="mt-2 space-y-1 text-xs text-[#5A4E6D]">
            <li>▸ ADD PEOPLE — grant Coordinator / Deputy / Initiative Head / Staff / HQ Admin roles to existing accounts, with explicit scope.</li>
            <li>▸ INTAKE — record a person who does not have an account yet (they sign up themselves — this system never manufactures authentication).</li>
            <li>▸ TOWN RECORDS — maintain canonical town status, recruitment and opportunity notes; legacy narrative fields stay separate and provenance-labelled.</li>
            <li>▸ Every write shows exactly what will be written before a human confirms, and the database (RLS) has the final word.</li>
          </ul>
        </div>
        <div className="mt-8"><OSFooter /></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/operate" className="text-xs font-semibold text-[#5B2A86] hover:underline">← back to the operating system</Link>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A5410]">Top administration · HQ session (is_hq verified)</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-xs">
          <Link href="/operate/admin" className="rounded-full border border-[#EADFD2] bg-white px-4 py-2 font-semibold text-[#241A33] hover:border-[#D9B27C]">Overview</Link>
          <Link href="/operate/admin/people" className="rounded-full border border-[#EADFD2] bg-white px-4 py-2 font-semibold text-[#241A33] hover:border-[#D9B27C]">People &amp; roles</Link>
          <Link href="/operate/admin/towns" className="rounded-full border border-[#EADFD2] bg-white px-4 py-2 font-semibold text-[#241A33] hover:border-[#D9B27C]">Town records</Link>
        </nav>
      </div>
      {children}
      <div className="mt-8"><OSFooter /></div>
    </div>
  );
}
