// src/lib/e003/loop.ts — THE OPERATING LOOP at the experience layer.
// SIGNAL → MISSION → WORK → PROOF → LEARNING → OPPORTUNITY → NEXT MISSION.
// Terminology conflicts are resolved HERE (experience layer) and documented — the schema is
// never rewritten. Grounded sources only; every object carries its epistemic class.

import { type FieldPack, packForTown } from './field-intelligence/packs';

// Structural mirror of the derived queue items produced by os.ts (kept local to avoid
// coupling the loop layer to the composition layer's inference).
export interface LoopQueueItem {
  id: string;
  what: string;
  why: string;
  owner: { display: string; placeholder: boolean; real_person: boolean };
  context: { town: string; townSlug: string; initiativeKey?: string; packId: string };
  evidence: string[];
  nextAction: string;
  priority: number;
  source: string;
}

// ---------------------------------------------------------------------------
// TERMINOLOGY RESOLUTION (contradiction D-01 — documented, not silently fixed)
// ---------------------------------------------------------------------------
// Schema reality (uto.missions, migration 0011): key/title/target_count/cadence —
// these are CAMPAIGN TARGETS (recruiting drives), with progress DERIVED from community_work
// counts. They are NOT work items. The UI says MISSION (CAMPAIGN TARGET) wherever the word
// "mission" appears, and links the semantic to the work type it targets.
export const MISSION_TERMINOLOGY_NOTE =
  'Terminology resolution (D-01): the canonical schema object uto.missions holds CAMPAIGN TARGETS ' +
  '(target_count × cadence, progress derived from community work) — not assigned work items. ' +
  'The UI language "MISSION (CAMPAIGN TARGET)" preserves this distinction; the schema is untouched. ' +
  'The operating loop\'s "mission" sense (SIGNAL → MISSION → WORK) lives at the experience layer ' +
  'as the proposal-to-work flow, and is labelled PROPOSED MISSION where it appears.';

// ---------------------------------------------------------------------------
// WORK ITEM (the executable object of Journey 1)
// ---------------------------------------------------------------------------
export interface WorkItemDetail {
  id: string;
  what: string;
  why: string;
  owner: { display: string; placeholder: boolean; real_person: boolean };
  due: { claim: 'RECORDS NOT ACCESSIBLE' | 'DERIVED'; note: string };
  context: { town: string; townSlug: string; initiativeKey?: string; packId: string };
  evidence: { required: string[]; captured: { claim: 'RECORDS NOT ACCESSIBLE'; note: string } };
  nextAction: string;
  priority: number;
  source: string;
  // LOOP POSITION — where this item sits in SIGNAL → … → NEXT MISSION
  loop: {
    signal: { claim: 'DERIVED' | 'AUTHORED'; note: string };
    mission: { claim: 'PROPOSED' | 'RECORDS NOT ACCESSIBLE'; note: string };
    proof: { claim: 'STANDARDS ONLY'; note: string };
    learning: { claim: 'ABSENT'; note: string };
    opportunity: { claim: 'DERIVED' | 'INSUFFICIENT EVIDENCE'; note: string };
    nextMission: { claim: 'PROPOSED'; note: string };
  };
}

