// src/lib/pulse/reducers.ts — bottom-up derived rollups (ONE truth, many projections)
// Level order (per directive): initiative → town → province → national, plus person/role.
// Every level is computed from the SAME PulseDataset rows — no Pulse-level records are
// ever created, stored, or copied. Every metric/claim carries exact canonical row ids.
// When evidence does not support a claim: return INSUFFICIENT_EVIDENCE — never invent data.

import type {
  PulseDataset, PulseNode, PulseMetrics, PulseStatement,
  SignalRow, WorkRow, ProofRow,
} from "./types";
import { WORK_OPEN_STATES } from "./types";

export const STALE_DAYS = 14;

function stale(works: WorkRow[], now: number): WorkRow[] {
  return works.filter((w) =>
    (WORK_OPEN_STATES as readonly string[]).includes(w.status) &&
    now - new Date(w.updated_at).getTime() > STALE_DAYS * 86400_000
  );
}

function peopleActive(...groups: { created_by: string | null }[][]): number {
  const s = new Set<string>();
  for (const g of groups) for (const r of g) if (r.created_by) s.add(r.created_by);
  return s.size;
}

function baseMetrics(rows: {
  signals: SignalRow[]; works: WorkRow[]; proofs: ProofRow[];
}, now: number): PulseMetrics {
  const open = rows.works.filter((w) => (WORK_OPEN_STATES as readonly string[]).includes(w.status));
  const published = rows.works.filter((w) => w.status === "published");
  return {
    signals: rows.signals.length,
    workOpen: open.length,
    workPublished: published.length,
    proofsCaptured: rows.proofs.length,
    proofCaptureRate: published.length > 0 ? rows.proofs.length / published.length : null, // null = INSUFFICIENT EVIDENCE
    staleOpenWork: stale(rows.works, now).length,
    peopleActive: peopleActive(rows.signals, rows.works),
  };
}

/** Row filter for one initiative cell (initiative within the dataset scope). */
export function rowsForInitiative(ds: PulseDataset, initiative: string, townId?: string) {
  const inScope = <T extends { initiative: string | null; town_id: string }>(r: T) =>
    r.initiative === initiative && (townId === undefined || r.town_id === townId);
  return {
    signals: ds.signals.filter(inScope),
    works: ds.works.filter(inScope),
    proofs: ds.proofs.filter(inScope),
    learnings: ds.learnings.filter(inScope),
    opportunities: ds.opportunities.filter(inScope),
    memories: ds.memories.filter((m) => m.initiative === initiative),
  };
}

