'use client';

import { useState } from 'react';
import ProofUploader from './ProofUploader';
import { submitProof } from '@/lib/living-town/actions';

export default function WorkActions({ workId,townId }: { workId:string; townId:string }) {
  const [proofId,setProofId] = useState('');
  return <section className="lt-stack"><ProofUploader workId={workId} townId={townId} onReserved={setProofId} />{proofId && <form action={submitProof} className="lt-card lt-submit"><input type="hidden" name="proof_id" value={proofId}/><input type="hidden" name="work_id" value={workId}/><input type="hidden" name="town_id" value={townId}/><p className="lt-eyebrow">Proof ready</p><h2>Send it to an independent reviewer.</h2><p>Your work becomes read-only while the proof is checked. You cannot review your own evidence.</p><button className="lt-button" type="submit">Submit proof for review</button></form>}</section>;
}
