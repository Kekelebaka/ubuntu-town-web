'use client';
// src/components/e003/CoS.tsx — CHIEF OF STAFF, the operating intelligence layer.
// Five modes: OBSERVE · EXPLAIN · CHALLENGE · COACH · ACT (the operating verbs over the
// RADAR → STRATEGIST → COACH → INCUBATOR → MEMORY intelligence stream).
// ACT = PROPOSAL ONLY — HUMAN APPROVAL REQUIRED. No autonomous consequential action.
// Epistemic honesty: no "I noticed…" without a machine-observable trigger (phrase banned).

import { useState } from 'react';
import type { OSStatement } from '@/lib/e003/os';
import { StatementRow, Stamp } from './os-ui';

const MODES = [
  { key: 'observe', label: 'OBSERVE', question: 'What is happening?' },
  { key: 'explain', label: 'EXPLAIN', question: 'What changed? Why does it matter?' },
  { key: 'challenge', label: 'CHALLENGE', question: 'What am I missing? What can we not conclude?' },
  { key: 'coach', label: 'COACH', question: 'What should I learn? What should I do?' },
  { key: 'act', label: 'ACT', question: 'What should I decide?' },
] as const;

export default function CoS({
  context, observe, explain, challenge, coach, proposal,
}: {
  context: string;
  observe: OSStatement[];
  explain: OSStatement[];
  challenge: OSStatement[];
  coach: OSStatement[];
  proposal?: { title: string; detail: string; evidence: string[] };
}) {
  const [mode, setMode] = useState<string>('observe');
  const q = MODES.find((m) => m.key === mode)!.question;
  return (
    <section className="rounded-3xl border border-[#D9C7EA] bg-gradient-to-br from-[#F7F1FB] to-white p-6 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-[#5B2A86]">CHIEF OF STAFF</h2>
        <p className="text-xs italic text-[#8B7FA3]">operating intelligence · {context}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Chief of Staff modes">
        {MODES.map((m) => (
          <button key={m.key} role="tab" aria-selected={mode === m.key} onClick={() => setMode(m.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${mode === m.key
              ? 'border-[#5B2A86] bg-[#5B2A86] text-white' : 'border-[#D9C7EA] bg-white text-[#5B2A86] hover:bg-[#F3EBFA]'}`}>
            {m.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs italic text-[#8B7FA3]">{q}</p>

      <div className="mt-4 space-y-3">
        {mode === 'observe' && observe.map((s, i) => <StatementRow key={i} s={s} />)}
        {mode === 'explain' && explain.map((s, i) => <StatementRow key={i} s={s} />)}
        {mode === 'challenge' && (challenge.length ? challenge.map((s, i) => <StatementRow key={i} s={s} />) : (
          <StatementRow s={{
            kind: 'insufficient_evidence',
            text: 'What am I missing? Operational activity cannot be evaluated because protected mission, work and proof records are unavailable to this experience.',
            evidence: [],
            limitation: 'Challenge discipline: activity counts would flatter the picture. Without protected records the system refuses to distinguish movement from noise.',
          }} />
        ))}
        {mode === 'coach' && (coach.length ? coach.map((s, i) => <StatementRow key={i} s={s} />) : (
          <StatementRow s={{
            kind: 'records_not_accessible',
            text: 'A meaningful coaching recommendation requires authorised operational evidence.',
            evidence: [],
            limitation: 'Coaching a person on an incomplete picture would be guesswork. This system will not pretend otherwise.',
          }} />
        ))}
        {mode === 'act' && (
          <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF3E3] p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed text-[#241A33]">
                {proposal ? proposal.detail : 'PROPOSAL — AUTHORISED OPERATIONAL ACCESS REQUIRED. No consequential action can be responsibly proposed from the accessible evidence alone.'}
              </p>
              <Stamp kind="insufficient_evidence" />
            </div>
            {proposal && proposal.evidence.length > 0 && (
              <p className="mt-2 text-xs text-[#5A4E6D]"><span className="font-semibold">Evidence:</span> {proposal.evidence.join(' · ')}</p>
            )}
            <p className="mt-3 rounded-full border border-[#E7C9A0] bg-white px-3 py-1.5 text-[11px] font-bold text-[#8A5410]">
              PROPOSED — PENDING HUMAN APPROVAL · nothing executes without a human · this experience offers no executable actions
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
