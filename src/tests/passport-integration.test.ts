// passport-integration.test.ts — TOWN PASSPORT INTEGRATION validation matrix.
// Validates: town/province/national rollups · permissions · scope · evidence · provenance ·
// freshness · versioning · failure states · NO fabricated fallback data.

import { describe, expect, it } from 'vitest';
import snapshotJson from '@/data/intelligence/passport-snapshot.json';
import { loadIntelligence, loadTown, loadProvince, loadNational, FRESHNESS_BUDGET_DAYS } from '@/lib/passport/repository';
import { interpretTown } from '@/lib/passport/interpretation';
import { validateRollupConsistency, rollupNational, rollupProvince, dataStateLine } from '@/lib/passport/rollups';
import { isPublicPath, requiresAuth } from '@/lib/route-guard';
import type { PassportSnapshot, TownPassportView } from '@/lib/passport/types';

const snapshot = snapshotJson as unknown as PassportSnapshot;

describe('Passport integration — data states (failure states, no fabrication)', () => {
  it('default load is SNAPSHOT with an explicit state note', async () => {
    const res = await loadIntelligence();
    expect(res.state).toBe('SNAPSHOT');
    expect(res.state_note).toContain('snapshot');
    expect(res.data).not.toBeNull();
  });

  it('stale snapshot is labelled STALE — content unchanged, never altered', async () => {
    const later = new Date(Date.now() + (FRESHNESS_BUDGET_DAYS + 10) * 86_400_000);
    const res = await loadIntelligence({ now: later });
    expect(res.state).toBe('STALE');
    expect(res.state_note).toContain('old');
    expect(res.data).not.toBeNull(); // shown, but labelled
  });

  it('remote fetch failure yields UNAVAILABLE with null data — no fabricated fallback', async () => {
    const res = await loadIntelligence({
      remoteBaseUrl: 'https://intelligence.invalid/',
      fetchImpl: (async () => { throw new Error('network down'); }) as unknown as typeof fetch,
    });
    expect(res.state).toBe('UNAVAILABLE');
    expect(res.data).toBeNull();
    expect(res.state_note).toContain('unreachable');
    expect(res.state_note).toContain('no fabricated fallback');
  });

  it('remote HTTP error yields UNAVAILABLE with null data', async () => {
    const res = await loadIntelligence({
      remoteBaseUrl: 'https://intelligence.invalid/',
      fetchImpl: (async () => ({ ok: false, status: 503 })) as unknown as typeof fetch,
    });
    expect(res.state).toBe('UNAVAILABLE');
    expect(res.data).toBeNull();
    expect(res.state_note).toContain('503');
  });

  it('unknown town yields explicit UNAVAILABLE — never another town\'s content', async () => {
    const res = await loadTown('not-a-real-town');
    expect(res.state).toBe('UNAVAILABLE');
    expect(res.data).toBeNull();
    expect(res.state_note).toContain('not-a-real-town');
    expect(res.state_note).toContain('not invented');
  });

  it('unknown province yields explicit UNAVAILABLE', async () => {
    const res = await loadProvince('atlantis-province');
    expect(res.state).toBe('UNAVAILABLE');
    expect(res.data).toBeNull();
  });

  it('data-state line surfaces state, as_of, version and roster status', async () => {
    const res = await loadNational();
    const line = dataStateLine(res);
    expect(line).toContain(res.state);
    expect(line).toContain(res.as_of);
    expect(line).toContain(res.version);
    expect(line).toContain('roster');
  });
});

describe('Passport integration — rollups (town -> province -> national)', () => {
  it('rollups are internally consistent (counts preserved)', () => {
    const v = validateRollupConsistency(snapshot);
    expect(v.problems).toEqual([]);
    expect(v.ok).toBe(true);
  });

  it('every town carries exactly 10 cells (the canonical ten)', () => {
    for (const t of snapshot.towns) expect(t.cells.length).toBe(10);
  });

  it('national count equals the sum of province counts', () => {
    const national = rollupNational(snapshot);
    const sum = snapshot.provinces.reduce((a, p) => {
      const r = rollupProvince(snapshot, p.province);
      return { towns: a.towns + r.towns, cells: a.cells + r.cells, agenda: a.agenda + r.agenda_open };
    }, { towns: 0, cells: 0, agenda: 0 });
    expect(sum.towns).toBe(national.towns);
    expect(sum.cells).toBe(national.cells);
    expect(sum.agenda).toBe(national.agenda_open);
    expect(national.towns).toBe(50);
  });

  it('stanced cells are consistent with the evidence rule (no SCALE/BUILD without evidence)', () => {
    const national = rollupNational(snapshot);
    expect(national.stance_counts['SCALE'] ?? 0).toBe(0);
    expect(national.stance_counts['BUILD'] ?? 0).toBe(0);
    expect((national.stance_counts['TEST'] ?? 0)).toBeGreaterThan(0);
    expect((national.stance_counts['OBSERVE'] ?? 0)).toBeGreaterThan(400);
  });
});

