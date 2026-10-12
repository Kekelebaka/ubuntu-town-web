'use client';
// src/components/experience/ChiefOfStaff.tsx — contextual Chief of Staff (client: mode tabs).
// ⚠ SYNTHETIC DEMO. ACT actions are PROPOSALS ONLY — clicking simulates submission and
// visibly reports "PENDING HUMAN APPROVAL". No consequential action ever executes here.

import { useState } from 'react';
import type { PulseMode } from '@/lib/pulse/engine';
import { MODE_QUESTIONS } from '@/lib/experience/stories';
import { EvidenceChips } from './ui';

const MODES: PulseMode[] = ['OBSERVE', 'EXPLAIN', 'CHALLENGE', 'COACH', 'ACT'];

export default function ChiefOfStaff({
  context, lines, actRows,
}: {
  context: string;
  lines: Record<PulseMode, string[]>;
  actRows: { action: string; owner: string; rationale: string; evidence: string[]; reviewPoint: string; approvalStatus: string }[];
}) {
  const [mode, setMode] = useState<PulseMode>('OBSERVE');
  const [submitted, setSubmitted] = useState<string | null>(null);

  return (
    <section className="mt-10 rounded-2xl border border-[#D9C7EA] bg-gradient-to-br from-[#F7F1FB] to-white p-6 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-[#5B2A86]">CHIEF OF STAFF</h2>
        <p className="text-xs italic text-[#8B7FA3]">{context}</p>
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
      <p className="mt-2 text-xs italic text-[#8B7FA3]">{MODE_QUESTIONS[mode]}</p>

      <div className="mt-4 space-y-3">
        {mode !== 'ACT' && (lines[mode].length === 0 ? (
          <p className="rounded-xl border border-[#E8B4B0] bg-[#FDF1F0] p-4 text-sm text-[#A63B33]">
            INSUFFICIENT EVIDENCE for this mode in this context.
          </p>
        ) : lines[mode].map((line, i) => (
          <p key={i} className="rounded-xl border border-[#EADFD2] bg-white p-4 text-sm leading-relaxed text-[#241A33]">{line}</p>
        )))}

        {mode === 'ACT' && (
          <div className="overflow-x-auto rounded-xl border border-[#EADFD2] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F1FB] text-[#5B2A86]">
                <tr>
                  <th className="px-3 py-2">Action</th><th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Rationale</th><th className="px-3 py-2">Evidence</th>
                  <th className="px-3 py-2">Review point</th><th className="px-3 py-2">Approval</th><th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {actRows.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-4 text-[#A63B33]">INSUFFICIENT EVIDENCE — nothing is actionable without supporting rows.</td></tr>
                ) : actRows.map((r, i) => (
                  <tr key={i} className="border-t border-[#F0E8DC]">
                    <td className="px-3 py-2 font-medium text-[#241A33]">{r.action}</td>
                    <td className="px-3 py-2 text-[#5A4E6D]">{r.owner}</td>
                    <td className="px-3 py-2 text-[#5A4E6D]">{r.rationale}</td>
                    <td className="px-3 py-2"><EvidenceChips ids={r.evidence} /></td>
                    <td className="px-3 py-2 text-[#5A4E6D]">{r.reviewPoint}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full border border-[#E7C9A0] bg-[#FDF3E3] px-2 py-0.5 text-[10px] font-bold text-[#8A5410]">PROPOSED — PENDING HUMAN APPROVAL</span>
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => setSubmitted(r.action)}
                        className="rounded-full border border-[#D9C7EA] px-2.5 py-1 text-[10px] font-semibold text-[#5B2A86] hover:bg-[#F3EBFA]">
                        Simulate submission
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {submitted && (
              <p className="border-t border-[#F0E8DC] bg-[#FDF3E3] px-3 py-2 text-[11px] text-[#8A5410]">
                “{submitted}” — PROPOSED — PENDING HUMAN APPROVAL. Nothing was executed. In this demo, actions are simulated.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
