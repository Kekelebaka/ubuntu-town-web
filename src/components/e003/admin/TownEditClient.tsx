'use client';
// src/components/e003/admin/TownEditClient.tsx — TOWN RECORD editor (top administration).
// Changed fields only. Governance-locked fields are visibly locked and refused client AND
// server side. Preview → CONFIRM (the human approval) → write; the database decides.

import { useState } from 'react';

interface FieldMeta {
  name: string; label: string; type: 'text' | 'textarea' | 'number' | 'select';
  options: string[]; locked: boolean; note: string; table: string;
}

interface Props {
  slug: string;
  name: string;
  initial: Record<string, string>;
  fields: FieldMeta[];
}

type Phase = 'form' | 'confirm' | 'result';

export default function TownEditClient({ slug, name, initial, fields }: Props) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [phase, setPhase] = useState<Phase>('form');
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ ok: boolean; lines: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const changes: Record<string, string> = {};
  for (const f of fields) {
    if (f.locked) continue;
    if ((values[f.name] ?? '') !== (initial[f.name] ?? '')) changes[f.name] = values[f.name];
  }
  const changedCount = Object.keys(changes).length;

  function validate(): string[] {
    const errs: string[] = [];
    if ('applicant_count' in changes && changes.applicant_count !== '' && !/^\d+$/.test(changes.applicant_count)) {
      errs.push('Applicant count must be a whole number.');
    }
    return errs;
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch('/operate/api/admin/towns', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, changes }),
      });
      const data = await res.json();
      const lines: string[] = [];
      for (const r of data.results ?? []) lines.push(`${r.table}: ${r.status} — ${r.note}`);
      if (data.errors) lines.push(...data.errors);
      setResult({ ok: Boolean(data.ok), lines });
      setPhase('result');
    } catch (e) {
      setResult({ ok: false, lines: [String(e)] });
      setPhase('result');
    } finally {
      setBusy(false);
    }
  }

  if (phase === 'result' && result) {
    return (
      <div className={`rounded-2xl border p-6 shadow-sm ${result.ok ? 'border-[#9DC9B4] bg-[#F2F8F4]' : 'border-[#E8B4B0] bg-[#FDF1F0]'}`}>
        <p className={`text-sm font-bold ${result.ok ? 'text-[#2F7D5C]' : 'text-[#A63B33]'}`}>
          {result.ok ? 'UPDATED — the database accepted the change' : 'NO WRITE OCCURRED — reported honestly'}
        </p>
        <ul className="mt-3 space-y-1">
          {result.lines.map((l) => <li key={l} className="text-xs text-[#5A4E6D]">▸ {l}</li>)}
        </ul>
        <button onClick={() => setPhase('form')} className="mt-4 rounded-full bg-[#5B2A86] px-5 py-2.5 text-sm font-semibold text-white">
          Continue editing
        </button>
      </div>
    );
  }

  if (phase === 'confirm') {
    return (
      <div className="rounded-2xl border border-[#D9B27C] bg-[#FDF3E3] p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A5410]">Confirm — this will write exactly this</p>
        <ul className="mt-3 space-y-1.5">
          {Object.entries(changes).map(([k, v]) => (
            <li key={k} className="text-xs text-[#5A4E6D]">uto.towns.{k} ← &quot;{v}&quot; <span className="text-[#8B7FA3]">(town: {name})</span></li>
          ))}
          <li className="text-xs text-[#5A4E6D]">Authority: your HQ session + the database update policy (RLS). The database has the final word.</li>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.name} className={`block ${f.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
              <span className="text-[#8B7FA3]">{f.label}</span>
              <span className={`rounded px-1.5 py-0.5 text-[8px] ${f.locked ? 'bg-[#FDF1F0] text-[#A63B33]' : 'bg-[#F7F1FB] text-[#5B2A86]'}`}>
                {f.table}{f.locked ? ' · LOCKED' : ''}
              </span>
            </span>
            {f.locked ? (
              <>
                <input value={values[f.name] ?? ''} readOnly disabled
                  className="mt-1 w-full cursor-not-allowed rounded-xl border border-[#EADFD2] bg-[#FAF5EE] px-3 py-2.5 text-sm text-[#8B7FA3]" />
                <p className="mt-1 text-[10px] text-[#A63B33]">{f.note}</p>
              </>
            ) : f.type === 'textarea' ? (
              <>
                <textarea value={values[f.name] ?? ''} rows={3}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[#EADFD2] px-3 py-2.5 text-sm text-[#241A33] focus:border-[#5B2A86] focus:outline-none" />
                {f.note && <p className="mt-1 text-[10px] text-[#8B7FA3]">{f.note}</p>}
              </>
            ) : f.type === 'select' ? (
              <>
                <select value={values[f.name] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[#EADFD2] bg-white px-3 py-2.5 text-sm text-[#241A33] focus:border-[#5B2A86] focus:outline-none">
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                {f.note && <p className="mt-1 text-[10px] text-[#8B7FA3]">{f.note}</p>}
              </>
            ) : (
              <>
                <input value={values[f.name] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[#EADFD2] px-3 py-2.5 text-sm text-[#241A33] focus:border-[#5B2A86] focus:outline-none" />
                {f.note && <p className="mt-1 text-[10px] text-[#8B7FA3]">{f.note}</p>}
              </>
            )}
          </label>
        ))}
      </div>

      {errors.length > 0 && (
        <ul className="mt-4 rounded-xl border border-[#E8B4B0] bg-[#FDF1F0] p-3">
          {errors.map((e) => <li key={e} className="text-xs text-[#A63B33]">▸ {e}</li>)}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={() => { const errs = validate(); if (errs.length) { setErrors(errs); return; } if (!changedCount) { setErrors(['Nothing has changed — the system will not write an empty update.']); return; } setErrors([]); setPhase('confirm'); }}
          className="rounded-full bg-[#5B2A86] px-6 py-2.5 text-sm font-semibold text-white">
          Review {changedCount} change{changedCount === 1 ? '' : 's'} →
        </button>
        <p className="text-[10px] text-[#8B7FA3]">Only changed fields are written. Locked fields cannot be edited here — by design.</p>
      </div>
    </div>
  );
}