describe('Passport integration — provenance, truth class, evidence (every claim, every value)', () => {
  it('every reality fact carries truth_class, provenance, as_of and evidence_refs field', () => {
    for (const t of snapshot.towns) {
      for (const facts of Object.values(t.reality)) {
        for (const f of facts) {
          expect(f.truth_class).toBeTruthy();
          expect(f.provenance).toBeTruthy();
          expect(f.as_of).toBeTruthy();
          expect(Array.isArray(f.evidence_refs)).toBe(true);
        }
      }
    }
  });

  it('missing market values are null with a class — never zero-filled', () => {
    for (const t of snapshot.towns) {
      for (const o of t.opportunities) {
        for (const m of o.market_layers) {
          if (m.value === 0) throw new Error(`zero-filled market layer in ${t.slug}`);
          expect(typeof m.truth_class).toBe('string');
        }
      }
    }
  });

  it('every cell recommendation basis carries why/evidence/assumptions/what-would-change', () => {
    for (const t of snapshot.towns) {
      for (const c of t.cells) {
        expect(c.basis.why ?? c.basis.rationale).toBeTruthy();
        expect(c.basis.evidence).toBeTruthy();
        expect(Array.isArray(c.basis.assumptions)).toBe(true);
        expect(c.basis.what_would_change_the_decision).toBeTruthy();
      }
    }
  });

  it('versioning is surfaced on every town (artifacts sha256-pinned)', () => {
    for (const t of snapshot.towns) {
      expect(t.version).toBeTruthy();
      expect(t.version_info.compiled_at).toBeTruthy();
      expect(Object.keys(t.version_info.artifacts).length).toBeGreaterThanOrEqual(6);
      for (const a of Object.values(t.version_info.artifacts)) expect(a.sha256).toHaveLength(64);
    }
  });

  it('freshness metadata present (what_changed non-empty, roster status carried)', () => {
    expect(snapshot.meta.what_changed.length).toBeGreaterThan(0);
    expect(snapshot.meta.roster_ratification).toContain('PENDING');
    expect(snapshot.meta.freshness_policy).toContain('never invented');
  });
});

describe('Passport integration — CoS interpretation (evidence-linked, proposals only)', () => {
  const town = snapshot.towns.find((t) => t.slug === 'senekal') as TownPassportView;

  it('every claim carries evidence refs and an explicit evidence state', () => {
    const interp = interpretTown(town);
    expect(interp.claims.length).toBeGreaterThanOrEqual(4);
    for (const c of interp.claims) {
      expect(c.evidence.length).toBeGreaterThan(0);
      expect(['SUFFICIENT', 'INSUFFICIENT EVIDENCE']).toContain(c.evidence_state);
    }
  });

  it('the five modes are represented (OBSERVE..ACT)', () => {
    const modes = new Set(interpretTown(town).claims.map((c) => c.mode));
    for (const m of ['OBSERVE', 'EXPLAIN', 'CHALLENGE', 'COACH', 'ACT']) expect(modes.has(m as never)).toBe(true);
  });

  it('every action is a PROPOSAL awaiting human approval, with owner/rationale/evidence/review', () => {
    const interp = interpretTown(town);
    for (const p of interp.proposals) {
      expect(p.approval_status).toBe('PROPOSAL — AWAITING HUMAN APPROVAL');
      expect(p.owner).toBeTruthy();
      expect(p.rationale).toBeTruthy();
      expect(p.evidence.length).toBeGreaterThan(0);
      expect(p.review_point).toBeTruthy();
    }
  });

  it('bridge chain carries SIGNAL -> INTERPRETATION -> EVIDENCE -> CAPABILITY -> NEXT ACTION -> OWNER -> REVIEW', () => {
    const interp = interpretTown(town);
    expect(interp.bridge.length).toBeGreaterThan(0);
    for (const b of interp.bridge) {
      expect(b.signal).toBeTruthy();
      expect(b.interpretation).toBeTruthy();
      expect(b.evidence.length).toBeGreaterThan(0);
      expect(b.capability_implication).toBeTruthy();
      expect(b.next_action).toBeTruthy();
      expect(b.owner).toBeTruthy();
      expect(b.review).toBeTruthy();
    }
  });
});

describe('Passport integration — permissions (route guard, default deny)', () => {
  it('/passport routes are protected by default and not public', () => {
    for (const route of ['/passport', '/passport/province/free-state', '/passport/town/senekal']) {
      expect(requiresAuth(route)).toBe(true);
      expect(isPublicPath(route)).toBe(false);
    }
  });

  it('the public town directory stays public (no regression)', () => {
    expect(isPublicPath('/town/senekal')).toBe(true);
  });
});

describe('Passport integration — display sections contract', () => {
  it('every town carries data for all 15 display sections', () => {
    for (const t of snapshot.towns) {
      expect(t.identity).toBeTruthy();
      expect(Object.keys(t.reality).length).toBe(6); // PEOPLE..READINESS
      expect(t.opportunities.length).toBeGreaterThan(0);
      expect(t.cells.length).toBe(10);
      expect(t.north_star.statement).toBeTruthy();
      expect(Array.isArray(t.targets)).toBe(true);
      expect(t.capability.capacity_notes).toBeTruthy();
      expect(t.trajectory.first_actions.length).toBeGreaterThan(0);
      expect(Array.isArray(t.proof_learning.proof_requirements)).toBe(true);
      expect(Array.isArray(t.proof_learning.learnings)).toBe(true);
      expect(t.economics.length).toBeGreaterThan(0);
      expect(t.agenda.entries.length).toBeGreaterThan(0);
      expect(t.workpacks.groups).toBeTruthy();
      expect(t.version_info).toBeTruthy();
      // BMC + CoS render from cells/interpretation at view time (tested above)
    }
  });
});
