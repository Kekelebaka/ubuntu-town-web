'use client';
// src/components/e002/E002CoS.tsx — embedded Chief of Staff (Experience 002).
// Five modes over real data with epistemic classes. No "I noticed…" without a trigger.
// ACT is proposal-only and, here, explicitly gated on authorised operational access.

import { useState } from 'react';
import type { E002Statement } from '@/lib/e002/real';
import { StatementRow, TruthTag } from './ui';

const MODES = ['OBSERVE', 'EXPLAIN', 'CHALLENGE', 'COACH', 'ACT'] as const;
const QUESTIONS: Record<string, string> = {
  OBSERVE: 'What is happening?',
  EXPLAIN: 'Why does it matter?',
  CHALLENGE: 'What can we not conclude?',
  COACH: 'What should we do next?',
  ACT: 'What action could be taken?',
};

export default function E002CoS({
  context, observe, explain,
}: { context: string; observe: E002Statement[]; explain: E002Statement[] }) {
  const [mode, setMode] = useState<string>('OBSERVE');
  return (
    <section className="mt-10 rounded-2xl border border-[#D9C7EA] bg-gradient-to-br from-[#F7F1FB] to-white p-6 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-[#5B2A86]">WHAT SHOULD WE PAY ATTENTION TO?</h2>
        <p className="text-xs italic text-[#8B7FA3]">Chief of Staff · {context}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Chief of Staff modes">
        {MODES.map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${mode === m
              ? 'border-[#5B2A86] bg-[#5B2A86] text-white'
              : 'border-[#D9C7EA] bg-white text-[#5B2A86] hover:bg-[#F3EBFA]'}`}>
            {m}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs italic text-[#8B7FA3]">{QUESTIONS[mode]}</p>

      <div className="mt-4 space-y-3">
        {mode === 'OBSERVE' && observe.map((s, i) => <StatementRow key={i} s={s} />)}
        {mode === 'EXPLAIN' && explain.map((s, i) => <StatementRow key={i} s={s} />)}
        {mode === 'CHALLENGE' && (
          <StatementRow s={{
            kind: 'insufficient_evidence',
            text: 'Operational activity cannot currently be evaluated because protected mission, work and proof records are unavailable to this experience.',
            evidence: [],
            limitation: 'Challenge discipline: activity counts would flatter the picture. Without protected records we cannot distinguish movement from noise.',
          }} />
        )}
        {mode === 'COACH' && (
          <StatementRow s={{
            kind: 'insufficient_access',
            text: 'A meaningful coaching recommendation requires authorised operational evidence.',
            evidence: [],
            limitation: 'Coaching people on incomplete pictures would be guesswork. This system will not pretend otherwise.',
          }} />
        )}
        {mode === 'ACT' && (
          <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF3E3] p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed text-[#241A33]">
                PROPOSAL — AUTHORISED OPERATIONAL ACCESS REQUIRED. No consequential action can be
                responsibly proposed from geography alone.
              </p>
              <TruthTag kind="insufficient_access" />
            </div>
            <p className="mt-3 rounded-full border border-[#E7C9A0] bg-white px-3 py-1.5 text-[11px] font-bold text-[#8A5410]">
              PROPOSED — PENDING HUMAN APPROVAL · nothing executes without a human · this experience
              offers no executable actions
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
