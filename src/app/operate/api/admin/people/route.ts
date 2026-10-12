// src/app/operate/api/admin/people/route.ts — ADMIN: people onboarding writes.
// Authority chain: signed-in session → uto.is_hq() (server-side re-check, fail closed) →
// PostgREST write under that session → RLS (admin_all / is_admin()) decides at the database.
// NO service role. NO auth-admin API. NO weakened authorization. People create their own
// accounts (sign-up); this route grants roles to existing accounts and records intakes.

import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/supabase-clients/server';
import { familyByKey, validateGrant, type GrantIntent } from '@/lib/admin-rbac';

export const dynamic = 'force-dynamic';

async function gate() {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: isHq, error } = await (supabase as any).rpc('is_hq');
  return { supabase, user, allowed: Boolean(user) && isHq === true && !error };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { supabase, user, allowed } = await gate();
    if (!allowed) {
      return NextResponse.json({
        ok: false,
        code: 'AUTHORISATION REQUIRED',
        errors: ['This write requires a signed-in HQ session (an admin or ops role assignment with national scope). The database decides — nothing was written.'],
      }, { status: 403 });
    }

    const family = familyByKey(body.familyKey);
    const check = validateGrant({
      email: body.email ?? '',
      familyKey: body.familyKey ?? '',
      townId: body.townId ?? null,
      initiativeKey: body.initiativeKey ?? null,
      personName: body.personName ?? '',
    });
    if (!check.ok || !family) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', errors: check.ok ? ['Unknown role family.'] : check.errors }, { status: 400 });
    }

    if (body.action === 'intake') {
      // INTAKE — the person has no account yet. Record them in the real intake table
      // (applications); the person then signs up and an admin grants the role.
      const { data, error } = await (supabase as any).schema('public').from('applications').insert({
        full_name: body.personName,
        email: body.email ?? null,
        phone: body.phone ?? null,
        town_id: body.townId ?? null,
        role_track: family.label,
        province: body.province ?? null,
      }).select('id').single();
      if (error) {
        return NextResponse.json({
          ok: false, code: 'WRITE REFUSED',
          errors: [`The database refused the intake write (RLS): ${error.message}. Nothing was written.`],
        }, { status: 403 });
      }
      return NextResponse.json({
        ok: true,
        result: 'INTAKE RECORDED',
        applicationId: data.id,
        next: 'This person must now create their account (sign-up). Once their account exists, grant their role from the roster. No account is created for them — account creation is theirs.',
      });
    }

    // GRANT — the person already has an account.
    const { data: users, error: findErr } = await (supabase as any).schema('public')
      .from('users').select('id, email').eq('email', body.email).limit(1);
    if (findErr) {
      return NextResponse.json({ ok: false, code: 'LOOKUP REFUSED', errors: [findErr.message] }, { status: 403 });
    }
    const target = users?.[0];
    if (!target) {
      return NextResponse.json({
        ok: false, code: 'NO ACCOUNT',
        errors: [`No account exists for ${body.email}. Record an INTAKE instead — the person creates their own account first. This system never manufactures authentication.`],
      }, { status: 404 });
    }

    const writes: string[] = [];
    // 1. role_assignments ← INSERT (admin_all decides)
    const { error: raErr } = await (supabase as any).schema('public').from('role_assignments').insert({
      user_id: target.id,
      role_key: family.roleKey,
      town_id: family.scope === 'town' ? body.townId : null,
      granted_by: user!.id,
    });
    if (raErr) {
      return NextResponse.json({
        ok: false, code: 'WRITE REFUSED',
        errors: [`The database refused the role grant (RLS): ${raErr.message}. Nothing was written.`],
      }, { status: 403 });
    }
    writes.push(`role_assignments ← role_key "${family.roleKey}" (town_id: ${family.scope === 'town' ? body.townId : 'NULL'})`);

    // 2. coordinators record for town-execution roles
    if (family.roleKey === 'coordinator' || family.roleKey === 'deputy') {
      const { error: coErr } = await (supabase as any).schema('public').from('coordinators').upsert({
        id: target.id,
        display_name: body.personName,
        phone: body.phone ?? null,
        status: 'active',
        town_id: body.townId,
      }, { onConflict: 'id' });
      if (coErr) {
        return NextResponse.json({ ok: true, partial: true, writes, warnings: [`coordinators upsert refused (RLS): ${coErr.message}. The role grant succeeded; the coordinator record was not written.`] });
      }
      writes.push('coordinators ← active coordinator record');
    }

    // 3. initiative scope via profiles.facts (documented D-02 bridge)
    if (family.scope === 'initiative' && body.initiativeKey) {
      const { data: prof } = await (supabase as any).schema('public').from('profiles').select('facts').eq('id', target.id).maybeSingle();
      const facts = { ...((prof?.facts as Record<string, unknown>) ?? {}), initiative_scope: body.initiativeKey };
      const { error: pfErr } = await (supabase as any).schema('public').from('profiles').upsert({ id: target.id, facts }, { onConflict: 'id' });
      if (pfErr) {
        return NextResponse.json({ ok: true, partial: true, writes, warnings: [`profiles.facts merge refused (RLS): ${pfErr.message}. Role granted; initiative scope not recorded.`] });
      }
      writes.push(`profiles.facts.initiative_scope ← "${body.initiativeKey}" (D-02 bridge)`);
    }

    // 4. primary role marker
    const { error: upErr } = await (supabase as any).schema('public').from('users').update({ primary_role: family.roleKey }).eq('id', target.id);
    if (!upErr) writes.push(`users.primary_role ← "${family.roleKey}"`);

    return NextResponse.json({ ok: true, result: 'ROLE GRANTED', writes, userId: target.id });
  } catch (e) {
    return NextResponse.json({ ok: false, code: 'ERROR', errors: [String(e)] }, { status: 500 });
  }
}
