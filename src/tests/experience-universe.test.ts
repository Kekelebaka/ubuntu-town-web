// src/tests/experience-universe.test.ts — EXPERIENCE 001 acceptance contract.
// The synthetic universe must be evidence-complete: every claim resolves to rows,
// INSUFFICIENT EVIDENCE appears where evidence is missing, ACT stays proposal-only,
// and the ONE derived engine rollup matches the underlying rows.

import { describe, it, expect } from 'vitest';
import {
  PROVINCES, TOWNS, PEOPLE, INITIATIVES, WORK, SIGNALS, PROOFS, LEARNINGS,
  OPPORTUNITIES, OPENING_TILES, townBySlug, initiativeById, personById,
  workById, proofById, learningById, opportunityById,
} from '../lib/experience/universe';
import {
  NATIONAL_STATEMENTS, provinceStatements, townStatements, initiativeStatements,
  personStatements, FLYWHEEL,
} from '../lib/experience/stories';
import { fiveModes, actRows, nationalRollup, universeToDataset, scopeTree } from '../lib/experience/derive';
import { proposeAction } from '../lib/pulse/engine';

/** Every evidence id a statement may cite must resolve to a real synthetic row. */
function resolveEvidence(id: string): boolean {
  return Boolean(workById(id) || proofById(id) || learningById(id) || opportunityById(id) ||
    personById(id) || SIGNALS.find((s) => s.id === id));
}

const ALL_STATEMENTS = [
  ...NATIONAL_STATEMENTS,
  ...PROVINCES.flatMap((p) => provinceStatements(p.slug)),
  ...TOWNS.flatMap((t) => townStatements(t.slug)),
  ...INITIATIVES.flatMap((i) => initiativeStatements(i.id)),
  ...PEOPLE.flatMap((p) => personStatements(p.id)),
  ...FLYWHEEL.map((f) => ({ kind: 'signal', interpretation: f.copy, evidence: f.evidence, capabilityImplication: null, nextAction: null, owner: null, reviewPoint: null })),
];

describe('experience 001 — evidence integrity', () => {
  it('every statement evidence id resolves to a real synthetic row', () => {
    for (const st of ALL_STATEMENTS) {
      for (const id of st.evidence) {
        expect(resolveEvidence(id), `unresolvable evidence id ${id} in: ${st.interpretation}`).toBe(true);
      }
    }
  });

  it('every opening tile links to a real route and real evidence', () => {
    for (const t of OPENING_TILES) {
      expect(t.href.startsWith('/os/')).toBe(true);
      for (const id of t.evidence) expect(resolveEvidence(id), t.key).toBe(true);
    }
  });

  it('SCENARIO COVERAGE — A–G all represented by rows', () => {
    // A momentum (FrameSouth) · B capacity (FixEasy) · C proof gap (Care) ·
    // D high-potential builder (Palesa) · E leadership mismatch (Sipho) ·
    // F stalled (Trade Bridge) · G emerging opportunity (Market Link)
    expect(workById('syn-work-102')?.status).toBe('published'); // A
    expect(initiativeById('syn-init-fixeasy-senekal')!.supply.required - initiativeById('syn-init-fixeasy-senekal')!.supply.verified).toBe(13); // B
    expect(PROOFS.filter((p) => p.town === 'bushbuckridge' && p.state === 'verified').length).toBeLessThan(3); // C
    expect(personById('syn-person-palesa')?.nextCapability).toBeTruthy(); // D
    expect(personStatements('syn-person-sipho').some((s) => s.kind === 'insufficient_evidence')).toBe(true); // E
    expect(WORK.filter((w) => w.town === 'mthatha' && w.status === 'draft').length).toBeGreaterThanOrEqual(2); // F (blocked)
    expect(opportunityById('syn-opp-901')?.status).toBe('open'); // G
  });

  it('INSUFFICIENT EVIDENCE is a visible feature where claims cannot be supported', () => {
    expect(NATIONAL_STATEMENTS.some((s) => s.kind === 'insufficient_evidence')).toBe(true);
    expect(initiativeStatements('syn-init-tradebridge-mthatha').some((s) => s.kind === 'insufficient_evidence')).toBe(true);
    // A town with no rows must say so honestly:
    const empty = townStatements('de-aar');
    expect(empty.every((s) => s.kind === 'insufficient_evidence')).toBe(true);
  });

  it('ACT contract: proposals carry owner/rationale/evidence/review and never execute', () => {
    const rows = actRows(NATIONAL_STATEMENTS.concat(initiativeStatements('syn-init-fixeasy-senekal')));
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.owner).toBeTruthy();
      expect(r.rationale).toBeTruthy();
      expect(r.evidence.length).toBeGreaterThan(0);
      expect(r.reviewPoint).toBeTruthy();
      expect(r.approvalStatus).toBe('PROPOSED — PENDING HUMAN APPROVAL');
    }
  });

  it('scope guard: proposals cannot cross scope (actionProposal fails closed)', () => {
    // A SENEGAL-SCOPED coordinator must not be able to propose into Soweto.
    const tree = scopeTree();
    const senekalCoordinator = {
      userId: 'demo-coordinator',
      assignments: [{ user_id: 'demo-coordinator', role_key: 'coordinator', town_id: 'senekal' }],
    } as Parameters<typeof proposeAction>[0];
    const inScope = proposeAction(senekalCoordinator, tree, 'town:senekal', 'Run an artisan verification mission', Date.now());
    expect(inScope.status).toBe('proposed');
    const crossScope = proposeAction(senekalCoordinator, tree, 'town:soweto', 'Run an artisan verification mission', Date.now());
    expect(crossScope.status).toBe('denied');
  });

  it('the ONE derived engine rollup matches the underlying rows', () => {
    const rollup = nationalRollup();
    const ds = universeToDataset();
    expect(rollup.metrics.workOpen + rollup.metrics.workPublished).toBe(
      ds.works.filter((w) => w.status !== 'rejected').length,
    );
    expect(rollup.metrics.proofsCaptured).toBe(ds.proofs.filter((p) => p.state !== 'disputed').length);
  });

  it('navigation model: 50 Blueprint towns across 9 provinces (navigation model only, G4 unresolved)', () => {
    expect(TOWNS.length).toBe(50);
    expect(PROVINCES.length).toBe(9);
    for (const t of TOWNS) expect(townBySlug(t.slug)?.province).toBeTruthy();
  });

  it('every work/proof/learning/opportunity row is reachable by id helpers', () => {
    for (const w of WORK) expect(workById(w.id)?.id).toBe(w.id);
    for (const p of PROOFS) expect(proofById(p.id)?.id).toBe(p.id);
    for (const l of LEARNINGS) expect(learningById(l.id)?.id).toBe(l.id);
    for (const o of OPPORTUNITIES) expect(opportunityById(o.id)?.id).toBe(o.id);
  });

  it('five modes project over every statement set without inventing claims', () => {
    const modes = fiveModes(NATIONAL_STATEMENTS);
    expect(modes.OBSERVE.length).toBeGreaterThan(0);
    expect(modes.CHALLENGE.length).toBeGreaterThan(0);
    for (const line of [...modes.OBSERVE, ...modes.EXPLAIN, ...modes.CHALLENGE, ...modes.COACH]) {
      expect(line.length).toBeGreaterThan(10);
    }
  });
});
