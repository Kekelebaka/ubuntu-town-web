// src/lib/e003/os.ts — EXPERIENCE 003 operating composition layer.
// Composes REAL sources into operating objects. Every claim carries a class.
// REAL · COMPUTED · DERIVED · AUTHORED · SYNTHETIC · INSUFFICIENT EVIDENCE · RECORDS NOT
// ACCESSIBLE · ABSENT · ZERO (ZERO only when evidenced).
// Reuses E002's read-only public fetchers (one data path, no duplication).

import { getCanonicalTowns, provinceGroups, provinceSlug, geographyDeltas, type CanonicalTown } from '@/lib/e002/real';
import { packForTown, packProvenance, type FieldPack } from './field-intelligence/packs';
import { CANONICAL_TEN, initiativeByKey, RECONCILIATION_SUMMARY, type CanonicalInitiative, type ReconciliationState } from './registry';

export type Claim = 'REAL' | 'COMPUTED' | 'DERIVED' | 'AUTHORED' | 'INFERRED' | 'INSUFFICIENT EVIDENCE' | 'RECORDS NOT ACCESSIBLE' | 'ABSENT' | 'ZERO';
export type StatementKind = 'computed' | 'inferred' | 'authored' | 'insufficient_evidence' | 'records_not_accessible' | 'absent';

export interface OSStatement {
  kind: StatementKind;
  text: string;
  evidence: string[];
  reasoning?: string;
  limitation?: string;
  recommendation?: string;
}

export interface MetricContract {
  value: string;
  name: string;
  formula: string;
  numerator?: string;
  denominator?: string;
  window: string;
  scope: string;
  source: string;
  interpretation: string;
  limitation: string;
}

// ---------- Town × Initiative deployment cell (the core operating object) ----------

export interface DeploymentCell {
  town: CanonicalTown;
  initiative: CanonicalInitiative;
  pack?: FieldPack;
  owner: { display: string; placeholder: true; real_person: false; appointment_status: 'VACANT' };
  status: { value: 'NOT DEPLOYED'; claim: 'RECORDS NOT ACCESSIBLE'; note: string };
  demand: { claim: 'DERIVED' | 'INSUFFICIENT EVIDENCE'; domains: FieldPack['opportunity_domains']; note: string };
  capacity: { claim: 'INSUFFICIENT EVIDENCE'; note: string };
  work: { claim: 'DERIVED' | 'RECORDS NOT ACCESSIBLE'; recommended: FieldPack['recommended_workpacks']; assignedNote: string };
  proof: { claim: 'RECORDS NOT ACCESSIBLE'; required: string[]; note: string };
  learning: { claim: 'ABSENT' | 'RECORDS NOT ACCESSIBLE'; note: string };
  economics: { claim: 'NOT YET MEASURED'; note: string };
  nextActions: { claim: 'DERIVED'; items: string[]; source: string };
  risks: { claim: 'DERIVED' | 'INSUFFICIENT EVIDENCE'; items: unknown[]; note: string };
}

export function buildCell(town: CanonicalTown, initiativeKey: string): DeploymentCell {
  const initiative = initiativeByKey(initiativeKey)!;
  const pack = packForTown(town.name);
  const owner = {
    display: initiative.key === 'fixeasy' || initiative.key === 'kasibuy' || initiative.key === 'framesouth' || initiative.key === 'orbit-music' || initiative.key === 'ai-cafe' || initiative.key === 'family-house'
      ? 'Ubuntu — Interim Initiative Head · OWNER REQUIRED'
      : 'Ubuntu — Interim Town Coordinator · OWNER REQUIRED',
    placeholder: true as const, real_person: false as const, appointment_status: 'VACANT' as const,
  };
  return {
    town, initiative, pack,
    owner,
    status: {
      value: 'NOT DEPLOYED',
      claim: 'RECORDS NOT ACCESSIBLE',
      note: 'Deployment records are not accessible to this experience. This cell is not presented as deployed, planned or zero — the state is genuinely unknown here.',
    },
    demand: pack
      ? { claim: 'DERIVED', domains: pack.opportunity_domains, note: `Field intelligence (${packProvenance(pack)}): ${pack.local_economy_summary}` }
      : { claim: 'INSUFFICIENT EVIDENCE', domains: [], note: 'No field intelligence pack exists for this town. Demand cannot be assessed here.' },
    capacity: { claim: 'INSUFFICIENT EVIDENCE', note: 'Verified capacity requires accessible people/role records — RECORDS NOT ACCESSIBLE. No capacity number is manufactured.' },
    work: pack
      ? {
          claim: 'DERIVED',
          recommended: pack.recommended_workpacks,
          assignedNote: 'Work assigned to a person: RECORDS NOT ACCESSIBLE (work records protected).',
        }
      : { claim: 'RECORDS NOT ACCESSIBLE', recommended: [], assignedNote: 'No field intelligence and no accessible work records for this cell.' },
    proof: {
      claim: 'RECORDS NOT ACCESSIBLE',
      required: pack ? pack.recommended_workpacks.flatMap((w) => w.proof_required) : [],
      note: 'Captured proofs: RECORDS NOT ACCESSIBLE (proof records protected). Proof requirements listed are the field intelligence’s stated standards — not captured evidence.',
    },
    learning: { claim: 'ABSENT', note: 'No learning records found — the learnings object is absent from the canonical schema (verified). Not zero: ABSENT.' },
    economics: { claim: 'NOT YET MEASURED', note: 'No economic records are available for this cell. GMV / revenue / cost / contribution are NOT YET MEASURED — never rendered as 0.' },
    nextActions: {
      claim: 'DERIVED',
      items: pack ? pack.first_3_actions : [],
      source: pack ? `Field intelligence ${packProvenance(pack)} · review_required: ${pack.review_required ? 'true' : 'false'}` : 'No field intelligence',
    },
    risks: pack
      ? { claim: 'DERIVED', items: pack.risk_flags, note: pack.risk_flags.length ? 'Risk flags from field intelligence.' : 'Field intelligence records no risk flags for this town (empty list — evidenced zero).' }
      : { claim: 'INSUFFICIENT EVIDENCE', items: [], note: 'No risk evidence available.' },
  };
}

