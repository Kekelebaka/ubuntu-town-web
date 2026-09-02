'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/supabase-clients/client';

const allowed = new Set(['image/jpeg','image/png','image/webp','image/heic','application/pdf']);
const maximum = 15 * 1024 * 1024;

export default function ProofUploader({ workId, townId, onReserved }: { workId: string; townId: string; onReserved: (proofId: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');

  async function upload() {
    const file = input.current?.files?.[0];
    if (!file) return setMessage('Choose a photo or PDF first.');
    if (!allowed.has(file.type)) return setMessage('Use JPEG, PNG, WebP, HEIC or PDF.');
    if (file.size > maximum) return setMessage('Proof files must be 15 MB or smaller.');
    setBusy(true); setMessage('Reserving a private proof record…');
    const client = createClient();
    const db = client.schema('uto') as any;
    const { data,error } = await db.rpc('create_proof_upload',{ _work_id:workId,_mime_type:file.type,_bytes:file.size,_notes:null });
    const reservation = Array.isArray(data) ? data[0] : null;
    if (error || !reservation?.proof_id || !reservation?.object_path) { setBusy(false); return setMessage('The proof record could not be created. Try again.'); }
    setMessage('Uploading privately…');
    const { error: uploadError } = await client.storage.from('proofs').upload(reservation.object_path,file,{ cacheControl:'0',contentType:file.type,upsert:false });
    if (uploadError) { setBusy(false); return setMessage('The file did not upload. The reserved record cannot be submitted. Try another file.'); }
    setBusy(false); setMessage('Proof uploaded. Review it, then submit for independent verification.'); onReserved(reservation.proof_id);
  }

  return <div className="lt-card lt-proof-upload"><label htmlFor="proof-file"><strong>Add real proof</strong><span>JPEG, PNG, WebP, HEIC or PDF · private · 15 MB max</span></label><input ref={input} id="proof-file" type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" capture="environment" /><button type="button" className="lt-button" onClick={upload} disabled={busy}>{busy ? 'Uploading…' : 'Upload proof'}</button>{message && <p className="lt-subtle" role="status">{message}</p>}<input type="hidden" name="town_id" value={townId} /></div>;
}
