'use client';

/**
 * Review queue.
 *
 * The queue is defined by the database, not by this component. cw_read_scope
 * grants read via app.has_town_scope(town_id), so a town coordinator sees their
 * own town's submissions and a national user sees everything. We simply ask for
 * work in a reviewable status and render whatever row-level security returns.
 *
 * We deliberately do NOT compute approval eligibility here. Approval authority
 * is rank-based (app.rank_for_town vs app.required_rank, which additionally
 * consults towns.public_self_approve). Reimplementing that matrix in TypeScript
 * would create a second, drifting authorization system. Instead the action is
 * offered and the database decides; a refusal is translated into plain language.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { STATUS_LABEL, STATUS_COLOR, REVIEWABLE_STATUSES } from '@/lib/work-errors';
import { ArrowLeft, Inbox, Paperclip, MapPin } from 'lucide-react';

interface QueueRow {
  id: string;
  type: string;
  title: string;
  status: string;
  visibility: string;
  town_id: string | null;
  created_at: string;
  submitted_at: string | null;
  town_name?: string;
  proof_count?: number;
}

export default function ReviewQueueClient() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    setAuthed(true);

    const { data: work } = await supabase
      .from('community_work')
      .select('id,type,title,status,visibility,town_id,created_at,submitted_at')
      .in('status', REVIEWABLE_STATUSES as unknown as string[])
      .is('deleted_at', null)
      .order('submitted_at', { ascending: true, nullsFirst: false });

    const list = (work as QueueRow[] | null) ?? [];

    if (list.length > 0) {
      const townIds = Array.from(new Set(list.map(w => w.town_id).filter(Boolean))) as string[];
      const ids = list.map(w => w.id);

      const [{ data: towns }, { data: proofs }] = await Promise.all([
        townIds.length
          ? supabase.from('towns').select('id,name').in('id', townIds)
          : Promise.resolve({ data: [] as { id: string; name: string }[] }),
        supabase.from('proofs').select('community_work_id').in('community_work_id', ids),
      ]);

      const townMap = new Map((towns ?? []).map(t => [t.id, t.name]));
      const proofCounts = new Map<string, number>();
      for (const p of (proofs ?? []) as { community_work_id: string }[]) {
        proofCounts.set(p.community_work_id, (proofCounts.get(p.community_work_id) ?? 0) + 1);
      }

      for (const w of list) {
        w.town_name = w.town_id ? townMap.get(w.town_id) : undefined;
        w.proof_count = proofCounts.get(w.id) ?? 0;
      }
    }

    setRows(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (authed === false) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF4E6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <Inbox size={44} color="#EEB849" />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', margin: '16px 0 8px' }}>Review queue</h1>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Sign in to review community work.</p>
          <Link href="/login?next=/workspace/review" style={{ background: '#EEB849', color: 'white', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBF4E6' }}>
      <div style={{ borderBottom: '1px solid #E8DCC8', background: 'white', padding: '12px 0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/workspace" aria-label="Back to workspace" style={{ color: '#666', padding: 4, display: 'flex' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Review queue</h1>
          {!loading && (
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#8A8578' }}>
              {rows.length} waiting
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>Loading…</p>}

        {!loading && rows.length === 0 && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8DCC8', padding: 40, textAlign: 'center' }}>
            <Inbox size={32} color="#CBBFA6" />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E', margin: '12px 0 4px' }}>Nothing waiting</p>
            <p style={{ fontSize: 13, color: '#8A8578', margin: 0 }}>Work you can review will appear here once it is submitted.</p>
          </div>
        )}

        {rows.map(w => (
          <Link
            key={w.id}
            href={`/workspace/work?id=${w.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <article
              style={{
                background: 'white',
                borderRadius: 14,
                border: '1px solid #E8DCC8',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: STATUS_COLOR[w.status]?.bg ?? '#F3F4F6',
                    color: STATUS_COLOR[w.status]?.fg ?? '#4B5563',
                    padding: '3px 9px',
                    borderRadius: 20,
                  }}
                >
                  {STATUS_LABEL[w.status] ?? w.status}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, background: '#F3EDE0', color: '#5C5646', padding: '3px 9px', borderRadius: 8 }}>
                  {w.type}
                </span>
                <span style={{ fontSize: 11, color: '#8A8578' }}>{w.visibility}</span>
              </div>

              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: 0, lineHeight: 1.35 }}>{w.title}</h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#8A8578', flexWrap: 'wrap' }}>
                {w.town_name && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} />
                    {w.town_name}
                  </span>
                )}
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: (w.proof_count ?? 0) > 0 ? '#065F46' : '#B45309',
                    fontWeight: 600,
                  }}
                >
                  <Paperclip size={12} />
                  {(w.proof_count ?? 0) === 0 ? 'No evidence' : `${w.proof_count} evidence`}
                </span>
                <span style={{ marginLeft: 'auto' }}>
                  {w.submitted_at
                    ? new Date(w.submitted_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
                    : new Date(w.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