/** LEVEL 1 — initiative-derived state. */
export function initiativeRollup(ds: PulseDataset, initiative: string, townId: string | undefined, now: number): PulseNode {
  const rows = rowsForInitiative(ds, initiative, townId);
  const metrics = baseMetrics(rows, now);
  const statements: PulseStatement[] = [];
  const staleW = stale(rows.works, now);

  if (metrics.workPublished + metrics.workOpen === 0 && metrics.signals === 0) {
    statements.push({
      kind: "insufficient_evidence",
      interpretation: `No work or signal rows exist for initiative ${initiative} in this scope.`,
      evidence: [], capabilityImplication: null, nextAction: null, owner: null, reviewPoint: null,
      reason: "INSUFFICIENT EVIDENCE: zero canonical rows — capability cannot be assessed.",
    });
  } else {
    if (metrics.proofCaptureRate === null) {
      statements.push({
        kind: "insufficient_evidence",
        interpretation: "Proof capture rate cannot be computed for this initiative.",
        evidence: rows.works.map((w) => w.id),
        capabilityImplication: null, nextAction: null, owner: null, reviewPoint: null,
        reason: "INSUFFICIENT EVIDENCE: no published work to measure proof capture against.",
      });
    } else {
      statements.push({
        kind: "signal",
        interpretation: `Proof capture rate ${(metrics.proofCaptureRate * 100).toFixed(0)}% (${rows.proofs.length} proofs / ${metrics.workPublished} published works).`,
        evidence: [...rows.works.filter((w) => w.status === "published").map((w) => w.id), ...rows.proofs.map((p) => p.id)],
        capabilityImplication: metrics.proofCaptureRate >= 1 ? "evidence discipline is holding" : "proof capture lags published work",
        nextAction: metrics.proofCaptureRate >= 1 ? null : {
          action: "Capture missing proofs for published work", owner: "town lead (scope owner)", reviewPoint: "next weekly heartbeat",
        },
        owner: "town lead (scope owner)", reviewPoint: "next weekly heartbeat",
      });
    }
    if (staleW.length > 0) {
      statements.push({
        kind: "signal",
        interpretation: `${staleW.length} open work item(s) untouched for > ${STALE_DAYS} days.`,
        evidence: staleW.map((w) => w.id),
        capabilityImplication: "capacity or follow-through is missing",
        nextAction: { action: "Review stalled work and reassign or close", owner: "assigned coordinator", reviewPoint: "next town pulse review" },
        owner: "assigned coordinator", reviewPoint: "next town pulse review",
      });
    }
    if (rows.learnings.length > 0) {
      statements.push({
        kind: "signal",
        interpretation: `${rows.learnings.length} learning(s) recorded from proof evidence.`,
        evidence: rows.learnings.map((l) => l.id),
        capabilityImplication: "learning loop is active for this initiative",
        nextAction: null, owner: null, reviewPoint: "next initiative review",
      });
    }
    if (rows.opportunities.length > 0) {
      statements.push({
        kind: "signal",
        interpretation: `${rows.opportunities.filter((o) => o.status === "open").length} open opportunit(ies) attached to this initiative.`,
        evidence: rows.opportunities.map((o) => o.id),
        capabilityImplication: "economic conversion path exists",
        nextAction: { action: "Match open opportunities to proven people", owner: "initiative head (scope owner)", reviewPoint: "next opportunity review" },
        owner: "initiative head (scope owner)", reviewPoint: "next opportunity review",
      });
    }
  }

  return {
    scope: { kind: "initiative", id: `initiative:${initiative}${townId ? `@${townId}` : ""}`, label: initiative },
    metrics, statements, children: [],
    evidence: {
      workIds: rows.works.map((w) => w.id), proofIds: rows.proofs.map((p) => p.id),
      signalIds: rows.signals.map((s) => s.id), learningIds: rows.learnings.map((l) => l.id),
      opportunityIds: rows.opportunities.map((o) => o.id),
    },
  };
}

function collectRows(ds: PulseDataset, townId: string) {
  // Rollup aggregates PROJECTIONS of the same rows (ids re-derived, never copied).
  const townRows = {
    signals: ds.signals.filter((r) => r.town_id === townId),
    works: ds.works.filter((r) => r.town_id === townId),
    proofs: ds.proofs.filter((r) => r.town_id === townId),
    learnings: ds.learnings.filter((r) => r.town_id === townId),
    opportunities: ds.opportunities.filter((r) => r.town_id === townId),
    memories: ds.memories.filter((m) => m.town_id === townId),
  };
  return townRows;
}

