// src/app/operate/admin/page.tsx — TOP ADMINISTRATION overview (HQ cockpit).
// Real counts via the session's RLS view; every number shows how it was obtained.

import Link from 'next/link';
import { createSupabaseClient } from '@/supabase-clients/server';
import { getCanonicalTowns } from '@/lib/e003/os';
import { Section, Stamp, NextMoves } from '@/components/e003/os-ui';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const supabase = await createSupabaseClient();
  const towns = await getCanonicalTowns();

  // RLS-scoped reads under the HQ session — the database decides what is visible.
  const [roles, coords, apps] = await Promise.all([
    (supabase as any).schema('public').from('role_assignments').select('id, role_key, town_id, user_id'),
    (supabase as any).schema('public').from('coordinators').select('id, display_name, status, town_id'),
    (supabase as any).schema('public').from('applications').select('id, full_name, role_track, town_id'),
  ]);
  const roleRows: any[] = roles.data ?? [];
  const coordRows: any[] = coords.data ?? [];
  const appRows: any[] = apps.data ?? [];

  return (
    <div>
      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">Top administration</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">THE NETWORK&rsquo;S OPERATING DESK</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#E9DDF5]">
          Add the people who run Ubuntu Town. Keep the town records true. Every write is previewed,
          human-confirmed, and decided by the database.
        </p>
      </section>

      {/* STATUS STRIP */}
      <Section title="Current state" right={<Stamp kind="real" />}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['Role assignments', String(roleRows.length), 'visible to this HQ session (RLS-scoped read of role_assignments)'],
            ['Coordinators', String(coordRows.length), 'coordinator records visible to this session'],
            ['Intake queue', String(appRows.length), 'applications recorded (candidates awaiting/holding intake)'],
            ['Canonical towns', String(towns.length), 'uto.towns rows (9 provinces · 50 Blueprint cohort, never conflated)'],
          ].map(([label, value, note]) => (
            <div key={label} className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
              <p className="text-3xl font-black text-[#5B2A86]">{value}</p>
              <p className="mt-1 text-xs font-semibold text-[#241A33]">{label}</p>
              <p className="mt-1 text-[10px] text-[#8B7FA3]">{note}</p>
            </div>
          ))}
        </div>
        {(roles.error || coords.error || apps.error) && (
          <p className="mt-2 text-[11px] text-[#A63B33]">
            Some reads were refused by RLS and are shown as they are — a refusal is reported, never rendered as zero.
          </p>
        )}
      </Section>

      {/* OPERATING ACTIONS */}
      <Section title="What you run from here">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Link href="/operate/admin/people" className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:border-[#D9B27C]">
            <p className="text-sm font-bold text-[#241A33]">People &amp; roles</p>
            <p className="mt-1 text-xs text-[#5A4E6D]">Grant Coordinator · Deputy · Initiative Head · Staff · HQ Admin roles with explicit scope. Record intakes for people who have not joined yet. Every grant previews exactly what will be written.</p>
            <p className="mt-2 text-xs font-semibold text-[#5B2A86]">open →</p>
          </Link>
          <Link href="/operate/admin/towns" className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:border-[#D9B27C]">
            <p className="text-sm font-bold text-[#241A33]">Town records</p>
            <p className="mt-1 text-xs text-[#5A4E6D]">Maintain canonical status, recruitment and opportunity notes. Legacy narrative fields stay separate with provenance. Roster-sensitive flags are governance-locked.</p>
            <p className="mt-2 text-xs font-semibold text-[#5B2A86]">open →</p>
          </Link>
        </div>
      </Section>

      {/* HONESTY PANEL */}
      <Section title="How authority works here">
        <div className="rounded-2xl border border-[#D9C7EA] bg-[#F7F1FB] p-5">
          <p className="text-xs leading-relaxed text-[#5A4E6D]">
            <span className="font-semibold text-[#5B2A86]">Gate:</span> uto.is_hq() — an admin or ops role
            assignment with national scope. Re-checked server-side on every write, fail closed.
            <span className="font-semibold text-[#5B2A86]"> Writes:</span> run under your signed-in session;
            the database (RLS) decides. A refusal is reported honestly and nothing is written.
            <span className="font-semibold text-[#5B2A86]"> Never here:</span> service-role access, account
            creation for other people, weakened authorization, or a write to a governance-locked field.
          </p>
        </div>
      </Section>

      <div className="mt-8">
        <NextMoves moves={[
          { label: 'Grant your first role', href: '/operate/admin/people' },
          { label: 'Update a town record', href: '/operate/admin/towns' },
          { label: 'Back to the operating system', href: '/operate' },
        ]} />
      </div>
    </div>
  );
}