export function cellMetrics(cell: DeploymentCell): MetricContract[] {
  const pack = cell.pack;
  return [
    {
      value: pack ? String(pack.opportunity_domains.length) : '—',
      name: 'Opportunity domains (evidenced)',
      formula: 'count of opportunity domains recorded in the town field-intelligence pack',
      window: `pack generated ${pack ? pack.generated_at.slice(0, 10) : 'n/a'}`,
      scope: `${cell.town.name} × ${cell.initiative.name}`,
      source: pack ? pack.pack_id : 'no pack',
      interpretation: 'Research-recorded opportunity areas — context, not verified demand.',
      limitation: 'Field research artefacts carry their own confidence and review_required state; not operational records.',
    },
    {
      value: 'NOT YET MEASURED',
      name: 'Economics (GMV / revenue / contribution)',
      formula: 'requires ratified economic records',
      window: '—', scope: `${cell.town.name} × ${cell.initiative.name}`,
      source: 'none accessible',
      interpretation: 'The system refuses to manufacture economic values.',
      limitation: 'NOT YET MEASURED is not zero. Measurement requires accessible economic records (G3-gated schema).',
    },
  ];
}

// ---------- My Work: REAL derivable work queue ----------

export interface WorkQueueItem {
  id: string;
  what: string;
  why: string;
  owner: { display: string; placeholder: true; real_person: false };
  context: { town: string; initiative?: string };
  evidence: string[];
  nextAction: string;
  claim: 'DERIVED';
  source: string;
}

export function derivedWorkQueue(towns: CanonicalTown[]): WorkQueueItem[] {
  const items: WorkQueueItem[] = [];
  for (const town of towns) {
    const pack = packForTown(town.name);
    if (!pack) continue;
    pack.recommended_workpacks.forEach((w, i) => {
      items.push({
        id: `${pack.pack_id}:${w.workpack_id}`,
        what: w.title,
        why: w.why_this_town,
        owner: { display: 'Ubuntu — Interim Town Coordinator · OWNER REQUIRED', placeholder: true, real_person: false },
        context: { town: town.name },
        evidence: w.proof_required,
        nextAction: pack.first_3_actions[i] ?? pack.first_3_actions[0] ?? 'Define first action with the town coordinator.',
        claim: 'DERIVED',
        source: `Field intelligence ${pack.pack_id} · priority ${w.priority}`,
      });
    });
  }
  return items;
}

// ---------- National / portfolio intelligence ----------

