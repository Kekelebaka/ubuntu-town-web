// src/tests/experience-002.test.ts — EXPERIENCE 002 truth contract.
// Real-data experience: no fabrication, honest access states, roster discipline.

import { describe, it, expect } from 'vitest';
import { provinceGroups, provinceSlug, geographyDeltas, coverage, nationalStatements, townStatements } from '@/lib/e002/real';

// Fixtures are TEST-ONLY row shapes; they are never rendered and never presented as real.
const towns = [
  { id: 'uto-town-a', name: 'Alpha', slug: 'alpha', province: 'Free State', status: 'launch', recruitment_status: 'strong', applicant_count: 2, is_founding: true, public_self_approve: true, opportunity_notes: 'Media', population_estimate: 100, archetype: null, municipality_id: null, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-10-05T00:00:00Z' },
  { id: 'uto-town-b', name: 'Beta', slug: 'beta', province: 'Free State', status: 'recruit', recruitment_status: 'recruit', applicant_count: 0, is_founding: false, public_self_approve: false, opportunity_notes: null, population_estimate: null, archetype: null, municipality_id: null, created_at: '2026-09-20T00:00:00Z', updated_at: '2026-09-20T00:00:00Z' },
  { id: 'uto-town-c', name: 'Gamma', slug: 'gamma', province: 'Gauteng', status: 'pilot', recruitment_status: 'applicant', applicant_count: 1, is_founding: true, public_self_approve: false, opportunity_notes: 'Tourism', population_estimate: 50, archetype: null, municipality_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

describe('E002 geography derivations are honest', () => {
  it('groups canonical rows by province without inventing grouping', () => {
    const groups = provinceGroups(towns);
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.province === 'Free State')!.towns).toHaveLength(2);
  });
  it('slugs provinces deterministically', () => {
    expect(provinceSlug('Free State')).toBe('free-state');
    expect(provinceSlug('KwaZulu-Natal')).toBe('kwazulu-natal');
  });
  it('computes geography deltas only from real timestamps — never a baseline', () => {
    const d = geographyDeltas(towns, 30, Date.parse('2026-10-11T00:00:00Z'));
    expect(d.created.map((t) => t.id)).toEqual(['uto-town-b']);
    expect(d.updated.map((t) => t.id)).toEqual(['uto-town-a']);
  });
});

describe('E002 access states never conflate', () => {
  it('distinguishes PROTECTED (records not accessible) from NO RECORDS (absent)', () => {
    const c = coverage();
    const proof = c.find((x) => x.layer === 'PROOF')!;
    const learnings = c.find((x) => x.layer === 'LEARNINGS')!;
    expect(proof.state).toBe('PROTECTED');
    expect(proof.note).toMatch(/exist in the canonical system/);
    expect(learnings.state).toBe('NO RECORDS');
    expect(learnings.note).toMatch(/absent from the canonical schema/);
  });
  it('never claims protected layers are empty', () => {
    for (const item of coverage()) {
      expect(item.note).not.toMatch(/there are no/i);
    }
  });
});

describe('E002 statements obey the epistemic contract', () => {
  it('national statements are COMPUTED with row evidence, or INSUFFICIENT EVIDENCE', () => {
    for (const s of nationalStatements(towns)) {
      expect(['computed', 'insufficient_evidence', 'insufficient_access']).toContain(s.kind);
      if (s.kind === 'computed') expect(s.evidence.length).toBeGreaterThan(0);
    }
  });
  it('town statements carry the row id as evidence and flag operational limits', () => {
    const st = townStatements(towns[0]);
    expect(st[0].evidence).toContain('uto-town-a');
    expect(st.some((s) => s.kind === 'insufficient_access')).toBe(true);
    for (const s of st) {
      expect(s.text).not.toMatch(/I noticed/i); // trigger law
    }
  });
  it('roster language: is_founding is never presented as the approved Blueprint cohort', () => {
    const all = JSON.stringify(nationalStatements(towns));
    expect(all).toMatch(/unverified/);
  });
});