/** LEVEL 2 — town rollup (children = initiative cells; metrics re-derived from same rows). */
export function townRollup(ds: PulseDataset, town: { id: string; name: string }, now: number): PulseNode {
  const initiatives = Array.from(new Set([
    ...ds.works.filter((w) => w.town_id === town.id).map((w) => w.initiative),
    ...ds.signals.filter((s) => s.town_id === town.id).map((s) => s.initiative),
  ].filter((x): x is string => x !== null)));
  const children = initiatives.map((i) => initiativeRollup(ds, i, town.id, now));
  const rows = collectRows(ds, town.id);
  const metrics = baseMetrics(rows, now);
  const statements: PulseStatement[] = [];

  if (children.length === 0) {
    statements.push({
      kind: "insufficient_evidence",
      interpretation: `No initiative-scoped rows exist for ${town.name}.`,
      evidence: [], capabilityImplication: null, nextAction: null, owner: null, reviewPoint: null,
      reason: "INSUFFICIENT EVIDENCE: town activity cannot be characterised without work or signal rows.",
    });
  } else {
    statements.push({
      kind: "signal",
      interpretation: `${town.name}: ${metrics.workOpen} open / ${metrics.workPublished} published works, ${metrics.proofsCaptured} proofs, ${metrics.peopleActive} active people across ${children.length} initiative(s).`,
      evidence: rows.works.map((w) => w.id),
      capabilityImplication: metrics.staleOpenWork > 0 ? "follow-through risk" : "operating rhythm holding",
      nextAction: metrics.staleOpenWork > 0
        ? { action: "Clear stalled work", owner: "town lead", reviewPoint: "next town pulse review" }
        : { action: "Continue current operating rhythm", owner: "town lead", reviewPoint: "next weekly heartbeat" },
      owner: "town lead", reviewPoint: "next weekly heartbeat",
    });
    if (metrics.signals > 0) {
      statements.push({
        kind: "signal",
        interpretation: `${metrics.signals} signal(s) raised in ${town.name}.`,
        evidence: rows.signals.map((s) => s.id),
        capabilityImplication: "town is signalling — responsiveness is testable",
        nextAction: { action: "Triage signals into workpacks", owner: "town coordinator", reviewPoint: "next town pulse review" },
        owner: "town coordinator", reviewPoint: "next town pulse review",
      });
    }
  }

  return {
    scope: { kind: "town", id: `town:${town.id}`, label: town.name },
    metrics, statements, children,
    evidence: {
      workIds: rows.works.map((w) => w.id), proofIds: rows.proofs.map((p) => p.id),
      signalIds: rows.signals.map((s) => s.id), learningIds: rows.learnings.map((l) => l.id),
      opportunityIds: rows.opportunities.map((o) => o.id),
    },
  };
}

/** LEVEL 3 — provincial rollup (children = towns; projections of the same rows). */
export function provinceRollup(ds: PulseDataset, province: string, towns: { id: string; name: string; province: string }[], now: number): PulseNode {
  const pTowns = towns.filter((t) => t.province === province);
  const children = pTowns.map((t) => townRollup(ds, t, now));
  const townIds = new Set(pTowns.map((t) => t.id));
  const rows = {
    signals: ds.signals.filter((r) => townIds.has(r.town_id)),
    works: ds.works.filter((r) => townIds.has(r.town_id)),
    proofs: ds.proofs.filter((r) => townIds.has(r.town_id)),
    learnings: ds.learnings.filter((r) => townIds.has(r.town_id)),
    opportunities: ds.opportunities.filter((r) => townIds.has(r.town_id)),
    memories: ds.memories.filter((m) => m.town_id !== null && townIds.has(m.town_id)),
  };
  const metrics = baseMetrics(rows, now);
  const statements: PulseStatement[] = [];
  if (rows.works.length === 0 && rows.signals.length === 0) {
    statements.push({
      kind: "insufficient_evidence",
      interpretation: `No activity rows in ${province}.`,
      evidence: [], capabilityImplication: null, nextAction: null, owner: null, reviewPoint: null,
      reason: "INSUFFICIENT EVIDENCE: provincial pulse requires at least one work or signal row.",
    });
  } else {
    const activeTowns = children.filter((c) => c.metrics.workOpen + c.metrics.workPublished + c.metrics.signals > 0);
    statements.push({
      kind: "signal",
      interpretation: `${province}: ${activeTowns.length}/${pTowns.length} town(s) active, ${metrics.workPublished} published works, ${metrics.proofsCaptured} proofs.`,
      evidence: rows.works.map((w) => w.id),
      capabilityImplication: activeTowns.length < pTowns.length ? "province has silent towns — capacity gap" : "province-wide rhythm is holding",
      nextAction: activeTowns.length < pTowns.length
        ? { action: "Support silent towns with capacity", owner: "provincial lead", reviewPoint: "next provincial review" }
        : { action: "Sustain and diffuse what works", owner: "provincial lead", reviewPoint: "next provincial review" },
      owner: "provincial lead", reviewPoint: "next provincial review",
    });
  }
  return {
    scope: { kind: "province", id: `province:${province}`, label: province },
    metrics, statements, children,
    evidence: {
      workIds: rows.works.map((w) => w.id), proofIds: rows.proofs.map((p) => p.id),
      signalIds: rows.signals.map((s) => s.id), learningIds: rows.learnings.map((l) => l.id),
      opportunityIds: rows.opportunities.map((o) => o.id),
    },
  };
}

