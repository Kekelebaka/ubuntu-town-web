'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { ArrowLeft, MessageCircle, CheckCircle, Shield, Camera, MapPin as MapPinIcon, UserPlus, Check, X } from 'lucide-react';
import { CommentThread } from '../CommentThread';

interface WorkRow {
  id: string; type: string; title: string; description?: string; status: string; visibility: string;
  created_at: string; published_at?: string | null; verify_count: number; verified_at?: string | null;
  photo_verified?: boolean; gps_verified?: boolean; contact_verified?: boolean;
  town_id?: string;
}

interface Assignment {
  id: string; assignee_id: string; assigned_by: string; status: string; note?: string;
  created_at: string; completed_at?: string | null;
  assignee_name?: string;
}

export default function WorkDetailClient({ id }: { id: string }) {
  const [work, setWork] = useState<WorkRow | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [coordinators, setCoordinators] = useState<{ id: string; user_id: string; display_name: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);

      const { data } = await supabase.from('community_work').select('*').eq('id', id).single();
      if (data) setWork(data);

      const { data: v } = await supabase.rpc('is_work_verified', { _id: id });
      if (typeof v === 'boolean') setVerified(v);

      // Load assignments for this work
      const { data: assignData } = await supabase
        .from('work_assignments')
        .select('*, coordinator:assignee_id(display_name)')
        .eq('work_id', id)
        .order('created_at', { ascending: false });
      if (assignData) {
        const mapped = assignData.map(a => ({
          ...a,
          assignee_name: a.coordinator?.display_name || 'Unknown'
        }));
        setAssignments(mapped);
      }
    })();
  }, [id]);

  // Load coordinators when assign form opens
  useEffect(() => {
    if (showAssignForm && work?.town_id) {
      (async () => {
        const { data } = await supabase
          .from('role_assignments')
          .select('user_id, coordinator:coordinator_id(display_name)')
          .eq('town_id', work.town_id)
          .in('role_key', ['coordinator', 'deputy', 'admin', 'ops']);
        if (data) {
          const mapped = data.map(r => ({
            id: r.coordinator_id,
            user_id: r.user_id,
            display_name: r.coordinator?.display_name || 'Unknown'
          }));
          // Deduplicate by user_id
          const unique = Array.from(new Map(mapped.map(c => [c.user_id, c])).values());
          setCoordinators(unique);
        }
      })();
    }
  }, [showAssignForm, work?.town_id]);

  async function confirmVerification() {
    await supabase.rpc('confirm_verification', { _id: id });
    const { data } = await supabase.from('community_work').select('*').eq('id', id).single();
    if (data) setWork(data);
    const { data: v } = await supabase.rpc('is_work_verified', { _id: id });
    if (typeof v === 'boolean') setVerified(v);
  }

  async function transitionStatus(next: string) {
    if (!work) return;
    await supabase.from('community_work').update({ status: next }).eq('id', id);
    const { data } = await supabase.from('community_work').select('*').eq('id', id).single();
    if (data) setWork(data);
  }

  async function assignWork() {
    if (!currentUser || !assigneeId || !work) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('work_assignments').insert({
        work_id: id,
        assignee_id: assigneeId,
        assigned_by: currentUser.id,
        status: 'open',
        note: assignNote || null
      });
      if (error) throw error;

      // Reload assignments
      const { data: assignData } = await supabase
        .from('work_assignments')
        .select('*, coordinator:assignee_id(display_name)')
        .eq('work_id', id)
        .order('created_at', { ascending: false });
      if (assignData) {
        const mapped = assignData.map(a => ({
          ...a,
          assignee_name: a.coordinator?.display_name || 'Unknown'
        }));
        setAssignments(mapped);
      }

      setShowAssignForm(false);
      setAssigneeId('');
      setAssignNote('');
    } catch (err) {
      console.error('Assign error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function markDone(assignmentId: string) {
    const { data: currentAssignment } = assignments.find(a => a.id === assignmentId);
    if (!currentAssignment || currentAssignment.assignee_id !== currentUser?.id) return;

    await supabase.from('work_assignments')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', assignmentId);

    const { data: assignData } = await supabase
      .from('work_assignments')
      .select('*, coordinator:assignee_id(display_name)')
      .eq('work_id', id)
      .order('created_at', { ascending: false });
    if (assignData) {
      const mapped = assignData.map(a => ({
        ...a,
        assignee_name: a.coordinator?.display_name || 'Unknown'
      }));
      setAssignments(mapped);
    }
  }

  async function markDropped(assignmentId: string) {
    const { data: currentAssignment } = assignments.find(a => a.id === assignmentId);
    if (!currentAssignment || currentAssignment.assignee_id !== currentUser?.id) return;

    await supabase.from('work_assignments')
      .update({ status: 'dropped' })
      .eq('id', assignmentId);

    const { data: assignData } = await supabase
      .from('work_assignments')
      .select('*, coordinator:assignee_id(display_name)')
      .eq('work_id', id)
      .order('created_at', { ascending: false });
    if (assignData) {
      const mapped = assignData.map(a => ({
        ...a,
        assignee_name: a.coordinator?.display_name || 'Unknown'
      }));
      setAssignments(mapped);
    }
  }

  if (!work) return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading…</div>;

  const openAssignments = assignments.filter(a => a.status === 'open');
  const completedAssignments = assignments.filter(a => a.status === 'done' || a.status === 'dropped');

  return (
    <div style={{ minHeight: '100vh', background: '#FBF4E6' }}>
      <div style={{ borderBottom: '1px solid #E8DCC8', background: 'white', padding: '12px 0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/workspace" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 4, display: 'flex' }}><ArrowLeft size={20} /></Link>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Work Detail</h1>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E8DCC8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, background: '#EEB84922', padding: '4px 10px', borderRadius: 8 }}>{work.type}</span>
            <span style={{ fontSize: 11, background: statusBg(work.status), padding: '3px 8px', borderRadius: 20 }}>{work.status}</span>
            {verified === true && <span style={{ fontSize: 11, background: '#A7F3D0', color: '#065F46', padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>✓ Verified</span>}
            {work.verify_count > 0 && <span style={{ fontSize: 11, background: '#A7F3D0', color: '#065F46', padding: '3px 8px', borderRadius: 20 }}>✓ confirmed ×{work.verify_count}</span>}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#1A1A2E' }}>{work.title}</h2>
          {work.description && <p style={{ fontSize: 13, color: '#333', lineHeight: 1.6 }}>{work.description}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 12, fontSize: 11, color: '#999' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: work.photo_verified ? '#059669' : '#CBD5E1' }}><Camera size={12} />Photo</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: work.gps_verified ? '#059669' : '#CBD5E1' }}><MapPinIcon size={12} />GPS</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: work.contact_verified ? '#059669' : '#CBD5E1' }}><Shield size={12} />Contact</span>
            <span style={{ marginLeft: 'auto' }}>{work.visibility} · {new Date(work.created_at).toLocaleDateString('en-ZA')}</span>
          </div>
        </div>

        {/* Actions (for coordinators) */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8DCC8', padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {work.status === 'submitted' && <button onClick={() => transitionStatus('in_review')} style={{ background: '#DBEAFE', color: '#1D4ED8', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Start Review</button>}
          {work.status === 'in_review' && <button onClick={() => transitionStatus('approved')} style={{ background: '#D1FAE5', color: '#047857', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Approve & Publish</button>}
          {['submitted', 'in_review'].includes(work.status) && <button onClick={() => transitionStatus('rejected')} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Reject</button>}
          <button onClick={() => setShowAssignForm(true)} style={{ background: '#FEF3C7', color: '#92400E', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><UserPlus size={14} />Assign</button>
          <button onClick={confirmVerification} style={{ background: '#E0E7FF', color: '#4338CA', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} />Confirm Verification</button>
        </div>

        {/* Assign form */}
        {showAssignForm && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8DCC8', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Assign to Coordinator</h3>
              <button onClick={() => { setShowAssignForm(false); setAssigneeId(''); setAssignNote(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1A1A2E', marginBottom: 6 }}>Assignee</label>
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E8DCC8', fontSize: 13, boxSizing: 'border-box' }}>
                  <option value="">Select coordinator…</option>
                  {coordinators.map(c => (
                    <option key={c.user_id} value={c.user_id}>{c.display_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1A1A2E', marginBottom: 6 }}>Note (optional)</label>
                <textarea value={assignNote} onChange={e => setAssignNote(e.target.value)} placeholder="What needs to be done?" rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E8DCC8', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <button onClick={assignWork} disabled={submitting || !assigneeId} style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: submitting || !assigneeId ? 0.6 : 1 }}>
                {submitting ? 'Assigning…' : 'Assign Work'}
              </button>
            </div>
          </div>
        )}

        {/* Assignments list */}
        {assignments.length > 0 && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8DCC8', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8DCC8' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Assignments</h3>
            </div>
            <div>
              {openAssignments.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', fontSize: 11, fontWeight: 600, color: '#92400E' }}>Open ({openAssignments.length})</div>
                  {openAssignments.map(a => (
                    <div key={a.id} style={{ padding: '12px 16px', borderBottom: '1px solid #F3EDE0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E' }}>{a.assignee_name}</span>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: '#FEF3C7', color: '#B45309' }}>open</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#999' }}>{new Date(a.created_at).toLocaleDateString('en-ZA')}</div>
                      </div>
                      {a.note && <p style={{ fontSize: 11, color: '#666', margin: '0 0 8px' }}>{a.note}</p>}
                      {currentUser?.id === a.assignee_id && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <button onClick={() => markDone(a.id)} style={{ background: '#D1FAE5', color: '#047857', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={12} /> Done
                          </button>
                          <button onClick={() => markDropped(a.id)} style={{ background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            Drop
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
              {completedAssignments.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', fontSize: 11, fontWeight: 600, color: '#6B7280' }}>Completed ({completedAssignments.length})</div>
                  {completedAssignments.map(a => (
                    <div key={a.id} style={{ padding: '10px 16px', borderBottom: '1px solid #F3EDE0', opacity: 0.6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E' }}>{a.assignee_name}</span>
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: a.status === 'done' ? '#D1FAE5' : '#F3F4F6', color: a.status === 'done' ? '#047857' : '#6B7280' }}>{a.status}</span>
                      </div>
                      {a.note && <p style={{ fontSize: 11, color: '#999', margin: 0 }}>{a.note}</p>}
                      <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>{new Date(a.created_at).toLocaleDateString('en-ZA')}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Comments */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8DCC8', overflow: 'hidden' }}>
          <CommentThread workId={id} />
        </div>
      </div>
    </div>
  );
}

function statusBg(status: string): string {
  const s: Record<string, string> = {
    draft: '#F3F4F6', submitted: '#DBEAFE', in_review: '#FEF3C7',
    approved: '#D1FAE5', published: '#A7F3D0', rejected: '#FEE2E2', archived: '#F3F4F6',
  };
  return s[status] || '#F3F4F6';
}
