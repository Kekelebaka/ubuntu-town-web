'use client'

/** 
 * TODAY — the operating home (blueprint SEE layer). V2 with Mission awareness.
 * 
 * Answers one question: "What needs me today?" — not "here are 19 metrics." 
 * Every card leads to action. Each tile queries independently and degrades 
 * gracefully: if RLS returns nothing for this actor, the tile shows a calm zero 
 * rather than an error. The database remains the authority on what is visible. 
 * 
 * Build 02 additions: 
 * - Coordinators see pending mission proof reviews 
 * - Builders see available missions, changes-requested, and their own progress 
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { useActor } from '@/lib/capabilities/useActor';
import { STATUS_LABEL, STATUS_COLOR } from '@/lib/work-errors';
import GuidanceCard, { ActionableEmptyState } from '@/components/operating-system/GuidanceCard';
import { KopanoEntry } from '@/components/operating-system/Kopano';
import { ClipboardCheck, FileEdit, Signal, Bell, Users, Briefcase, Target, ChevronRight, Sun, MapPin } from 'lucide-react';

interface Counts {
  reviews: number; drafts: number; signals: number; unread: number;
  published: number; inProgress: number; opportunities: number; people: number;
  // Build 02 mission counts
  missionProofsPending: number;  // coordinator: proofs awaiting review
  missionsAvailable: number;     // builder: open missions in town
  missionsChangesRequested: number; // builder: proofs with changes requested
  myActiveMissions: number;      // builder: missions in progress
}

interface RecentRow { id: string; title: string; status: string; type: string; created_at: string; }

const ZERO: Counts = { reviews: 0, drafts: 0, signals: 0, unread: 0, published: 0, inProgress: 0, opportunities: 0, people: 0, missionProofsPending: 0, missionsAvailable: 0, missionsChangesRequested: 0, myActiveMissions: 0 };

export default function TodayClient() {
  const { actor, town, displayName, loading: actorLoading, signedIn } = useActor();
  const [c, setC] = useState<Counts>(ZERO);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const townId = actor.activeTownId;
  const isCoordinator = actor.assignments.some(a => 
    ['coordinator', 'deputy', 'admin', 'ops'].includes(a.role_key) && 
    (a.town_id === townId || a.town_id === null)
  );

  const load = useCallback(async () => {
    if (!actor.userId) return;
    const cnt = async (q: PromiseLike<{ count: number | null }>) => {
      try { const { count } = await q; return count ?? 0; } catch { return 0; }
    };
    const head = () => supabase.from('community_work').select('id', { count: 'exact', head: true });

    const [reviews, drafts, signals, unread, published, inProgress, opportunities, people] = await Promise.all([
      cnt(head().in('status', ['submitted', 'in_review']).is('deleted_at', null)),
      cnt(head().eq('created_by', actor.userId).eq('status', 'draft').is('deleted_at', null)),
      townId ? cnt(supabase.from('signals').select('id', { count: 'exact', head: true }).eq('town_id', townId).eq('status', 'new')) : Promise.resolve(0),
      cnt(supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null)),
      townId ? cnt(head().eq('town_id', townId).eq('status', 'published')) : Promise.resolve(0),
      townId ? cnt(head().eq('town_id', townId).in('status', ['submitted', 'in_review', 'approved'])) : Promise.resolve(0),
      townId ? cnt(supabase.from('opportunity_points').select('id', { count: 'exact', head: true }).eq('town_id', townId)) : Promise.resolve(0),
      townId ? cnt(supabase.from('coordinators').select('id', { count: 'exact', head: true }).eq('town_id', townId)) : Promise.resolve(0),
    ]);

    // Build 02 mission counts
    let missionProofsPending = 0;
    let missionsAvailable = 0;
    let missionsChangesRequested = 0;
    let myActiveMissions = 0;

    try {
      // Coordinator: mission proofs awaiting review
      if (isCoordinator && townId) {
        missionProofsPending = await cnt(
          supabase.from('work_missions').select('id', { count: 'exact', head: true })
            .eq('town_id', townId).eq('status', 'proof_submitted')
        );
      }

      // Builder: open missions in town
      if (townId) {
        missionsAvailable = await cnt(
          supabase.from('work_missions').select('id', { count: 'exact', head: true })
            .eq('town_id', townId).eq('status', 'open')
        );
      }

      // Builder: my missions with changes requested
      missionsChangesRequested = await cnt(
        supabase.from('work_missions').select('id', { count: 'exact', head: true })
          .eq('assigned_to', actor.userId).eq('status', 'changes_requested')
      );

      // Builder: my active missions (in_progress)
      myActiveMissions = await cnt(
        supabase.from('work_missions').select('id', { count: 'exact', head: true })
          .eq('assigned_to', actor.userId).eq('status', 'in_progress')
      );
    } catch {
      // Mission counts degrade gracefully
    }

    setC({ reviews, drafts, signals, unread, published, inProgress, opportunities, people, missionProofsPending, missionsAvailable, missionsChangesRequested, myActiveMissions });

    try {
      const { data } = await supabase
        .from('community_work')
        .select('id,title,status,type,created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);
      setRecent((data as RecentRow[] | null) ?? []);
    } catch { setRecent([]); }
    setLoading(false);
  }, [actor.userId, townId, isCoordinator]);

  useEffect(() => { if (!actorLoading) load(); }, [actorLoading, load]);

  if (!actorLoading && signedIn === false) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <Sun size={44} color="var(--color-ubuntu-orange)" />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)', margin: '16px 0 8px' }}>Today</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 20 }}>Sign in to see what needs you.</p>
        <Link href="/login?next=/workspace/today" style={{ background: 'var(--color-ubuntu-orange)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Sign in</Link>
      </div>
    );
  }

  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })();
  const name = displayName ? displayName.split(' ')[0] : 'Coordinator';
  const dateStr = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });

  const needs = [
    // Coordinator: mission proofs needing review
    { show: c.missionProofsPending > 0, icon: ClipboardCheck, n: c.missionProofsPending, label: c.missionProofsPending === 1 ? 'mission proof needs review' : 'mission proofs need review', href: '/workspace/review', tone: '#7C3AED', bg: '#EDE9FE' },
    // Coordinator: community work reviews
    { show: c.reviews > 0, icon: ClipboardCheck, n: c.reviews, label: c.reviews === 1 ? 'submission needs review' : 'submissions need review', href: '/workspace/review', tone: '#1D4ED8', bg: '#DBEAFE' },
    // Builder: changes requested on their proof
    { show: c.missionsChangesRequested > 0, icon: FileEdit, n: c.missionsChangesRequested, label: c.missionsChangesRequested === 1 ? 'mission needs changes' : 'missions need changes', href: '/workspace/missions', tone: '#DC2626', bg: '#FEE2E2' },
    // Builder: available missions
    { show: c.missionsAvailable > 0 && c.myActiveMissions === 0, icon: Target, n: c.missionsAvailable, label: c.missionsAvailable === 1 ? 'mission available' : 'missions available', href: '/workspace/missions', tone: '#0369A1', bg: '#E0F2FE' },
    // Builder: active mission in progress
    { show: c.myActiveMissions > 0, icon: Briefcase, n: c.myActiveMissions, label: c.myActiveMissions === 1 ? 'mission in progress' : 'missions in progress', href: '/workspace/missions', tone: '#7C3AED', bg: '#EDE9FE' },
    // Existing V1 needs
    { show: c.drafts > 0, icon: FileEdit, n: c.drafts, label: c.drafts === 1 ? 'draft to finish & submit' : 'drafts to finish & submit', href: '/workspace', tone: '#B45309', bg: '#FEF3C7' },
    { show: c.signals > 0, icon: Signal, n: c.signals, label: c.signals === 1 ? 'new signal to triage' : 'new signals to triage', href: '/workspace', tone: '#7C3AED', bg: '#EDE9FE' },
    { show: c.unread > 0, icon: Bell, n: c.unread, label: c.unread === 1 ? 'unread notification' : 'unread notifications', href: '/workspace', tone: '#047857', bg: '#D1FAE5' },
  ].filter(x => x.show);

  return (
    <div>
      {/* Morning header */}
      <div style={{ padding: '6px 2px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ut-ink)', margin: 0, letterSpacing: '-0.02em' }}>
          {actorLoading ? 'Today' : `${greeting}, ${name}`}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ut-muted)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          {town && (<><MapPin size={13} /> {town.name} · </>)}{dateStr}
        </p>
      </div>

      <GuidanceCard
        eyebrow="What is Today?"
        title="Your operating home"
        body="Today only shows things that can lead to action: mission reviews, proof submissions, drafts, signals and notifications. If it is not actionable, it should not compete for your attention here."
        next="Start with the first item under Needs you"
        tone="explain"
      />

      <div style={{ height: 12 }} />

      {/* Needs you */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ut-orange)', margin: '0 0 10px' }}>Needs you</h2>
        {loading ? (
          <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 20, color: 'var(--ut-muted)', fontSize: 14 }}>Loading…</div>
        ) : needs.length === 0 ? (
          <ActionableEmptyState
            icon={<Sun size={32} color="var(--ut-orange)" />}
            title="You're all caught up 🎉"
            body="Nothing needs you right now. The best legitimate next move is to create fresh signal, record work, or open the town flight deck to inspect blockers."
            action="Record new work"
            href="/workspace/new"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {needs.map((x, i) => {
              const Icon = x.icon;
              return (
                <Link key={i} href={x.href} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 14, minHeight: 60 }}>
                    <span style={{ flex: 'none', width: 44, height: 44, borderRadius: 12, background: x.bg, color: x.tone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={22} /></span>
                    <span style={{ flex: 1 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ut-ink)' }}>{x.n}</span>
                      <span style={{ fontSize: 14, color: 'var(--ut-ink)', marginLeft: 8 }}>{x.label}</span>
                    </span>
                    <ChevronRight size={20} color="var(--ut-muted)" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Town pulse */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ut-orange)', margin: '0 0 10px' }}>Town pulse</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { n: c.people, label: 'People', icon: Users },
            { n: c.inProgress + c.myActiveMissions, label: 'In progress', icon: Briefcase },
            { n: c.published, label: 'Published', icon: ClipboardCheck },
            { n: c.opportunities, label: 'Opportunities', icon: Target },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                <Icon size={16} color="var(--ut-aubergine)" style={{ margin: '0 auto 4px', display: 'block' }} />
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ut-ink)', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 10, color: 'var(--ut-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
        <Link href="/workspace/town" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10, fontSize: 13, fontWeight: 600, color: 'var(--ut-aubergine)', textDecoration: 'none' }}>
          Open Town Passport <ChevronRight size={15} />
        </Link>
      </section>

      {/* Recent activity */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ut-orange)', margin: '0 0 10px' }}>Recent activity</h2>
        <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, overflow: 'hidden' }}>
          {recent.length === 0 ? (
            <p style={{ padding: 18, margin: 0, fontSize: 13, color: 'var(--ut-muted)', textAlign: 'center' }}>No activity yet. Recorded work will show here.</p>
          ) : recent.map((r, i) => (
            <Link key={r.id} href={`/workspace/work?id=${r.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '12px 14px', borderTop: i ? '1px solid var(--ut-line)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ut-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--ut-muted)' }}>{r.type} · {new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</span>
                </span>
                <span style={{ flex: 'none', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: STATUS_COLOR[r.status]?.bg ?? '#F3F4F6', color: STATUS_COLOR[r.status]?.fg ?? '#4B5563' }}>{STATUS_LABEL[r.status] ?? r.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Ask Kopano */}
      <section style={{ marginBottom: 8 }}>
        <KopanoEntry context="Operational copilot" prompt="What should I focus on today, and why?" />
      </section>
    </div>
  );
}