'use client';

/**
 * Review queue — V2 with Mission Proof awareness.
 *
 * Two tabs: Community Work and Mission Proofs.
 * Each shows items the database says this coordinator may review.
 * The UI offers the action, but backend RLS/rank checks decide whether
 * approval is legitimate.
 *
 * Community Work uses the existing V1 flow.
 * Mission Proofs use the Build 02 SECURITY DEFINER RPCs.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { STATUS_LABEL, STATUS_COLOR, REVIEWABLE_STATUSES } from '@/lib/work-errors';
import GuidanceCard, { ActionableEmptyState } from '@/components/operating-system/GuidanceCard';
import { KopanoEntry } from '@/components/operating-system/Kopano';
import MissionProofReview from './MissionProofReview';
import { ArrowLeft, Inbox, Paperclip, MapPin, ClipboardCheck, Briefcase } from 'lucide-react';

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

interface MissionProofRow {
  id: string;
  title: string;
  status: string;
  town_id: string;
  assigned_to: string | null;
  created_at: string;
  town_name?: string;
}

type Tab = 'work' | 'missions';

const MISSION_TAB_STATUSES = ['proof_submitted'];

export default function ReviewQueueClient() {
  const [tab, setTab] = useState<Tab>('work');
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [missionRows, setMissionRows] = useState<MissionProofRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    setAuthed(true);

    // Load community work queue
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

    // Load mission proofs awaiting review
    try {
      const { data: missions } = await supabase
        .from('work_missions')
        .select('id,title,status,town_id,assigned_to,created_at')
        .in('status', MISSION_TAB_STATUSES)
        .order('created_at', { ascending: true });

      const missionList = (missions as MissionProofRow[] | null) ?? [];

      // Resolve town names
      if (missionList.length > 0) {
        const townIds = Array.from(new Set(missionList.map(m => m.town_id).filter(Boolean)));
        if (townIds.length > 0) {
          const { data: towns } = await supabase.from('towns').select('id,name').in('id', townIds);
          const townMap = new Map((towns ?? []).map(t => [t.id, t.name]));
          for (const m of missionList) {
            m.town_name = townMap.get(m.town_id) ?? undefined;
          }
        }
      }

      setMissionRows(missionList);
    } catch {
      setMissionRows([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // If viewing a specific mission proof
  if (selectedMissionId) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)', padding: '12px 0', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/workspace/review" aria-label="Back to review queue" style={{ color: '#666', padding: 4, display: 'flex' }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Mission Proof Review</h1>
          </div>
        </div>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px' }}>
          <MissionProofReview missionId={selectedMissionId} onBack={() => { setSelectedMissionId(null); load(); }} />
        </div>
      </div>
    );
  }

  if (authed === false) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <Inbox size={44} color="var(--color-ubuntu-orange)" />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)', margin: '16px 0 8px' }}>Review queue</h1>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Sign in to review community work and mission proofs.</p>
          <Link href="/login?next=/workspace/review" style={{ background: 'var(--color-ubuntu-orange)', color: 'white', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)', padding: '12px 0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/workspace" aria-label="Back to workspace" style={{ color: '#666', padding: 4, display: 'flex' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Review queue</h1>
          {!loading && (
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)' }}>
              {rows.length + missionRows.length} waiting
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginTop: 8 }}>
          <button
            onClick={() => setTab('work')}
            style={{
              flex: 1, padding: '10px 12px', fontSize: 13, fontWeight: tab === 'work' ? 700 : 500,
              color: tab === 'work' ? 'var(--ut-aubergine)' : 'var(--muted-foreground)',
              background: 'none', border: 'none', borderBottom: tab === 'work' ? '2px solid var(--ut-aubergine)' : '2px solid transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Briefcase size={14} />
            Community Work
            {!loading && rows.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--ut-aubergine)', color: '#fff', padding: '1px 6px', borderRadius: 10 }}>{rows.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab('missions')}
            style={{
              flex: 1, padding: '10px 12px', fontSize: 13, fontWeight: tab === 'missions' ? 700 : 500,
              color: tab === 'missions' ? 'var(--ut-aubergine)' : 'var(--muted-foreground)',
              background: 'none', border: 'none', borderBottom: tab === 'missions' ? '2px solid var(--ut-aubergine)' : '2px solid transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <ClipboardCheck size={14} />
            Mission Proofs
            {!loading && missionRows.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--ut-orange)', color: '#fff', padding: '1px 6px', borderRadius: 10 }}>{missionRows.length}</span>
            )}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Community Work tab */}
        {tab === 'work' && (
          <>
            <GuidanceCard
              eyebrow="How review works"
              title="Review is the PROVE -> VERIFY gate"
              body="This queue shows submitted work the database says you may review. The UI offers the action, but backend RLS/rank checks decide whether approval is legitimate."
              next="Open the oldest item with weak or missing evidence first"
              tone="guide"
            />
            <KopanoEntry context="Review copilot" prompt="Which evidence is weak and what should I request before approval?" />
            {loading && <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>Loading…</p>}

            {!loading && rows.length === 0 && (
              <ActionableEmptyState
                icon={<Inbox size={32} color="var(--muted-foreground)" />}
                title="Nothing waiting"
                body="No submitted work is waiting for your review. If the town feels stuck, create/assign a concrete next action or ask Kopano what evidence is missing."
                action="Open Today"
                href="/workspace/today"
              />
            )}

            {rows.map(w => (
              <Link
                key={w.id}
                href={`/workspace/work?id=${w.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <article
                  style={{
                    background: 'var(--card)',
                    borderRadius: 14,
                    border: '1px solid var(--border)',
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
                    <span style={{ fontSize: 11, fontWeight: 600, background: 'var(--secondary)', color: 'var(--muted-foreground)', padding: '3px 9px', borderRadius: 8 }}>
                      {w.type}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{w.visibility}</span>
                  </div>

                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', margin: 0, lineHeight: 1.35 }}>{w.title}</h2>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--muted-foreground)', flexWrap: 'wrap' }}>
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
          </>
        )}

        {/* Mission Proofs tab */}
        {tab === 'missions' && (
          <>
            {loading && <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>Loading…</p>}

            {!loading && missionRows.length === 0 && (
              <ActionableEmptyState
                icon={<ClipboardCheck size={32} color="var(--muted-foreground)" />}
                title="No mission proofs waiting"
                body="When builders submit proof for missions, those proofs will appear here for your review."
                action="Open Today"
                href="/workspace/today"
              />
            )}

            {missionRows.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMissionId(m.id)}
                style={{
                  textDecoration: 'none', color: 'inherit', cursor: 'pointer',
                  background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border)',
                  padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
                  textAlign: 'left', width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#DBEAFE', color: '#1D4ED8', padding: '3px 9px', borderRadius: 20 }}>
                    Awaiting Review
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, background: 'var(--secondary)', color: 'var(--muted-foreground)', padding: '3px 9px', borderRadius: 8 }}>
                    Mission
                  </span>
                </div>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', margin: 0, lineHeight: 1.35 }}>{m.title}</h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--muted-foreground)', flexWrap: 'wrap' }}>
                  {m.town_name && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} />
                      {m.town_name}
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto' }}>
                    {new Date(m.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}