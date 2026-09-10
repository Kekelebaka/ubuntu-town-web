'use client';

/**
 * Mission Proof Review — Coordinator view of a submitted mission proof.
 *
 * Shows proof details, business data, photo evidence, and action buttons.
 * All state mutations go through SECURITY DEFINER RPCs — never direct updates.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { CheckCircle, XCircle, AlertTriangle, Camera, Clock, MapPin } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  description: string;
  status: string;
  town_id: string;
  assigned_to: string | null;
  created_at: string;
}

interface Proof {
  id: string;
  status: string;
  current_version: number;
  reviewer_note: string | null;
  submitted_by: string;
  verified_at: string | null;
}

interface ProofVersion {
  version_number: number;
  business_name: string;
  business_category: string;
  location: string | null;
  observation: string;
  photo_path: string | null;
  submitted_at: string;
}

interface MissionDetail {
  mission: Mission;
  proof: Proof | null;
  versions: ProofVersion[];
}

export default function MissionProofReview({
  missionId,
  onBack,
}: {
  missionId: string;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<MissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const [actionLoading, setActionLoading] = useState(false);
  const [changesNote, setChangesNote] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [showChangesForm, setShowChangesForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    const { data, error: rpcError } = await supabase.rpc('get_my_mission', { _mission_id: missionId });
    if (rpcError || data?.error) {
      setError(rpcError?.message || data?.error || 'Failed to load mission');
      setLoading(false);
      return;
    }

    const d: MissionDetail = {
      mission: data.mission,
      proof: data.proof,
      versions: data.versions ?? [],
    };
    setDetail(d);

    // Load photo URL if proof has a photo
    const latestVersion = d.versions[d.versions.length - 1];
    if (latestVersion?.photo_path) {
      const { data: urlData } = await supabase.storage
        .from('mission-proofs')
        .createSignedUrl(latestVersion.photo_path, 3600);
      if (urlData?.signedUrl) setPhotoUrl(urlData.signedUrl);
    }

    setLoading(false);
  }, [missionId]);

  useEffect(() => { load(); }, [load]);

  async function handleVerify() {
    if (!detail) return;
    setActionLoading(true);
    setError(undefined);
    setNotice(undefined);

    const { data, error: rpcError } = await supabase.rpc('verify_proof', { _mission_id: missionId });
    if (rpcError || data?.error) {
      setError(rpcError?.message || data?.hint || data?.error || 'Verification failed');
      setActionLoading(false);
      return;
    }

    setNotice('Proof verified. Capability evidence awarded.');
    await load();
    setActionLoading(false);
  }

  async function handleRequestChanges() {
    if (!detail || !changesNote.trim()) return;
    setActionLoading(true);
    setError(undefined);
    setNotice(undefined);

    const { data, error: rpcError } = await supabase.rpc('request_changes', {
      _mission_id: missionId,
      _reviewer_note: changesNote.trim(),
    });
    if (rpcError || data?.error) {
      setError(rpcError?.message || data?.hint || data?.error || 'Request changes failed');
      setActionLoading(false);
      return;
    }

    setNotice('Changes requested. Builder will be notified.');
    setShowChangesForm(false);
    setChangesNote('');
    await load();
    setActionLoading(false);
  }

  async function handleReject() {
    if (!detail || !rejectNote.trim()) return;
    setActionLoading(true);
    setError(undefined);
    setNotice(undefined);

    const { data, error: rpcError } = await supabase.rpc('reject_proof', {
      _mission_id: missionId,
      _reviewer_note: rejectNote.trim(),
    });
    if (rpcError || data?.error) {
      setError(rpcError?.message || data?.hint || data?.error || 'Rejection failed');
      setActionLoading(false);
      return;
    }

    setNotice('Proof rejected.');
    setShowRejectForm(false);
    setRejectNote('');
    await load();
    setActionLoading(false);
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Clock size={32} color="var(--ut-muted)" style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: 14, color: 'var(--ut-muted)' }}>Loading proof…</p>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <XCircle size={32} color="#DC2626" style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: 14, color: '#DC2626' }}>{error}</p>
        <button onClick={onBack} style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--ut-aubergine)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>← Back</button>
      </div>
    );
  }

  if (!detail) return null;

  const { mission, proof, versions } = detail;
  const latestVersion = versions[versions.length - 1];
  const isPending = proof?.status === 'pending';

  const statusColors: Record<string, { label: string; bg: string; fg: string }> = {
    pending: { label: 'Awaiting Review', bg: '#DBEAFE', fg: '#1D4ED8' },
    changes_requested: { label: 'Changes Requested', bg: '#FEE2E2', fg: '#DC2626' },
    verified: { label: 'Verified', bg: '#D1FAE5', fg: '#065F46' },
    rejected: { label: 'Rejected', bg: '#FEE2E2', fg: '#DC2626' },
  };
  const sc = proof ? (statusColors[proof.status] ?? { label: proof.status, bg: '#F3F4F6', fg: '#4B5563' }) : null;

  return (
    <div>
      <button onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ut-muted)', padding: '6px 0', marginBottom: 12 }}>
        ← Back to review queue
      </button>

      {/* Mission header */}
      <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {sc && <span style={{ fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.fg, padding: '3px 9px', borderRadius: 20 }}>{sc.label}</span>}
          {proof && <span style={{ fontSize: 11, color: 'var(--ut-muted)' }}>Version {proof.current_version}</span>}
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ut-ink)', margin: '0 0 6px' }}>{mission.title}</h2>
        <p style={{ fontSize: 13, color: 'var(--ut-muted)', margin: 0 }}>{mission.description}</p>
      </div>

      {notice && <div role="status" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 14px', borderRadius: 12, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{notice}</div>}
      {error && <div role="alert" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 14px', borderRadius: 12, fontSize: 14, marginBottom: 12 }}>{error}</div>}

      {/* Latest proof */}
      {latestVersion && (
        <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ut-ink)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Proof — Version {latestVersion.version_number}
          </h3>

          {/* Business info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ut-muted)', textTransform: 'uppercase', margin: '0 0 4px' }}>Business Name</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ut-ink)', margin: 0 }}>{latestVersion.business_name}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ut-muted)', textTransform: 'uppercase', margin: '0 0 4px' }}>Category</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ut-ink)', margin: 0 }}>{latestVersion.business_category}</p>
            </div>
          </div>

          {latestVersion.location && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ut-muted)', textTransform: 'uppercase', margin: '0 0 4px' }}>Location</p>
              <p style={{ fontSize: 14, color: 'var(--ut-ink)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} /> {latestVersion.location}
              </p>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ut-muted)', textTransform: 'uppercase', margin: '0 0 4px' }}>Observation</p>
            <p style={{ fontSize: 14, color: 'var(--ut-ink)', margin: 0, lineHeight: 1.5 }}>{latestVersion.observation}</p>
          </div>

          {/* Photo evidence */}
          {photoUrl && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ut-muted)', textTransform: 'uppercase', margin: '0 0 8px' }}>Photo Evidence</p>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--ut-border)', maxHeight: 300 }}>
                <img src={photoUrl} alt="Business photo evidence" style={{ width: '100%', height: 'auto', maxHeight: 300, objectFit: 'cover', display: 'block' }} />
              </div>
            </div>
          )}

          {!photoUrl && latestVersion.photo_path && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ut-muted)' }}>
              <Camera size={14} /> Photo uploaded (loading…)
            </div>
          )}

          <p style={{ fontSize: 11, color: 'var(--ut-muted)', margin: 0 }}>
            Submitted {new Date(latestVersion.submitted_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}

      {/* Previous versions */}
      {versions.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ut-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Previous Versions</h3>
          {versions.slice(0, -1).reverse().map(v => (
            <div key={v.version_number} style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 12, padding: 14, marginBottom: 8, opacity: 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ut-ink)' }}>Version {v.version_number}</span>
                <span style={{ fontSize: 11, color: 'var(--ut-muted)' }}>{new Date(v.submitted_at).toLocaleDateString('en-ZA')}</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ut-ink)', margin: '0 0 4px' }}>{v.business_name}</p>
              <p style={{ fontSize: 12, color: 'var(--ut-muted)', margin: 0 }}>{v.business_category} · {v.location}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reviewer note (if exists) */}
      {proof?.reviewer_note && (
        <div style={{ background: proof.status === 'verified' ? '#ECFDF5' : '#FEF3C7', border: `1px solid ${proof.status === 'verified' ? '#A7F3D0' : '#FDE68A'}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: proof.status === 'verified' ? '#065F46' : '#92400E', textTransform: 'uppercase', margin: '0 0 4px' }}>Coordinator Note</p>
          <p style={{ fontSize: 14, color: proof.status === 'verified' ? '#065F46' : '#78350F', margin: 0 }}>{proof.reviewer_note}</p>
        </div>
      )}

      {/* Actions — only when proof is pending */}
      {isPending && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Verify */}
          <button onClick={handleVerify} disabled={actionLoading}
            style={{ width: '100%', background: actionLoading ? 'var(--ut-muted)' : '#065F46', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <CheckCircle size={18} /> Verify Proof
          </button>

          {/* Request Changes */}
          {!showChangesForm ? (
            <button onClick={() => { setShowChangesForm(true); setShowRejectForm(false); }}
              style={{ width: '100%', background: 'var(--ut-surface)', color: '#B45309', border: '1px solid #FDE68A', padding: '14px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <AlertTriangle size={18} /> Request Changes
            </button>
          ) : (
            <div style={{ background: 'var(--ut-surface)', border: '1px solid #FDE68A', borderRadius: 14, padding: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ut-ink)', display: 'block', marginBottom: 8 }}>
                What changes are needed?
                <textarea value={changesNote} onChange={e => setChangesNote(e.target.value)} rows={3} placeholder="Explain what the builder should fix or improve…"
                  style={{ display: 'block', width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--ut-border)', background: 'var(--ut-cream)', marginTop: 4, resize: 'vertical', boxSizing: 'border-box' }} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleRequestChanges} disabled={actionLoading || !changesNote.trim()}
                  style={{ flex: 1, background: actionLoading || !changesNote.trim() ? 'var(--ut-muted)' : '#B45309', color: '#fff', border: 'none', padding: '12px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: actionLoading || !changesNote.trim() ? 'not-allowed' : 'pointer' }}>
                  Send
                </button>
                <button onClick={() => { setShowChangesForm(false); setChangesNote(''); }}
                  style={{ flex: 1, background: 'var(--ut-surface)', color: 'var(--ut-ink)', border: '1px solid var(--ut-border)', padding: '12px 16px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Reject */}
          {!showRejectForm ? (
            <button onClick={() => { setShowRejectForm(true); setShowChangesForm(false); }}
              style={{ width: '100%', background: 'var(--ut-surface)', color: '#DC2626', border: '1px solid #FCA5A5', padding: '14px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <XCircle size={18} /> Reject Proof
            </button>
          ) : (
            <div style={{ background: 'var(--ut-surface)', border: '1px solid #FCA5A5', borderRadius: 14, padding: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ut-ink)', display: 'block', marginBottom: 8 }}>
                Reason for rejection (required)
                <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={3} placeholder="Explain why this proof cannot be accepted…"
                  style={{ display: 'block', width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--ut-border)', background: 'var(--ut-cream)', marginTop: 4, resize: 'vertical', boxSizing: 'border-box' }} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleReject} disabled={actionLoading || !rejectNote.trim()}
                  style={{ flex: 1, background: actionLoading || !rejectNote.trim() ? 'var(--ut-muted)' : '#DC2626', color: '#fff', border: 'none', padding: '12px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: actionLoading || !rejectNote.trim() ? 'not-allowed' : 'pointer' }}>
                  Reject
                </button>
                <button onClick={() => { setShowRejectForm(false); setRejectNote(''); }}
                  style={{ flex: 1, background: 'var(--ut-surface)', color: 'var(--ut-ink)', border: '1px solid var(--ut-border)', padding: '12px 16px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
