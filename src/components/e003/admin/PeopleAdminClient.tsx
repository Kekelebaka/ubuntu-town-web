'use client';
// src/components/e003/admin/PeopleAdminClient.tsx — ADD PERSON wizard (top administration).
// Two honest paths: GRANT (person has an account) / INTAKE (person has not joined yet).
// The write intent is previewed verbatim before a human confirms; the confirm click IS the
// human approval. The database (RLS) has the final word and its refusal is shown as-is.

import { useState } from 'react';
import { ROLE_FAMILIES, familyByKey } from '@/lib/admin-rbac';

interface TownOption { id: string; name: string; province: string | null; slug: string }
interface InitOption { key: string; name: string }

interface Props {
  towns: TownOption[];
  initiatives: InitOption[];
  rosterCount: number;
}

type Phase = 'form' | 'confirm' | 'result';

export default function PeopleAdminClient({ towns, initiatives, rosterCount }: Props) {
  const [phase, setPhase] = useState<Phase>('form');
  const [action, setAction] = useState<'grant' | 'intake'>('grant');
  const [personName, setPersonName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [familyKey, setFamilyKey] = useState('coordinator');
  const [townId, setTownId] = useState('');
  const [initiativeKey, setInitiativeKey] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ ok: boolean; lines: string[]; next?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const family = familyByKey(familyKey)!;
  const town = towns.find((t) => t.id === townId);

  function validate(): string[] {
    const errs: string[] = [];
    if (!personName.trim() || personName.trim().length < 2) errs.push('The person\'s full name is required.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.push('A valid email is required.');
    if (family.scope === 'town' && !townId) errs.push(`${family.label} requires a town — scope is never assumed.`);
    if (family.scope === 'initiative' && !initiativeKey) errs.push('Initiative Head requires an initiative — scope is never assumed.');
    return errs;
  }

  function preview(): string[] {
    const lines = [
      action === 'grant'
        ? `GRANT ROLE → account ${email} (${personName})`
        : `INTAKE → ${personName} <${email}> (no account yet)`,
    ];
    if (action === 'grant') {
      lines.push(`1. role_assignments ← INSERT { role_key: "${family.roleKey}", town_id: ${family.scope === 'town' ? `"${town?.name}"` : 'NULL'}, granted_by: you }`);
      if (family.roleKey === 'coordinator' || family.roleKey === 'deputy') {
        lines.push(`2. coordinators ← UPSERT { display_name: "${personName}", town_id: "${town?.name}", status: "active" }`);
        lines.push('3. users.primary_role ← the granted role_key');
      } else if (family.scope === 'initiative') {
        lines.push(`2. profiles.facts ← MERGE { initiative_scope: "${initiativeKey}" } (D-02 bridge — schema has no initiative column)`);
        lines.push('3. users.primary_role ← "ops"');
      } else {
        lines.push('2. users.primary_role ← the granted role_key');
      }
    } else {
      lines.push(`1. applications ← INSERT { full_name: "${personName}", email: "${email}", role_track: "${family.label}"${town ? `, town_id: "${town.name}"` : ''} }`);
      lines.push('2. The person signs up themselves — this system never creates accounts for anyone.');
      lines.push('3. Once their account exists, grant their role from this roster.');
    }
    lines.push('Authority: your HQ session + RLS (admin_all). The database decides. No service role.');
    return lines;
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch('/operate/api/admin/people', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action,
          email,
          personName,
          phone: phone || null,
          familyKey,
          townId: family.scope === 'town' ? townId : null,
          initiativeKey: family.scope === 'initiative' ? initiativeKey : null,
          province: town?.province ?? null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({ ok: true, lines: data.writes ?? [`Intake recorded (id ${data.applicationId})`], next: data.next });
      } else {
        setResult({ ok: false, lines: data.errors ?? ['The write was refused.'], next: data.code });
      }
      setPhase('result');
    } catch (e) {
      setResult({ ok: false, lines: [String(e)], next: 'NETWORK ERROR — nothing confirmed' });
      setPhase('result');
    } finally {
      setBusy(false);
    }
  }

  if (phase === 'result' && result) {
    return (
      <div className={`rounded-2xl border p-6 shadow-sm ${result.ok ? 'border-[#9DC9B4] bg-[#F2F8F4]' : 'border-[#E8B4B0] bg-[#FDF1F0]'}`}>
        <p className={`text-sm font-bold ${result.ok ? 'text-[#2F7D5C]' : 'text-[#A63B33]'}`}>{result.ok ? 'WRITTEN — the database accepted the change' : 'NOT WRITTEN — reported honestly'}</p>
        <ul className="mt-3 space-y-1">
          {result.lines.map((l) => <li key={l} className="text-xs text-[#5A4E6D]">▸ {l}</li>)}
        </ul>
        {result.next && <p className="mt-3 text-xs font-semibold text-[#241A33]">{result.next}</p>}
        <button onClick={() => { setPhase('form'); setResult(null); }} className="mt-4 rounded-full bg-[#5B2A86] px-5 py-2.5 text-sm font-semibold text-white">
          Add another person
        </button>
      </div>
    );
  }

  if (phase === 'confirm') {
    return (
      <div className="rounded-2xl border border-[#D9B27C] bg-[#FDF3E3] p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A5410]">Confirm — this will write exactly this</p>
        <ul className="mt-3 space-y-1.5">
          {preview().map((l) => <li key={l} className="text-xs text-[#5A4E6D]">{l}</li>)}
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={submit} disabled={busy} className="rounded-full bg-[#2F7D5C] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? 'Writing…' : 'CONFIRM — I approve this change'}
          </button>
          <button onClick={() => setPhase('form')} className="rounded-full border border-[#D9B27C] px-6 py-2.5 text-sm font-semibold text-[#8A5410]">
            Go back — change nothing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#EADFD2] bg-white p-6 shadow-sm">
      {/* path toggle */}
      <div className="flex flex-wrap gap-2">
        {([['grant', 'Person already has an account — GRANT ROLE'], ['intake', 'Person is new — RECORD INTAKE']] as const).map(([k, label]) => (
          <button key={k} onClick={() => { setAction(k); setErrors([]); }}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${action === k ? 'bg-[#5B2A86] text-white' : 'border border-[#EADFD2] text-[#5A4E6D]'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Full name</span>
          <input value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="e.g. Lerato Mokoena"
            className="mt-1 w-full rounded-xl border border-[#EADFD2] px-3 py-2.5 text-sm text-[#241A33] focus:border-[#5B2A86] focus:outline-none" />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
            className="mt-1 w-full rounded-xl border border-[#EADFD2] px-3 py-2.5 text-sm text-[#241A33] focus:border-[#5B2A86] focus:outline-none" />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Phone (optional)</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27…"
            className="mt-1 w-full rounded-xl border border-[#EADFD2] px-3 py-2.5 text-sm text-[#241A33] focus:border-[#5B2A86] focus:outline-none" />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Role family</span>
          <select value={familyKey} onChange={(e) => { setFamilyKey(e.target.value); setTownId(''); setInitiativeKey(''); }}
            className="mt-1 w-full rounded-xl border border-[#EADFD2] bg-white px-3 py-2.5 text-sm text-[#241A33] focus:border-[#5B2A86] focus:outline-none">
            {ROLE_FAMILIES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </label>

        {family.scope === 'town' && (
          <label className="block sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Town scope (required)</span>
            <select value={townId} onChange={(e) => setTownId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#EADFD2] bg-white px-3 py-2.5 text-sm text-[#241A33] focus:border-[#5B2A86] focus:outline-none">
              <option value="">— select the town they will operate —</option>
              {towns.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.province}</option>)}
            </select>
          </label>
        )}
        {family.scope === 'initiative' && (
          <label className="block sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Initiative scope (required)</span>
            <select value={initiativeKey} onChange={(e) => setInitiativeKey(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#EADFD2] bg-white px-3 py-2.5 text-sm text-[#241A33] focus:border-[#5B2A86] focus:outline-none">
              <option value="">— select the canonical initiative they will own —</option>
              {initiatives.map((i) => <option key={i.key} value={i.key}>{i.name}</option>)}
            </select>
            <p className="mt-1 text-[10px] text-[#8B7FA3]">{family.bridgeNote}</p>
          </label>
        )}
      </div>

      {errors.length > 0 && (
        <ul className="mt-4 rounded-xl border border-[#E8B4B0] bg-[#FDF1F0] p-3">
          {errors.map((e) => <li key={e} className="text-xs text-[#A63B33]">▸ {e}</li>)}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={() => { const errs = validate(); if (errs.length) { setErrors(errs); return; } setErrors([]); setPhase('confirm'); }}
          className="rounded-full bg-[#5B2A86] px-6 py-2.5 text-sm font-semibold text-white">
          Review &amp; confirm →
        </button>
        <p className="text-[10px] text-[#8B7FA3]">
          {action === 'grant'
            ? 'Granting requires the person to already have an account (they sign up themselves). Nothing is created for them.'
            : 'Intake records the person in the real intake queue. They create their own account; you grant the role after.'}
        </p>
      </div>
    </div>
  );
}
