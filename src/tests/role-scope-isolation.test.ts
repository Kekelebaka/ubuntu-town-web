// src/tests/role-scope-isolation.test.ts — AUTHORIZATION MODEL (authoritative 2026-10-12).
// NATIONAL → all · TOWN → one town × all active initiatives · INITIATIVE → one initiative × all towns.
// Cross-town and cross-initiative access must FAIL CLOSED. This is the isolation matrix.

import { describe, it, expect } from 'vitest';
import {
  resolveLenses, canSeeTown, canSeeInitiative, canSeeTownInitiativeCell,
  canSeeOperationalRecords, visibleRoster, lensSummary,
  type RoleAssignment,
} from '@/lib/e003/scope';
import { ROSTER_COUNT, BLUEPRINT_ROSTER } from '@/lib/e003/roster';
import { initiativeByKey } from '@/lib/e003/registry';

const TOWN_A = BLUEPRINT_ROSTER.towns.find((t) => t.slug === 'senekal')!.canonical_row_id;
const TOWN_B = BLUEPRINT_ROSTER.towns.find((t) => t.slug === 'soweto')!.canonical_row_id;

const national: RoleAssignment[] = [{ user_id: 'u1', role_key: 'ops', town_id: null }];
const townA: RoleAssignment[] = [{ user_id: 'u2', role_key: 'coordinator', town_id: TOWN_A }];
const initiativeX: RoleAssignment[] = [{ user_id: 'u3', role_key: 'ops', town_id: null, initiative_scope: 'fixeasy' }];
const initiativeY: RoleAssignment[] = [{ user_id: 'u4', role_key: 'ops', town_id: null, initiative_scope: 'kasibuy' }];

const lensN = resolveLenses(national);
const lensA = resolveLenses(townA);
const lensX = resolveLenses(initiativeX);
const lensY = resolveLenses(initiativeY);
const L = (r: ReturnType<typeof resolveLenses>) => (r.ok ? r.lenses : []);

describe('scope resolution is fail-closed', () => {
  it('no assignments → no access; unmapped roles → no access', () => {
    expect(resolveLenses([]).ok).toBe(false);
    expect(resolveLenses([{ user_id: 'u', role_key: 'viewer', town_id: null }]).ok).toBe(false);
    expect(resolveLenses([{ user_id: 'u', role_key: 'partner', town_id: TOWN_A }]).ok).toBe(false);
    expect(lensSummary(resolveLenses([]))).toContain('NO ACCESS');
  });
  it('national requires BOTH the national role key AND town_id NULL', () => {
    expect(resolveLenses([{ user_id: 'u', role_key: 'ops', town_id: TOWN_A }]).ok === true).toBe(true); // becomes a TOWN lens, not national
    const mixed = resolveLenses([{ user_id: 'u', role_key: 'ops', town_id: TOWN_A }]);
    expect(mixed.ok && mixed.lenses.every((l) => l.kind !== 'national')).toBe(true);
  });
});

describe('NATIONAL lens — everything authorized', () => {
  it('sees all towns, all initiatives, all cells, all records', () => {
    expect(canSeeTown(L(lensN), TOWN_A)).toBe(true);
    expect(canSeeTown(L(lensN), TOWN_B)).toBe(true);
    expect(canSeeInitiative(L(lensN), 'fixeasy')).toBe(true);
    expect(canSeeTownInitiativeCell(L(lensN), TOWN_B, 'kasibuy')).toBe(true);
    expect(canSeeOperationalRecords(L(lensN), { townId: TOWN_B })).toBe(true);
    expect(visibleRoster(L(lensN))).toHaveLength(ROSTER_COUNT); // all 50 Blueprint towns
  });
});

describe('TOWN lens — one town × all active initiatives', () => {
  it('sees its own town and every initiative inside it', () => {
    expect(canSeeTown(L(lensA), TOWN_A)).toBe(true);
    expect(canSeeInitiative(L(lensA), 'fixeasy')).toBe(true);
    expect(canSeeInitiative(L(lensA), 'kasibuy')).toBe(true);
    expect(canSeeTownInitiativeCell(L(lensA), TOWN_A, 'fixeasy')).toBe(true);
  });
  it('CROSS-TOWN ISOLATION: Town A cannot see Town B anything', () => {
    expect(canSeeTown(L(lensA), TOWN_B)).toBe(false);
    expect(canSeeTownInitiativeCell(L(lensA), TOWN_B, 'fixeasy')).toBe(false);
    expect(canSeeOperationalRecords(L(lensA), { townId: TOWN_B })).toBe(false);
    expect(visibleRoster(L(lensA)).every((t) => t.canonical_row_id !== TOWN_B)).toBe(true);
    expect(visibleRoster(L(lensA))).toHaveLength(1); // exactly one town
  });
});

describe('INITIATIVE lens — one initiative × all 50 towns', () => {
  it('sees its own initiative across the whole roster', () => {
    expect(canSeeInitiative(L(lensX), 'fixeasy')).toBe(true);
    expect(canSeeTownInitiativeCell(L(lensX), TOWN_A, 'fixeasy')).toBe(true);
    expect(canSeeTownInitiativeCell(L(lensX), TOWN_B, 'fixeasy')).toBe(true);
    expect(visibleRoster(L(lensX))).toHaveLength(ROSTER_COUNT); // all 50 towns
  });
  it('CROSS-INITIATIVE ISOLATION: Initiative X cannot see Initiative Y operational records', () => {
    expect(canSeeInitiative(L(lensX), 'kasibuy')).toBe(false);
    expect(canSeeTownInitiativeCell(L(lensX), TOWN_A, 'kasibuy')).toBe(false);
    expect(canSeeOperationalRecords(L(lensX), { initiativeKey: 'kasibuy' })).toBe(false);
    expect(canSeeOperationalRecords(L(lensY), { initiativeKey: 'fixeasy' })).toBe(false);
  });
  it('initiative lens does not gain national operational scope', () => {
    expect(canSeeOperationalRecords(L(lensX), { townId: TOWN_A, initiativeKey: 'kasibuy' })).toBe(false);
  });
});

describe('the removed trio can never resolve as active initiatives', () => {
  it('no lens can see a removed initiative as active', () => {
    for (const key of ['job-fixer', 'ubuntu-academy', 'ecochar']) {
      // the key never resolves to a canonical initiative object — so it can never render as active
      expect(initiativeByKey(key)).toBeUndefined();
    }
  });
});
