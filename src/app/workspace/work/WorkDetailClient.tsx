'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { ArrowLeft, MessageCircle, CheckCircle, Shield, Camera, MapPin as MapPinIcon } from 'lucide-react';
import { CommentThread } from '../CommentThread';

interface WorkRow {
  id: string; type: string; title: string; description?: string; status: string; visibility: string;
  created_at: string; published_at?: string | null; verify_count: number; verified_at?: string | null;
  photo_verified?: boolean; gps_verified?: boolean; contact_verified?: boolean;
}

export default function WorkDetailClient({ id }: { id: string }) {
  const [work, setWork] = useState<WorkRow | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('community_work').select('*').eq('id', id).single();
      if (data) setWork(data);
      const { data: v } = await supabase.rpc('is_work_verified', { _id: id });
      if (typeof v === 'boolean') setVerified(v);
    })();
  }, [id]);

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

  if (!work) return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading…</div>;

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
          <button onClick={confirmVerification} style={{ background: '#E0E7FF', color: '#4338CA', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} />Confirm Verification</button>
        </div>

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