export function nationalStatements(towns: CanonicalTown[]): OSStatement[] {
  const provinces = provinceGroups(towns);
  const founding = towns.filter((t) => t.is_founding).length;
  const withPacks = towns.filter((t) => packForTown(t.name)).length;
  return [
    {
      kind: 'computed',
      text: `The network is represented by ${towns.length} canonical database town rows across ${provinces.length} provinces — the Blueprint cohort is 50 towns, a distinct designation.`,
      evidence: ['uto.towns (live read)', 'Blueprint cohort law'],
      reasoning: 'Row count and province grouping computed from the canonical geography source.',
      limitation: 'CANONICAL BLUEPRINT (50) ≠ CANONICAL DATABASE (81 rows) ≠ OPERATIONAL COVERAGE. The three are never conflated.',
    },
    {
      kind: 'computed',
      text: `${RECONCILIATION_SUMMARY.linked} of the 10 canonical initiatives have a linked database record; ${RECONCILIATION_SUMMARY.possibleUnresolved} possible match is unresolved; ${RECONCILIATION_SUMMARY.dbAbsent} are database-absent; ${RECONCILIATION_SUMMARY.dbOnly} database rows are portfolio-unreconciled.`,
      evidence: ['public.initiatives (live read)', 'Canonical registry (Blueprint)'],
      reasoning: 'Registry reconciliation classification per the data law.',
      limitation: 'This is a governance state, not a defect count. Human decision required (C-01).',
      recommendation: 'Ratify the portfolio reconciliation: resolve Daycare/DaycareOS and Ubuntu Socials/Buntu Bar, and decide the fate of the database-only rows.',
    },
    {
      kind: 'computed',
      text: `${founding} canonical rows carry the is_founding flag, and ${withPacks} towns carry field-intelligence packs.`,
      evidence: ['uto.towns.is_founding', 'field-intelligence packs (v1 exports)'],
      reasoning: 'Counts of flagged rows and available packs.',
      limitation: 'The is_founding flag derives from the Founding-50 reconciliation migration — it is NOT the ratified Blueprint roster (ratification pending).',
    },
    {
      kind: 'insufficient_evidence',
      text: 'Operational movement — activity, proof, people, economics — cannot be evaluated from geography and portfolio definition alone.',
      evidence: [],
      limitation: 'Operational records are protected (RECORDS NOT ACCESSIBLE). No trend is manufactured.',
    },
  ];
}

export function townStatements(town: CanonicalTown, pack?: FieldPack): OSStatement[] {
  const st: OSStatement[] = [
    {
      kind: 'computed',
      text: `${town.name} is a canonical database record in ${town.province}, status "${town.status ?? 'unset'}", recruitment "${town.recruitment_status ?? 'unset'}".`,
      evidence: [town.id, 'uto.towns'],
      reasoning: 'Direct read of the canonical town record.',
      limitation: 'Record status describes the record, not operational activity.',
    },
  ];
  if (pack) {
    st.push({
      kind: 'authored',
      text: `Field intelligence (${pack.pack_id}) records ${pack.opportunity_domains.length} opportunity domains and recommends ${pack.recommended_workpacks.length} workpacks for this town.`,
      evidence: [packProvenance(pack)],
      reasoning: 'Research artefact summary — authored intelligence, carrying its own confidence and review state.',
      limitation: `review_required: ${pack.review_required ? 'true' : 'false'}. Field intelligence is not operational truth.`,
    });
  } else {
    st.push({
      kind: 'insufficient_evidence',
      text: 'No field intelligence exists for this town — demand, work and risk cannot be assessed here.',
      evidence: [],
      limitation: 'Absence of research artefacts, not absence of opportunity.',
    });
  }
  st.push({
    kind: 'records_not_accessible',
    text: 'Work, proof, people and economics for this town are protected records — they exist in the canonical system and are not available to this experience.',
    evidence: [],
    limitation: 'Never rendered as zero. Authorised operational access would unlock these layers.',
  });
  return st;
}

export function initiativeStatements(i: CanonicalInitiative): OSStatement[] {
  return [
    {
      kind: i.purpose ? 'authored' : 'insufficient_evidence',
      text: i.purpose
        ? `${i.name}: ${i.purpose}`
        : `${i.name}: the canonical Blueprint purpose text is not materialized in this estate — it is not invented here.`,
      evidence: i.purposeSource === 'SUPABASE DESCRIPTION' ? [`public.initiatives/${i.dbKey}`] : ['Blueprint registry'],
      reasoning: i.purpose ? 'Purpose sourced from the linked catalog description; canonical wording pending Blueprint source.' : 'Honest absence.',
      limitation: 'PURPOSE will be replaced by exact Blueprint text at ratification — never rewritten into marketing copy.',
    },
    {
      kind: 'computed',
      text: `Portfolio reconciliation: ${i.reconciliation}.`,
      evidence: ['Canonical registry', 'public.initiatives (live read)'],
      reasoning: i.reconciliationNote,
      limitation: 'A Supabase row does not become an approved initiative merely because it exists. Contradictions are marked, never silently reconciled.',
    },
    {
      kind: 'records_not_accessible',
      text: 'Ownership, deployments, work, proof and economics for this initiative are protected records.',
      evidence: [],
      limitation: 'Ownership displays as an interim placeholder where unconfirmed — never an invented person.',
    },
  ];
}

export { getCanonicalTowns, provinceGroups, provinceSlug, geographyDeltas };
export type { CanonicalTown };