/** LEVEL 4 — national rollup (children = provinces; same rows, one level up). */
export function nationalRollup(ds: PulseDataset, towns: { id: string; name: string; province: string }[], now: number): PulseNode {
  const provinces = Array.from(new Set(towns.map((t) => t.province)));
  const children = provinces.map((p) => provinceRollup(ds, p, towns, now));
  const metrics = baseMetrics(ds, now);
  const statements: PulseStatement[] = [];
  if (ds.works.length === 0 && ds.signals.length === 0) {
    statements.push({
      kind: "insufficient_evidence",
      interpretation: "No national activity rows.",
      evidence: [], capabilityImplication: null, nextAction: null, owner: null, reviewPoint: null,
      reason: "INSUFFICIENT EVIDENCE: national pulse requires activity rows.",
    });
  } else {
    statements.push({
      kind: "signal",
      interpretation: `National: ${metrics.workOpen} open / ${metrics.workPublished} published works, ${metrics.proofsCaptured} proofs, ${metrics.peopleActive} active people, ${children.length} province(s).`,
      evidence: ds.works.map((w) => w.id),
      capabilityImplication: "network capability is measurable from proof + work flow",
      nextAction: { action: "Prioritise provinces with stalled work", owner: "national lead", reviewPoint: "next national review" },
      owner: "national lead", reviewPoint: "next national review",
    });
  }
  return {
    scope: { kind: "national", id: "national", label: "South Africa" },
    metrics, statements, children,
    evidence: {
      workIds: ds.works.map((w) => w.id), proofIds: ds.proofs.map((p) => p.id),
      signalIds: ds.signals.map((s) => s.id), learningIds: ds.learnings.map((l) => l.id),
      opportunityIds: ds.opportunities.map((o) => o.id),
    },
  };
}

/** LEVEL 5 — person/role projection (WHO IS MOVING / WHO NEEDS HELP / WHAT NEXT). */
export interface PersonProjection {
  personId: string;
  moving: boolean;
  needsHelp: boolean;
  statements: PulseStatement[];
  evidence: { workIds: string[]; proofIds: string[] };
}

export function personProjection(ds: PulseDataset, personId: string, now: number): PersonProjection {
  const works = ds.works.filter((w) => w.created_by === personId);
  const proofs = ds.proofs.filter((p) => works.some((w) => w.id === p.work_id));
  const staleW = stale(works, now);
  const published = works.filter((w) => w.status === "published");
  const moving = works.length > 0 && staleW.length === 0;
  const needsHelp = staleW.length > 0;
  const statements: PulseStatement[] = [];

  if (works.length === 0) {
    statements.push({
      kind: "insufficient_evidence",
      interpretation: `No work rows for person ${personId}.`,
      evidence: [], capabilityImplication: null, nextAction: null, owner: null, reviewPoint: null,
      reason: "INSUFFICIENT EVIDENCE: capability cannot be assessed from titles — evidence before title.",
    });
  } else {
    statements.push({
      kind: "signal",
      interpretation: moving
        ? `Person is moving: ${works.length} work item(s), ${published.length} published, ${proofs.length} proofs.`
        : `Person has ${staleW.length} stalled work item(s) of ${works.length}.`,
      evidence: works.map((w) => w.id),
      capabilityImplication: moving ? "demonstrated delivery capability" : "follow-through risk — support needed",
      nextAction: moving
        ? { action: "Offer next opportunity matching proven capability", owner: "town lead", reviewPoint: "next weekly heartbeat" }
        : { action: "Coach on stalled work or reassign scope", owner: "town lead", reviewPoint: "next weekly heartbeat" },
      owner: "town lead", reviewPoint: "next weekly heartbeat",
    });
    if (published.length > 0 && proofs.length === 0) {
      statements.push({
        kind: "signal",
        interpretation: "Published work without captured proof.",
        evidence: published.map((w) => w.id),
        capabilityImplication: "capability is claimed but not yet evidenced",
        nextAction: { action: "Capture proof before capability is credited", owner: "person (self)", reviewPoint: "next proof review" },
        owner: "person (self)", reviewPoint: "next proof review",
      });
    }
  }
  return { personId, moving, needsHelp, statements, evidence: { workIds: works.map((w) => w.id), proofIds: proofs.map((p) => p.id) } };
}
