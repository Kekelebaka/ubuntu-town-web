'use client';
// src/components/experience/ProposalButton.tsx — a proposal, never an execution.
// Consequential actions are human-gated by design (§16): visible state is always
// "PROPOSED — PENDING HUMAN APPROVAL".

import { useState } from 'react';

export default function ProposalButton({ label }: { label: string }) {
  const [proposed, setProposed] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setProposed(true)}
        className="mt-3 rounded-full border border-[#5B2A86] bg-white px-4 py-2 text-xs font-bold text-[#5B2A86] hover:bg-[#F3EBFA]">
        {label} — propose
      </button>
      {proposed && (
        <p className="mt-3 rounded-full border border-[#E7C9A0] bg-[#FDF3E3] px-3 py-1.5 text-[11px] font-bold text-[#8A5410]">
          PROPOSED — PENDING HUMAN APPROVAL. Nothing was executed. Consequential actions never run autonomously.
        </p>
      )}
    </div>
  );
}
