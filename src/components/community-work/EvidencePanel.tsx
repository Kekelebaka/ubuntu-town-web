'use client';

/**
 * EvidencePanel — attach and view evidence for a piece of community work.
 *
 * This is the capability that Gate 1 unblocked. Until migration 0019,
 * uto.proofs authorised only through uto.workpack_instances (an empty table),
 * so a coordinator with legitimate write access to community work had no path
 * to attach evidence to it. Proof now inherits authorisation from its parent
 * work via app.can_read_work / app.can_write_work.
 *
 * Authority note: this component does not decide who may attach evidence. It
 * attempts the insert and lets row-level security answer. A refusal is
 * translated for the human; it is never pre-empted by client-side role logic.
 *
 * Storage note: uto.proofs has no URL column. File attachment routes through
 * uto.media_assets (currently unpopulated) and the private 'proofs' storage
 * bucket, neither of which is wired up. Rather than invent a storage
 * architecture inside this gate, evidence here uses the fields the schema
 * actually supports — kind, notes, and GPS coordinates. Photo upload is a
 * deliberate follow-up, not an oversight.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { friendlyWorkError } from '@/lib/work-errors';
import { Camera, MapPin, Plus, X, FileText, Mic, Users } from 'lucide-react';

export interface ProofRow {
  id: string;
  kind: string | null;
  notes: string | null;
  status: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
  community_work_id: string | null;
}

const EVIDENCE_KINDS = [
  { value: 'photo', label: 'Photo', hint: 'Describe what the photo shows', icon: <Camera size={16} /> },
  { value: 'site_visit', label: 'Site visit', hint: 'What you saw in person', icon: <MapPin size={16} /> },
  { value: 'document', label: 'Document', hint: 'Reference or document details', icon: <FileText size={16} /> },
  { value: 'testimony', label: 'Testimony', hint: 'What someone told you', icon: <Mic size={16} /> },
  { value: 'attendance', label: 'Attendance', hint: 'Who was there, how many', icon: <Users size={16} /> },
];

export default function EvidencePanel({
  workId,
  canAttach,
  onChanged,
}: {
  workId: string;
  /** Hint only — the database remains the authority on every insert. */
  canAttach: boolean;
  onChanged?: (count: number) => void;
}) {
  const [proofs, setProofs] = useState<ProofRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState('photo');
  const [notes, setNotes] = useState('');
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('proofs')
      .select('id,kind,notes,status,lat,lng,created_at,community_work_id')
      .eq('community_work_id', workId)
      .order('created_at', { ascending: false });
    const rows = (data as ProofRow[] | null) ?? [];
    setProofs(rows);
    setLoading(false);
    onChanged?.(rows.length);
  }, [workId, onChanged]);

  useEffect(() => {
    load();
  }, [load]);

  function captureGps() {
    if (!navigator.geolocation) {
      setError('This device cannot capture location.');
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsBusy(false);
      },
      () => {
        setError('Location permission denied. You can still add evidence without it.');
        setGpsBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function reset() {
    setOpen(false);
    setKind('photo');
    setNotes('');
    setGps(null);
    setError('');
  }

  async function attach() {
    if (!notes.trim()) {
      setError('Please describe the evidence.');
      return;
    }
    setSaving(true);
    setError('');

    // community_work_id is ALWAYS set. A parentless proof is rejected by the
    // proofs_parent_integrity policy, by design.
    const { error: insertError } = await supabase.from('proofs').insert({
      community_work_id: workId,
      kind,
      notes: notes.trim(),
      status: 'pending',
      lat: gps?.lat ?? null,
      lng: gps?.lng ?? null,
    });

    setSaving(false);

    if (insertError) {
      setError(friendlyWorkError(insertError, 'proof').message);
      return;
    }

    reset();
    await load();
  }

  return (
    <section
      style={{ background: 'white', borderRadius: 14, border: '1px solid #E8DCC8', overflow: 'hidden' }}
      aria-labelledby="evidence-heading"
    >
      <header
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #E8DCC8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <h3 id="evidence-heading" style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
            Evidence
          </h3>
          <p style={{ fontSize: 12, color: '#8A8578', margin: '2px 0 0' }}>
            {loading ? 'Loading…' : proofs.length === 0 ? 'Nothing attached yet' : `${proofs.length} attached`}
          </p>
        </div>
        {canAttach && !open && (
          <button
            onClick={() => setOpen(true)}
            style={{
              background: '#1A1A2E',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minHeight: 44,
            }}
          >
            <Plus size={16} /> Add evidence
          </button>
        )}
      </header>

      {open && (
        <div style={{ padding: 16, borderBottom: '1px solid #F3EDE0', background: '#FEFCF7' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>What are you attaching?</span>
            <button
              onClick={reset}
              aria-label="Cancel"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {EVIDENCE_KINDS.map(k => (
              <button
                key={k.value}
                onClick={() => setKind(k.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 12px',
                  minHeight: 44,
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: kind === k.value ? '2px solid #EEB849' : '1px solid #E8DCC8',
                  background: kind === k.value ? '#FEF3C7' : 'white',
                  color: '#1A1A2E',
                }}
              >
                {k.icon}
                {k.label}
              </button>
            ))}
          </div>

          <label htmlFor="evidence-notes" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1A1A2E', marginBottom: 6 }}>
            Describe it
          </label>
          <textarea
            id="evidence-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder={EVIDENCE_KINDS.find(k => k.value === kind)?.hint ?? 'Describe the evidence'}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 10,
              border: '1px solid #E8DCC8',
              fontSize: 16, // 16px prevents iOS zoom-on-focus
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />

          <button
            onClick={captureGps}
            disabled={gpsBusy}
            style={{
              width: '100%',
              marginTop: 12,
              padding: '12px',
              minHeight: 44,
              borderRadius: 10,
              border: gps ? '1px solid #A7F3D0' : '1px dashed #E8DCC8',
              background: gps ? '#ECFDF5' : 'white',
              color: gps ? '#065F46' : '#666',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <MapPin size={15} />
            {gpsBusy
              ? 'Getting location…'
              : gps
                ? `Location captured (${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)})`
                : 'Add my location (optional)'}
          </button>

          {error && (
            <p role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px 12px', borderRadius: 10, fontSize: 13, margin: '12px 0 0' }}>
              {error}
            </p>
          )}

          <button
            onClick={attach}
            disabled={saving}
            style={{
              width: '100%',
              marginTop: 12,
              padding: '14px',
              minHeight: 48,
              borderRadius: 12,
              border: 'none',
              background: '#059669',
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Attaching…' : 'Attach evidence'}
          </button>
        </div>
      )}

      {!loading && proofs.length === 0 && !open && (
        <p style={{ padding: '20px 16px', margin: 0, fontSize: 13, color: '#8A8578', textAlign: 'center' }}>
          Evidence is what turns a claim into a record. Add a photo description, a site visit note, or a testimony.
        </p>
      )}

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {proofs.map(p => (
          <li key={p.id} style={{ padding: '14px 16px', borderBottom: '1px solid #F3EDE0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, background: '#F3EDE0', color: '#5C5646', padding: '3px 9px', borderRadius: 8 }}>
                {EVIDENCE_KINDS.find(k => k.value === p.kind)?.label ?? p.kind ?? 'Evidence'}
              </span>
              {p.lat != null && p.lng != null && (
                <span style={{ fontSize: 11, color: '#065F46', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <MapPin size={11} /> located
                </span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#999' }}>
                {new Date(p.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            {p.notes && <p style={{ fontSize: 14, color: '#333', margin: 0, lineHeight: 1.5 }}>{p.notes}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
