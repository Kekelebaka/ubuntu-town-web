// src/tests/blueprint-roster.test.ts — PHASE 1 LAW: portfolio lock + roster authority.
// The three removed initiatives can never be active. The 50-town roster is strategic geography.
// The is_founding flag is explicitly NOT the roster (C-05).

import { describe, it, expect } from 'vitest';
import { BLUEPRINT_ROSTER, ROSTER_COUNT, ROSTER_PROVINCES, isBlueprintTown, rosterTown, rosterByProvince, cohortStamp, strategicGeography } from '@/lib/e003/roster';
import { CANONICAL_TEN, REMOVED_FROM_PORTFOLIO, DATABASE_ONLY_ROWS } from '@/lib/e003/registry';
import * as registry from '@/lib/e003/registry';

describe('PHASE 1 portfolio lock', () => {
  it('the removed trio is flagged removed and can never be canonical', () => {
    const removedKeys = REMOVED_FROM_PORTFOLIO.map((r) => r.key);
    expect(removedKeys.sort()).toEqual(['ecochar', 'job-fixer', 'ubuntu-academy']);
    for (const r of REMOVED_FROM_PORTFOLIO) expect(r.note).toContain('REMOVED FROM ACTIVE PORTFOLIO');
    for (const key of removedKeys) expect(registry.initiativeByKey(key)).toBeUndefined();
    // and they are not among the active/database-only lists presented as active
    const activeNames = JSON.stringify(CANONICAL_TEN) + JSON.stringify(DATABASE_ONLY_ROWS);
    expect(activeNames).not.toContain('Job Fixer');
    expect(activeNames).not.toContain('Ubuntu Academy');
    expect(activeNames).not.toContain('EcoChar');
  });
  it('the canonical ten stay exactly ten, unchanged by the removal', () => {
    expect(CANONICAL_TEN).toHaveLength(10);
  });
});

describe('PHASE 1 roster authority', () => {
  it('is exactly 50 towns across 9 provinces, versioned and machine-readable', () => {
    expect(ROSTER_COUNT).toBe(50);
    expect(ROSTER_PROVINCES).toHaveLength(9);
    expect(BLUEPRINT_ROSTER.version).toBeTruthy();
    expect(BLUEPRINT_ROSTER.towns.every((t) => t.slug && t.province && t.canonical_row_id)).toBe(true);
  });
  it('resolves cohort membership by slug and name', () => {
    expect(isBlueprintTown('senekal')).toBe(true);
    expect(rosterTown('Senekal')!.province).toBe('Free State');
    expect(isBlueprintTown('not-a-town')).toBe(false);
    const fs = rosterByProvince('Free State');
    expect(fs.length).toBeGreaterThan(0);
    expect(fs.every((t) => t.province === 'Free State')).toBe(true);
  });
  it('stamps towns honestly: in-cohort vs database row outside', () => {
    expect(cohortStamp('senekal').inCohort).toBe(true);
    const out = cohortStamp('not-a-town');
    expect(out.inCohort).toBe(false);
    expect(out.label).toContain('OUTSIDE THE BLUEPRINT COHORT');
  });
  it('the founding flag is explicitly not the roster (C-05 documented)', () => {
    const prov = JSON.stringify(BLUEPRINT_ROSTER);
    expect(prov).toContain('26');
    expect(prov).toContain('NOT THE ROSTER');
    expect(strategicGeography().ratificationStatus).toContain('PENDING HUMAN RATIFICATION');
    expect(strategicGeography().cohortNote).toContain('never conflated');
  });
  it('every roster province distributes to exactly 50 towns total', () => {
    const total = ROSTER_PROVINCES.reduce((n, p) => n + rosterByProvince(p).length, 0);
    expect(total).toBe(50);
  });
});
