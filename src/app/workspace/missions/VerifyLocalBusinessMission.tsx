'use client';

/**
 * Verify Local Business — Build 02 canonical mission.
 *
 * A Builder discovers, accepts, works, and submits proof for a local business
 * verification mission. All state transitions go through SECURITY DEFINER RPCs
 * that derive actor identity from auth.uid() — the client never supplies an
 * actor ID for authorization.
 *
 * Lifecycle: DISCOVER → ACCEPT → START → SUBMIT PROOF → AWAIT REVIEW
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useActor } from '@/lib/capabilities/useActor';
import Link from 'next/link';
import { Camera, Info, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  description: string;
  status: string;
  town_id: string;
  assigned_to: string | null;
  estimated_minutes: number | null;
  capability_target: string | null;
}

interface Proof {
  id: string;
  status: string;
  current_version: number;
  reviewer_note: string | null;
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

interface BusinessInfo {
  name: string;
  category: string;
  location: string;
  observation: string;
}

const STATUS_DISPLAY: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#4B5563', bg: '#F3F4F6' },
  open: { label: 'Available', color: '#1D4ED8', bg: '#DBEAFE' },
  accepted: { label: 'Accepted', color: '#B45309', bg: '#FEF3C7' },
  in_progress: { label: 'In Progress', color: '#7C3AED', bg: '#EDE9FE' },
  proof_submitted: { label: 'Awaiting Review', color: '#0369A1', bg: '#E0F2FE' },
  under_review: { label: 'Under Review', color: '#B45309', bg: '#FEF3C7' },
  changes_requested: { label: 'Changes Requested', color: '#DC2626', bg: '#FEE2E2' },
  verified: { label: 'Verified ✓', color: '#065F46', bg: '#D1FAE5' },
  rejected: { label: 'Not Accepted', color: '#DC2626', bg: '#FEE2E2' },
};

export default function VerifyLocalBusinessMission() {
  const { actor, town, displayName, loading: actorLoading, signedIn } = useActor();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [proof, setProof] = useState<Proof | null>(null);
  const [versions, setVersions] = useState<ProofVersion[]>([]);
  const [business, setBusiness] = useState<BusinessInfo>({ name: '', category: '', location: '', observation: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const townId = actor.activeTownId;

  // Load available missions for this town
  const loadMissions = useCallback(async () => {
    if (!actor.userId || !townId) return;
    const { data } = await supabase
      .from('work_missions')
      .select('*')
      .eq('town_id', townId)
      .eq('mission_type', 'verify_local_business')
      .in('status', ['open', 'accepted', 'in_progress', 'proof_submitted', 'under_review', 'changes_requested', 'verified'])
      .order('created_at', { ascending: false });
    setMissions((data as Mission[]) ?? []);
  }, [actor.userId, townId]);

  // Load active mission details + proof
  const loadMissionDetail = useCallback(async (missionId: string) => {
    const { data, error: rpcError } = await supabase.rpc('get_my_work_mission', { _mission_id: missionId });
    if (rpcError) {
      console.error('Load mission detail error:', rpcError);
      return;
    }
    if (data?.error) {
      console.error('Mission access denied:', data.error);
      return;
    }
    if (data?.mission) setActiveMission(data.mission as Mission);
    if (data?.proof) setProof(data.proof as Proof);
    if (data?.versions) setVersions(data.versions as ProofVersion[]);
  }, []);

  useEffect(() => { if (!actorLoading) loadMissions(); }, [actorLoading, loadMissions]);

  // Sign-in gate
  if (!actorLoading && signedIn === false) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <Info size={48} color="var(--ut-orange)" />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)', margin: '16px 0 8px' }}>Missions</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 20 }}>Sign in to discover missions in your town.</p>
        <Link href="/login?next=/workspace/today" style={{ background: 'var(--ut-orange)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Sign in</Link>
      </div>
    );
  }

  // Accept mission
  async function handleAccept(missionId: string) {
    setError(undefined);
    setNotice(undefined);
    const { data, error: rpcError } = await supabase.rpc('accept_work_mission', { _mission_id: missionId });
    if (rpcError || data?.error) {
      setError(rpcError?.message || data?.hint || data?.error || 'Failed to accept mission');
      return;
    }
    setNotice('Mission accepted! Start when you are ready.');
    await loadMissionDetail(missionId);
  }

  // Start mission
  async function handleStart(missionId: string) {
    setError(undefined);
    setNotice(undefined);
    const { data, error: rpcError } = await supabase.rpc('start_work_mission', { _mission_id: missionId });
    if (rpcError || data?.error) {
      setError(rpcError?.message || data?.hint || data?.error || 'Failed to start mission');
      return;
    }
    setNotice('Mission started! Submit your proof when ready.');
    await loadMissionDetail(missionId);
  }

  // Submit proof
  async function handleSubmitProof(e: React.FormEvent) {
    e.preventDefault();
    if (!activeMission) return;
    setSubmitting(true);
    setError(undefined);
    setNotice(undefined);

    // Upload photo if provided
    let photoPath: string | null = null;
    if (photoFile) {
      const ext = photoFile.name.split('.').pop() || 'jpg';
      const key = `missions/${activeMission.town_id}/${activeMission.id}/proofs/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('mission-proofs')
        .upload(key, photoFile, { contentType: photoFile.type, upsert: false });
      if (uploadError) {
        setError(`Photo upload failed: ${uploadError.message}`);
        setSubmitting(false);
        return;
      }
      photoPath = key;
    }

    const { data, error: rpcError } = await supabase.rpc('submit_work_proof', {
      _mission_id: activeMission.id,
      _business_name: business.name.trim(),
      _business_category: business.category.trim(),
      _location: business.location.trim(),
      _observation: business.observation.trim(),
      _photo_path: photoPath,
    });

    if (rpcError || data?.error) {
      setError(rpcError?.message || data?.hint || data?.error || 'Failed to submit proof');
      setSubmitting(false);
      return;
    }

    setNotice('Proof submitted! Your coordinator will review it.');
    setBusiness({ name: '', category: '', location: '', observation: '' });
    setPhotoFile(null);
    setPhotoPreview(undefined);
    await loadMissionDetail(activeMission.id);
    setSubmitting(false);
  }

  // Mission list view
  if (!activeMission) {
    return (
      <div>
        <div style={{ padding: '6px 2px 16px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ut-ink)', margin: 0, letterSpacing: '-0.02em' }}>Missions</h1>
          <p style={{ fontSize: 13, color: 'var(--ut-muted)', margin: '4px 0 0' }}>
            {town ? `Available in ${town.name}` : 'Select a town to see missions'}
          </p>
        </div>

        {missions.length === 0 ? (
          <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
            <Clock size={32} color="var(--ut-muted)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: 'var(--ut-muted)' }}>No missions available in your town yet.</p>
            <p style={{ fontSize: 12, color: 'var(--ut-muted)', marginTop: 8 }}>Your coordinator will publish missions when the town is ready.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {missions.map(m => {
              const sd = STATUS_DISPLAY[m.status] ?? { label: m.status, color: '#4B5563', bg: '#F3F4F6' };
              return (
                <button
                  key={m.id}
                  onClick={() => loadMissionDetail(m.id)}
                  style={{
                    background: 'var(--ut-surface)', border: '1px solid var(--ut-border)',
                    borderRadius: 14, padding: 16, textAlign: 'left', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: sd.bg, color: sd.color, padding: '3px 8px', borderRadius: 20 }}>{sd.label}</span>
                    {m.estimated_minutes && <span style={{ fontSize: 11, color: 'var(--ut-muted)' }}>~{m.estimated_minutes} min</span>}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ut-ink)', margin: 0 }}>{m.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--ut-muted)', margin: 0 }}>{m.description}</p>
                  {m.capability_target && <span style={{ fontSize: 11, color: 'var(--ut-muted)' }}>Capability: {m.capability_target}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Active mission view
  const sd = STATUS_DISPLAY[activeMission.status] ?? { label: activeMission.status, color: '#4B5563', bg: '#F3F4F6' };

  return (
    <div>
      <button onClick={() => { setActiveMission(null); setProof(null); setVersions([]); setNotice(undefined); setError(undefined); loadMissions(); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ut-muted)', padding: '6px 0', marginBottom: 8 }}>
        ← Back to missions
      </button>

      <div style={{ borderBottom: '1px solid var(--ut-border)', paddingBottom: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, background: sd.bg, color: sd.color, padding: '3px 8px', borderRadius: 20 }}>{sd.label}</span>
          {activeMission.estimated_minutes && <span style={{ fontSize: 11, color: 'var(--ut-muted)' }}>~{activeMission.estimated_minutes} min</span>}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ut-ink)', margin: '0 0 8px' }}>{activeMission.title}</h2>
        <p style={{ fontSize: 14, color: 'var(--ut-muted)', margin: 0 }}>{activeMission.description}</p>
      </div>

      {notice && <div role="status" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 14px', borderRadius: 12, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{notice}</div>}
      {error && <div role="alert" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 14px', borderRadius: 12, fontSize: 14, marginBottom: 12 }}>{error}</div>}

      {/* OPEN: Accept */}
      {activeMission.status === 'open' && !activeMission.assigned_to && (
        <button onClick={() => handleAccept(activeMission.id)}
          style={{ width: '100%', background: 'var(--ut-orange)', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          Accept this mission
        </button>
      )}

      {/* ACCEPTED: Start */}
      {activeMission.status === 'accepted' && activeMission.assigned_to === actor.userId && (
        <button onClick={() => handleStart(activeMission.id)}
          style={{ width: '100%', background: 'var(--ut-aubergine)', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          Start working
        </button>
      )}

      {/* IN_PROGRESS: Submit proof form */}
      {activeMission.status === 'in_progress' && activeMission.assigned_to === actor.userId && (
        <form onSubmit={handleSubmitProof} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ut-ink)', margin: 0 }}>Submit Business Proof</h3>

          <label style={{ fontSize: 13, color: 'var(--ut-ink)' }}>
            Business Name <span style={{ color: 'var(--ut-orange)' }}>*</span>
            <input value={business.name} onChange={e => setBusiness({ ...business, name: e.target.value })}
              placeholder="e.g. KasiStore, Ubuntu Café" required
              style={{ display: 'block', width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--ut-border)', background: 'var(--ut-cream)', color: 'var(--ut-ink)', marginTop: 4, boxSizing: 'border-box' }} />
          </label>

          <label style={{ fontSize: 13, color: 'var(--ut-ink)' }}>
            Business Category <span style={{ color: 'var(--ut-orange)' }}>*</span>
            <input value={business.category} onChange={e => setBusiness({ ...business, category: e.target.value })}
              placeholder="e.g. Retail, Food, Services" required
              style={{ display: 'block', width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--ut-border)', background: 'var(--ut-cream)', color: 'var(--ut-ink)', marginTop: 4, boxSizing: 'border-box' }} />
          </label>

          <label style={{ fontSize: 13, color: 'var(--ut-ink)' }}>
            Location <span style={{ color: 'var(--ut-orange)' }}>*</span>
            <input value={business.location} onChange={e => setBusiness({ ...business, location: e.target.value })}
              placeholder="e.g. Main Street, Ubuntu Town" required
              style={{ display: 'block', width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--ut-border)', background: 'var(--ut-cream)', color: 'var(--ut-ink)', marginTop: 4, boxSizing: 'border-box' }} />
          </label>

          <label style={{ fontSize: 13, color: 'var(--ut-ink)' }}>
            Observation <span style={{ color: 'var(--ut-orange)' }}>*</span>
            <textarea value={business.observation} onChange={e => setBusiness({ ...business, observation: e.target.value })}
              placeholder="Describe what you observed... business appears operational, foot traffic, signage, etc."
              rows={4} required
              style={{ display: 'block', width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--ut-border)', background: 'var(--ut-cream)', color: 'var(--ut-ink)', marginTop: 4, resize: 'vertical', boxSizing: 'border-box' }} />
          </label>

          <div>
            <label style={{ fontSize: 13, color: 'var(--ut-ink)', display: 'block', marginBottom: 4 }}>Photo Evidence</label>
            {photoPreview ? (
              <div style={{ border: '1px solid var(--ut-border)', borderRadius: 8, overflow: 'hidden', height: 120, marginBottom: 8 }}>
                <img src={photoPreview} alt="Business photo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--ut-muted)', marginBottom: 8 }}>Optional but recommended. Tap to capture or select.</p>
            )}
            <input type="file" accept="image/*" capture="environment" id="proof-photo" style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
              }} />
            <button type="button" onClick={() => document.getElementById('proof-photo')?.click()}
              style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Camera size={16} /> {photoFile ? 'Change photo' : 'Add photo'}
            </button>
          </div>

          <button type="submit" disabled={submitting}
            style={{ width: '100%', background: submitting ? 'var(--ut-muted)' : 'var(--ut-aubergine)', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Submitting…' : 'Submit Proof →'}
          </button>
        </form>
      )}

      {/* PROOF_SUBMITTED / UNDER_REVIEW: Show awaiting state */}
      {(activeMission.status === 'proof_submitted' || activeMission.status === 'under_review') && (
        <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
          <Clock size={32} color="var(--ut-orange)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ut-ink)' }}>Awaiting coordinator review</p>
          <p style={{ fontSize: 13, color: 'var(--ut-muted)', marginTop: 4 }}>Your coordinator will review your evidence and either verify it or request changes.</p>
        </div>
      )}

      {/* CHANGES_REQUESTED: Show feedback + allow resubmission */}
      {activeMission.status === 'changes_requested' && proof?.reviewer_note && (
        <div>
          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <AlertTriangle size={16} color="#B45309" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>Changes requested</span>
            </div>
            <p style={{ fontSize: 13, color: '#78350F', margin: 0 }}>{proof.reviewer_note}</p>
          </div>
          {/* Re-show the proof form for resubmission */}
          <form onSubmit={handleSubmitProof} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ut-ink)', margin: 0 }}>Resubmit Proof</h3>
            <input value={business.name} onChange={e => setBusiness({ ...business, name: e.target.value })} placeholder="Business name" required style={{ padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--ut-border)', background: 'var(--ut-cream)' }} />
            <input value={business.category} onChange={e => setBusiness({ ...business, category: e.target.value })} placeholder="Category" required style={{ padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--ut-border)', background: 'var(--ut-cream)' }} />
            <input value={business.location} onChange={e => setBusiness({ ...business, location: e.target.value })} placeholder="Location" required style={{ padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--ut-border)', background: 'var(--ut-cream)' }} />
            <textarea value={business.observation} onChange={e => setBusiness({ ...business, observation: e.target.value })} placeholder="Updated observation" rows={4} required style={{ padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--ut-border)', background: 'var(--ut-cream)', resize: 'vertical' }} />
            <button type="submit" disabled={submitting} style={{ width: '100%', background: submitting ? 'var(--ut-muted)' : 'var(--ut-orange)', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Resubmitting…' : 'Resubmit Proof →'}
            </button>
          </form>
        </div>
      )}

      {/* VERIFIED: Show success */}
      {activeMission.status === 'verified' && (
        <div style={{ background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 14, padding: 20, textAlign: 'center' }}>
          <CheckCircle size={32} color="#065F46" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: '#065F46' }}>Mission verified!</p>
          <p style={{ fontSize: 13, color: '#065F46', marginTop: 4 }}>Your proof has been verified and capability evidence has been recorded.</p>
        </div>
      )}

      {/* REJECTED */}
      {activeMission.status === 'rejected' && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 14, padding: 20, textAlign: 'center' }}>
          <AlertTriangle size={32} color="#DC2626" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: '#B91C1C' }}>Proof not accepted</p>
          {proof?.reviewer_note && <p style={{ fontSize: 13, color: '#B91C1C', marginTop: 4 }}>{proof.reviewer_note}</p>}
        </div>
      )}

      {/* Proof version history */}
      {versions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ut-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Proof History</h3>
          {versions.map(v => (
            <div key={v.version_number} style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 12, padding: 14, marginBottom: 8 }}>
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
    </div>
  );
}