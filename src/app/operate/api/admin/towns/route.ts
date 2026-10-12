// src/app/operate/api/admin/towns/route.ts — ADMIN: town record updates.
// Authority: signed-in HQ session (re-checked server-side, fail closed) → PATCH under that
// session → RLS decides at the database. Canonical uto.towns fields and legacy public.towns
// fields are written SEPARATELY with per-table results — never merged, never double-booked.
// Governance-locked fields (is_founding, public_self_approve) are refused here regardless of RLS.

import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/supabase-clients/server';
import { validateTownEdit, describeTownEdit, TOWN_EDIT_FIELDS } from '@/lib/admin-rbac';

export const dynamic = 'force-dynamic';

const CANONICAL_FIELDS = new Set(['status', 'recruitment_status', 'applicant_count', 'opportunity_notes']);
const LEGACY_FIELDS = new Set(['archetype', 'population_estimate']);

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: isHq, error } = await (supabase as any).rpc('is_hq');
    if (!user || isHq !== true || error) {
      return NextResponse.json({
        ok: false, code: 'AUTHORISATION REQUIRED',
        errors: ['This write requires a signed-in HQ session. The database decides — nothing was written.'],
      }, { status: 403 });
    }

    const { slug, changes = {}, legacyChanges = {} } = body ?? {};
    if (!slug) return NextResponse.json({ ok: false, code: 'VALIDATION', errors: ['A town slug is required.'] }, { status: 400 });

    const check = validateTownEdit(changes);
    if (!check.ok) return NextResponse.json({ ok: false, code: 'VALIDATION', errors: check.errors }, { status: 400 });

    const canonical: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(changes as Record<string, string>)) {
      if (!CANONICAL_FIELDS.has(k)) continue;
      canonical[k] = k === 'applicant_count' ? (v === '' ? null : Number(v)) : v;
    }
    const legacy: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(legacyChanges as Record<string, string>)) {
      if (!LEGACY_FIELDS.has(k)) continue;
      legacy[k] = k === 'population_estimate' ? (v === '' ? null : Number(v)) : v;
    }

    const results: { table: string; status: string; note: string }[] = [];
    let anyWrite = false;

    if (Object.keys(canonical).length) {
      const { data, error: uErr } = await (supabase as any).schema('uto').from('towns')
        .update(canonical).eq('slug', slug).select('id');
      if (uErr) {
        results.push({ table: 'uto.towns', status: 'WRITE REFUSED', note: `RLS refused the update: ${uErr.message}` });
      } else if (!data || data.length === 0) {
        results.push({ table: 'uto.towns', status: 'NO ROW UPDATED', note: 'No canonical row matched, or the update policy permitted zero rows (RLS). Nothing changed.' });
      } else {
        anyWrite = true;
        results.push({ table: 'uto.towns', status: 'UPDATED', note: `${data.length} canonical row(s) updated: ${Object.keys(canonical).join(', ')}` });
      }
    }

    if (Object.keys(legacy).length) {
      const { data, error: lErr } = await (supabase as any).schema('public').from('towns')
        .update(legacy).eq('slug', slug).select('id');
      if (lErr) {
        results.push({ table: 'public.towns', status: 'WRITE REFUSED', note: `RLS refused the update: ${lErr.message}` });
      } else if (!data || data.length === 0) {
        results.push({ table: 'public.towns', status: 'NO ROW UPDATED', note: 'No legacy narrative row matches this slug (7 legacy rows only). This is expected for most towns.' });
      } else {
        anyWrite = true;
        results.push({ table: 'public.towns', status: 'UPDATED', note: `${data.length} legacy row(s) updated: ${Object.keys(legacy).join(', ')}` });
      }
    }

    return NextResponse.json({
      ok: anyWrite,
      result: anyWrite ? 'TOWN UPDATED' : 'NO WRITE OCCURRED',
      intent: describeTownEdit(String(slug), { ...changes, ...legacyChanges } as Record<string, string>),
      results,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, code: 'ERROR', errors: [String(e)] }, { status: 500 });
  }
}
