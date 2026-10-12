// src/tests/experience-003.test.ts — EXPERIENCE 003 data-law contract.
// Blueprint is portfolio authority. Contradictions are marked, never reconciled.
// Placeholders are vacancy objects. Protected ≠ zero. Metrics carry contracts.

import { describe, it, expect } from 'vitest';
import { CANONICAL_TEN, DATABASE_ONLY_ROWS, RECONCILIATION_SUMMARY, initiativeByKey } from '@/lib/e003/registry';
import { buildCell, cellMetrics, derivedWorkQueue, nationalStatements } from '@/lib/e003/os';
import { FIELD_PACKS, packForTown, packProvenance } from '@/lib/e003/field-intelligence/packs';

const towns = [
  { id: 'uto-town-senekal', name: 'Senekal', slug: 'senekal', province: 'Free State', status: 'launch', recruitment_status: 'strong', applicant_count: 2, is_founding: false, public_self_approve: true, opportunity_notes: 'Inside.Town Media', population_estimate: null, archetype: null, municipality_id: null, created_at: '2026-07-05T12:17:46Z', updated_at: '2026-08-17T14:44:22Z' },
  { id: 'uto-town-x', name: 'NoPackTown', slug: 'nopacktown', province: 'Gauteng', status: 'recruit', recruitment_status: 'recruit', applicant_count: 0, is_founding: true, public_self_approve: false, opportunity_notes: null, population_estimate: null, archetype: null, municipality_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

describe('E003 canonical portfolio law', () => {
  it('holds exactly the ten canonical initiatives with exact names', () => {
    expect(CANONICAL_TEN.map((c) => c.name)).toEqual([
      'Daycare', 'Family House', 'FrameSouth', 'KasiBuy', 'InsideTown',
      'Orbit Music', 'FixEasy', 'AI Cafe', 'Ubuntu Socials', 'Jeff',
    ]);
    expect(CANONICAL_TEN).toHaveLength(10);
  });
  it('never fabricates purpose text — unmaterialized purposes are honestly null', () => {
    for (const c of CANONICAL_TEN) {
      if (c.purposeSource === 'NOT MATERIALIZED') expect(c.purpose).toBeNull();
    }
  });
  it('marks contradictions instead of reconciling: every non-linked state is explicit', () => {
    const unresolved = CANONICAL_TEN.filter((c) => c.reconciliation === 'POSSIBLE BLUEPRINT MATCH — UNRESOLVED');
    const absent = CANONICAL_TEN.filter((c) => c.reconciliation === 'BLUEPRINT INITIATIVE — DATABASE RECORD ABSENT');
    expect(unresolved.length).toBeGreaterThan(0);
    expect(absent.length).toBeGreaterThan(0);
    for (const c of [...unresolved, ...absent]) expect(c.reconciliationNote.toLowerCase()).toMatch(/not fabricated|not invented|pending|decision required|requires the blueprint/);
  });
  it('keeps database-only rows out of the canonical ten', () => {
    const canonicalKeys = new Set(CANONICAL_TEN.map((c) => c.key));
    const canonicalNames = new Set(CANONICAL_TEN.map((c) => c.name));
    for (const r of DATABASE_ONLY_ROWS) {
      expect(canonicalKeys.has(r.key)).toBe(false);
      expect(canonicalNames.has(r.name)).toBe(false);
    }
  });
  it('forbids synthetic prototype initiatives from ever appearing canonically', () => {
    const names = JSON.stringify(CANONICAL_TEN);
    for (const banned of ['Green Streets', 'Trade Bridge', 'Care Collective', 'Market Link']) {
      expect(names).not.toContain(banned);
    }
  });
});

describe('E003 deployment cell honesty', () => {
  it('renders unfilled ownership as a vacancy object, never a fake person', () => {
    const cell = buildCell(towns[0], 'fixeasy');
    expect(cell.owner.placeholder).toBe(true);
    expect(cell.owner.real_person).toBe(false);
    expect(cell.owner.appointment_status).toBe('VACANT');
    expect(cell.owner.display).toMatch(/OWNER REQUIRED/);
  });
  it('never presents the cell as deployed or zero', () => {
    const cell = buildCell(towns[0], 'fixeasy');
    expect(cell.status.value).toBe('NOT DEPLOYED');
    expect(cell.status.claim).toBe('RECORDS NOT ACCESSIBLE');
    expect(cell.economics.claim).toBe('NOT YET MEASURED');
    expect(cell.learning.claim).toBe('ABSENT');
  });
  it('derives demand/next actions only from real field intelligence', () => {
    const withPack = buildCell(towns[0], 'fixeasy');
    const noPack = buildCell(towns[1], 'fixeasy');
    expect(withPack.demand.claim).toBe('DERIVED');
    expect(withPack.nextActions.items.length).toBeGreaterThan(0);
    expect(noPack.demand.claim).toBe('INSUFFICIENT EVIDENCE');
    expect(noPack.nextActions.items).toHaveLength(0);
  });
  it('metric contracts carry formula, window, scope, source, interpretation, limitation', () => {
    for (const m of cellMetrics(buildCell(towns[0], 'fixeasy'))) {
      for (const field of ['name', 'formula', 'window', 'scope', 'source', 'interpretation', 'limitation'] as const) {
        expect(m[field]).toBeTruthy();
      }
    }
  });
});

describe('E003 work queue and statements', () => {
  it('derives work items from real packs with proof standards', () => {
    const q = derivedWorkQueue(towns);
    expect(q.length).toBeGreaterThan(0);
    for (const w of q) {
      expect(w.claim).toBe('DERIVED');
      expect(w.source).toMatch(/Field intelligence/);
      expect(w.owner.placeholder).toBe(true);
    }
  });
  it('statements never use "I noticed" and stay inside the epistemic classes', () => {
    for (const s of nationalStatements(towns)) {
      expect(['computed', 'insufficient_evidence', 'records_not_accessible', 'authored', 'inferred']).toContain(s.kind);
      expect(s.text).not.toMatch(/I noticed/i);
    }
  });
  it('town law language survives: blueprint cohort never equals database rows', () => {
    const all = JSON.stringify(nationalStatements(towns));
    expect(all).toMatch(/never conflated/);
    expect(all).toMatch(/ratification/i);
  });
});

describe('E003 field intelligence provenance', () => {
  it('every pack keeps its provenance and review state — gaps are flagged, never rewritten', () => {
    for (const p of FIELD_PACKS) {
      expect(p.town).toBeTruthy();
      expect(typeof p.review_required).toBe('boolean');
      expect(packProvenance(p)).toBeTruthy();
    }
    // Source-data quirk (real): the Rustenburg export has empty pack_id/generated_at —
    // the helper must FLAG it, not paper over it.
    const rustenburg = packForTown('Rustenburg')!;
    expect(rustenburg.pack_id).toBe('');
    expect(packProvenance(rustenburg)).toContain('missing');
    expect(packForTown('Senekal')!.pack_id).toContain('Senekal');
    expect(packForTown('NoSuchTown')).toBeUndefined();
  });
  it('registry links initiative keys to the cell builder', () => {
    expect(initiativeByKey('fixeasy')!.name).toBe('FixEasy');
    expect(initiativeByKey('bogus')).toBeUndefined();
    expect(RECONCILIATION_SUMMARY.canonicalTotal).toBe(10);
    expect(RECONCILIATION_SUMMARY.dbCatalogRows).toBe(12);
  });
});