function slugifyWork(id: string): string {
  return id.replace(/^wk:/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

/** All work items with stable public ids (used for the index and detail resolver). */
export function allWorkItems(towns: { name: string; slug: string }[], queue: LoopQueueItem[]): WorkItemDetail[] {
  return queue.map((w) => {
    const pack = packForTown(w.context.town);
    return {
      id: slugifyWork(w.id),
      what: w.what,
      why: w.why,
      owner: w.owner,
      due: {
        claim: 'RECORDS NOT ACCESSIBLE',
        note: 'Due dates live in protected work-assignment records. No deadline is invented; ' +
          'the recommended priority below is research-derived sequencing, not a commitment.',
      },
      context: w.context,
      evidence: {
        required: w.evidence,
        captured: {
          claim: 'RECORDS NOT ACCESSIBLE',
          note: 'Captured proofs are protected operational records. PROOF GAP: standards exist, evidence does not surface here.',
        },
      },
      nextAction: w.nextAction,
      priority: w.priority,
      source: w.source,
      loop: {
        signal: {
          claim: 'DERIVED',
          note: pack
            ? `This work was derived from the ${w.context.town} field-intelligence pack — the recorded signal is the town's opportunity profile (${pack.opportunity_domains.map((d) => d.domain_name).join(', ') || 'local economy'}).`
            : 'Derived signal.',
        },
        mission: {
          claim: 'PROPOSED',
          note: 'PROPOSED MISSION — PENDING HUMAN APPROVAL: beginning this work would constitute the mission "establish the workpack standard with its proof". Campaign-target missions (uto.missions) are a different object — see the terminology note.',
        },
        proof: {
          claim: 'STANDARDS ONLY',
          note: `Proof standards required: ${w.evidence.join(' · ') || 'stated per workpack'}. Standards are not evidence — captured proof is protected (PROOF GAP).`,
        },
        learning: {
          claim: 'ABSENT',
          note: 'ABSENT — the learnings object is absent from the canonical schema (verified). Completed work cannot yet feed a learning record; the loop is honest about this break (G3).',
        },
        opportunity: {
          claim: pack ? 'DERIVED' : 'INSUFFICIENT EVIDENCE',
          note: pack
            ? `Completing this work would strengthen the ${w.context.town} opportunity profile: ${pack.opportunity_domains.map((d) => d.domain_name).join(', ') || '—'}.`
            : 'No opportunity profile exists for this context.',
        },
        nextMission: {
          claim: 'PROPOSED',
          note: 'PROPOSED — PENDING HUMAN APPROVAL: the next mission is proposed from the completed work\'s outcome and learning. Nothing executes autonomously.',
        },
      },
    };
  });
}

export function workItemById(items: WorkItemDetail[], id: string): WorkItemDetail | undefined {
  return items.find((i) => i.id === id);
}

// ---------------------------------------------------------------------------
// NEXT MISSIONS — proposals derived from real signals (never autonomous)
// ---------------------------------------------------------------------------
export interface MissionProposal {
  id: string;
  title: string;
  why: string;
  evidence: string[];
}

export function nextMissionProposals(towns: { name: string; slug: string }[]): MissionProposal[] {
  const out: MissionProposal[] = [];
  for (const t of towns) {
    for (const s of signalsForTown(t)) {
      if (out.length >= 6) break;
      out.push({
        id: `mission:${t.slug}:${s.id.split(':').pop()}`,
        title: `PROPOSED MISSION: act on “${s.text.slice(0, 70)}${s.text.length > 70 ? '…' : ''}” in ${t.name}`,
        why: 'A recorded signal with enough context to consider a workpack — translated into a mission candidate by the operating loop, not decided by it.',
        evidence: [s.source],
      });
    }
    if (out.length >= 6) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// SIGNALS — real recorded signal objects (town opportunity notes + pack domains)
// ---------------------------------------------------------------------------
export interface SignalObject {
  id: string;
  text: string;
  class: 'REAL' | 'DERIVED';
  source: string;
  town: string;
  townSlug: string;
  limitation: string;
}

export function signalsForTown(town: { name: string; slug: string; opportunity_notes?: string | null }): SignalObject[] {
  const pack = packForTown(town.name);
  const out: SignalObject[] = [];
  if (town.opportunity_notes) {
    out.push({
      id: `signal:${town.slug}:notes`,
      text: town.opportunity_notes,
      class: 'REAL',
      source: 'uto.towns.opportunity_notes (live canonical record)',
      town: town.name,
      townSlug: town.slug,
      limitation: 'A recorded opportunity note is a signal, not a commitment or a plan.',
    });
  }
  if (pack) {
    for (const d of pack.opportunity_domains) {
      out.push({
        id: `signal:${town.slug}:${d.domain_id}`,
        text: `${d.domain_name} — ${d.rationale}`,
        class: 'DERIVED',
        source: `${pack.pack_id || '(pack id missing)'} opportunity domain (confidence ${d.confidence}, research)`,
        town: town.name,
        townSlug: town.slug,
        limitation: 'Research-recorded opportunity, review_required — not an operational decision.',
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// WHAT CHANGED — first-class, never manufactured
// ---------------------------------------------------------------------------
export interface ChangeItem {
  object: string;
  change: string;
  since: string;
  why: string;
  evidence: string;
  toDo: string;
}

/**
 * Meaningful change = an actual record touch inside the window (updated_at), counted from
 * real rows. Individual old→new deltas are NOT reconstructable without history records:
 * the UI says CHANGE HISTORY NOT YET AVAILABLE at object level. Never manufacture deltas.
 */
export function whatChanged(
  towns: { name: string; updated_at: string | null }[],
  windowDays: number,
): { items: ChangeItem[]; note: string } {
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const touched = towns.filter((t) => {
    if (!t.updated_at) return false;
    const ts = Date.parse(t.updated_at);
    return Number.isFinite(ts) && now - ts <= windowMs;
  });
  return {
    items: touched.slice(0, 6).map((t) => ({
      object: `Town record · ${t.name}`,
      change: 'The canonical town record was updated.',
      since: `within ${windowDays} days`,
      why: 'A town record change can move recruitment status, opportunity context or readiness.',
      evidence: 'uto.towns.updated_at (live read)',
      toDo: 'Open the town and check what moved.',
    })),
    note:
      `${touched.length} town record(s) touched in the last ${windowDays} days (COMPUTED from updated_at). ` +
      'CHANGE HISTORY NOT YET AVAILABLE: what changed inside each record cannot be reconstructed ' +
      'without history records — this system will not manufacture a delta from a timestamp.',
  };
}

// ---------------------------------------------------------------------------
// LEARNING — the honest break in the loop
// ---------------------------------------------------------------------------
export const LEARNING_LOOP_NOTE =
  'ABSENT — uto.learnings does not exist in the canonical schema (verified). The learning step ' +
  'of the operating loop is a documented structural gap (G3): completed work can be proven but ' +
  'cannot yet be recorded as learning. Memories (protected) hold narrative context for authorised ' +
  'users. Until the learnings object exists, this system shows the gap — never a fake learning feed.';
