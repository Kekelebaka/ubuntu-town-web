// src/tests/experience-004-loop.test.ts — E004 operating-loop law.
// Terminology resolved at the experience layer; deltas never manufactured; the loop is honest.

import { describe, it, expect } from 'vitest';
import { allWorkItems, workItemById, signalsForTown, whatChanged, MISSION_TERMINOLOGY_NOTE, LEARNING_LOOP_NOTE } from '@/lib/e003/loop';
import { derivedWorkQueue } from '@/lib/e003/os';

const towns = [
  { name: 'Senekal', slug: 'senekal', opportunity_notes: 'Inside.Town Media + Local Business & SMM', updated_at: new Date().toISOString() },
  { name: 'NoPackTown', slug: 'nopacktown', opportunity_notes: null, updated_at: '2020-01-01T00:00:00Z' },
] as any;

describe('E004 work item loop', () => {
  const items = allWorkItems(towns, derivedWorkQueue(towns));
  it('resolves stable ids and full loop classes', () => {
    expect(items.length).toBeGreaterThan(0);
    for (const i of items) {
      expect(i.id).toMatch(/^[a-z0-9-]+$/);
      expect(['DERIVED', 'AUTHORED']).toContain(i.loop.signal.claim);
      expect(i.loop.mission.claim).toBe('PROPOSED');
      expect(i.loop.proof.claim).toBe('STANDARDS ONLY');
      expect(i.loop.learning.claim).toBe('ABSENT');
      expect(i.loop.nextMission.claim).toBe('PROPOSED');
      expect(i.due.claim).toBe('RECORDS NOT ACCESSIBLE');
    }
    expect(workItemById(items, items[0].id)).toBeDefined();
    expect(workItemById(items, 'bogus-id')).toBeUndefined();
  });
  it('never claims assignment or completion for derived work', () => {
    for (const i of allWorkItems(towns, derivedWorkQueue(towns))) {
      expect(i.owner.placeholder).toBe(true);
      expect(i.owner.real_person).toBe(false);
      expect(i.evidence.captured.claim).toBe('RECORDS NOT ACCESSIBLE');
    }
  });
});

describe('E004 signals and change', () => {
  it('real notes are REAL, research domains are DERIVED — never mixed', () => {
    const s = signalsForTown(towns[0]);
    expect(s.some((x) => x.class === 'REAL' && x.source.includes('opportunity_notes'))).toBe(true);
    expect(s.some((x) => x.class === 'DERIVED')).toBe(true);
    expect(signalsForTown(towns[1])).toHaveLength(0);
  });
  it('what-changed counts real touches and refuses to manufacture deltas', () => {
    const changed = whatChanged(towns, 30);
    expect(changed.items.length).toBe(1); // only the freshly-touched town
    expect(changed.note).toContain('CHANGE HISTORY NOT YET AVAILABLE');
    expect(changed.note).toContain('will not manufacture a delta');
  });
});

describe('E004 terminology + learning honesty', () => {
  it('D-01 resolution is documented, schema language preserved', () => {
    expect(MISSION_TERMINOLOGY_NOTE).toContain('CAMPAIGN TARGETS');
    expect(MISSION_TERMINOLOGY_NOTE).toContain('schema is untouched');
    expect(LEARNING_LOOP_NOTE).toContain('ABSENT');
  });
});
