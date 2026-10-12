// src/app/operate/admin/people/page.tsx — PEOPLE & ROLES (top administration).
// Roster = what this HQ session can legitimately read (RLS-scoped). Add people through the
// wizard: grants for existing accounts, intake for people who have not joined yet.

import { createSupabaseClient } from '@/supabase-clients/server';
import { Section, Stamp } from '@/components/e003/os-ui';
import { ROLE_FAMILIES } from '@/lib/admin-rbac';
import { CANONICAL_TEN } from '@/lib/e003/registry';
import { getCanonicalTowns } from '@/lib/e003/os';
import PeopleAdminClient from '@/components/e003/admin/PeopleAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPeople() {
  const supabase = await createSupabaseClient();
  const towns = await getCanonicalTowns();
  const townOptions = towns.map((t) => ({ id: t.id, name: t.name, province: t.province, slug: t.slug }));
  const initOptions = CANONICAL_TEN.map((i) => ({ key: i.key, name: i.name }));
  const [users, coords, roles, apps] = await Promise.all([
    (supabase as any).schema('public').from('users').select('id, email, phone, primary_role, created_at'),
    (supabase as any).schema('public').from('coordinators').select('id, display_name, phone, status, town_id'),
    (supabase as any).schema('public').from('role_assignments').select('id, user_id, role_key, town_id, created_at'),
    (supabase as any).schema('public').from('applications').select('id, full_name, email, role_track, town_id, province, created_at'),
  ]);

  const userRows: any[] = users.data ?? [];
  const coordRows: any[] = coords.data ?? [];
  const roleRows: any[] = roles.data ?? [];
  const appRows: any[] = apps.data ?? [];
  const coordById = new Map(coordRows.map((c) => [c.id, c]));

  const roster = userRows.map((u) => ({
    id: u.id,
    email: u.email ?? '(no email)',
    name: coordById.get(u.id)?.display_name ?? u.email ?? 'Unnamed',
    primaryRole: u.primary_role,
    roles: roleRows.filter((r) => r.user_id === u.id).map((r) => ({ roleKey: r.role_key, townId: r.town_id })),
    coordinator: coordById.has(u.id),
  }));

  return (
    <div>
      {/* THE WIZARD */}
      <Section title="Add someone to Ubuntu Town" right={<Stamp kind="real" />}>
        <PeopleAdminClient towns={townOptions} initiatives={initOptions} rosterCount={roster.length} />
      </Section>

      {/* ROLE FAMILIES */}
      <Section title="Role families — what they write" right={<Stamp kind="authored" />}>
        <div className="overflow-hidden rounded-2xl border border-[#EADFD2] bg-white shadow-sm">
          <ul className="divide-y divide-[#F1E8DC]">
            {ROLE_FAMILIES.map((f) => (
              <li key={f.key} className="px-5 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[#241A33]">{f.label} <span className="text-[10px] font-normal text-[#8B7FA3]">· scope: {f.scope}</span></p>
                  <span className="rounded-full bg-[#F7F1FB] px-2.5 py-1 text-[9px] font-bold text-[#5B2A86]">{f.roleKey}</span>
                </div>
                <p className="mt-1 text-xs text-[#5A4E6D]">{f.description}</p>
                <p className="mt-1 text-[10px] text-[#8B7FA3]">{f.bridgeNote}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ROSTER */}
      <Section title="Roster — accounts this session can see" right={<Stamp kind="real" />}>
        {roster.length === 0 ? (
          <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF9F1] p-5">
            <p className="text-xs leading-relaxed text-[#5A4E6D]">
              ZERO accounts are visible to this session — and zero is what this read returned.
              If accounts exist beyond this view, RLS is filtering them; the system does not
              claim the organisation is empty. Use the wizard above to add the first people.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#EADFD2] bg-white shadow-sm">
            <ul className="divide-y divide-[#F1E8DC]">
              {roster.map((p) => (
                <li key={p.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#241A33]">{p.name} <span className="text-[11px] font-normal text-[#8B7FA3]">{p.email}</span></p>
                      <p className="mt-0.5 text-[11px] text-[#5A4E6D]">
                        {p.roles.length
                          ? p.roles.map((r) => `${r.roleKey}${r.townId ? ' (town-scoped)' : ' (national)'}`).join(' · ')
                          : `primary_role: ${p.primaryRole} — no scope assignments`}
                        {p.coordinator ? ' · coordinator record active' : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#FAF5EE] px-2.5 py-1 text-[10px] font-semibold text-[#8A5410]">{p.primaryRole}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* INTAKE QUEUE */}
      <Section title="Intake queue — recorded, awaiting account" right={<Stamp kind="real" />}>
        {appRows.length === 0 ? (
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <p className="text-xs text-[#5A4E6D]">No intake records visible to this session (ZERO returned by this read). People you record through the wizard appear here until they create their accounts.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#EADFD2] bg-white shadow-sm">
            <ul className="divide-y divide-[#F1E8DC]">
              {appRows.map((a) => (
                <li key={a.id} className="px-5 py-3">
                  <p className="text-sm font-semibold text-[#241A33]">{a.full_name} <span className="text-[11px] font-normal text-[#8B7FA3]">{a.email}</span></p>
                  <p className="mt-0.5 text-[11px] text-[#5A4E6D]">intake for: {a.role_track ?? 'unspecified'} · {a.province ?? 'province not recorded'} — awaiting their account (sign-up), then grant the role.</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>
    </div>
  );
}
