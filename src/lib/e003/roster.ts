// src/lib/e003/roster.ts — BLUEPRINT ROSTER RESOLUTION (product geography authority).
// The strategic operating geography is the 50-town Blueprint cohort (blueprint-roster.json).
// uto.towns (81 rows) remains database coverage — never conflated, never an "81-town strategy".
// The is_founding flag is explicitly NOT the roster (contradiction C-05: only 26/50 overlap).

import rosterData from './blueprint-roster.json';

export interface RosterTown {
  name: string;
  province: string;
  slug: string;
  canonical_row_id: string;
}

export const BLUEPRINT_ROSTER = {
  object: (rosterData as any).object as string,
  version: (rosterData as any).version as string,
  created: (rosterData as any).created as string,
  authority: (rosterData as any).authority as string,
  provenance: (rosterData as any).provenance as Record<string, string>,
  ratificationStatus: (rosterData as any).provenance.ratification_status as string,
  towns: (rosterData as any).towns as RosterTown[],
};

export const ROSTER_COUNT = BLUEPRINT_ROSTER.towns.length; // 50
export const ROSTER_PROVINCES = Array.from(new Set(BLUEPRINT_ROSTER.towns.map((t) => t.province))).sort(); // 9

export function isBlueprintTown(slugOrName: string): boolean {
  const k = slugOrName.toLowerCase();
  return BLUEPRINT_ROSTER.towns.some((t) => t.slug === k || t.name.toLowerCase() === k);
}

export function rosterTown(slugOrName: string): RosterTown | undefined {
  const k = slugOrName.toLowerCase();
  return BLUEPRINT_ROSTER.towns.find((t) => t.slug === k || t.name.toLowerCase() === k);
}

export function rosterByProvince(province: string): RosterTown[] {
  return BLUEPRINT_ROSTER.towns.filter((t) => t.province === province);
}

/** Strategic geography for national/provincial views: the roster, never the raw table. */
export function strategicGeography() {
  return {
    cohortLabel: `${ROSTER_COUNT} BLUEPRINT TOWNS · ${ROSTER_PROVINCES.length} PROVINCES`,
    cohortNote:
      'The operating cohort is the Blueprint roster (blueprint-roster.json ' + BLUEPRINT_ROSTER.version +
      '). Database coverage (81 canonical rows) is a different, non-strategic truth — never conflated.',
    ratificationStatus: BLUEPRINT_ROSTER.ratificationStatus,
    provinces: ROSTER_PROVINCES.map((p) => ({ province: p, towns: rosterByProvince(p) })),
  };
}

/** Town-page cohort stamp: in-cohort (Blueprint) vs database row outside the cohort. */
export function cohortStamp(slugOrName: string): { inCohort: boolean; label: string; note: string } {
  const t = rosterTown(slugOrName);
  if (t) {
    return {
      inCohort: true,
      label: 'BLUEPRINT COHORT',
      note: `One of the ${ROSTER_COUNT} Blueprint towns (roster ${BLUEPRINT_ROSTER.version}) — strategic operating geography.`,
    };
  }
  return {
    inCohort: false,
    label: 'DATABASE ROW · OUTSIDE THE BLUEPRINT COHORT',
    note: 'This town exists as a legitimate canonical database row but is NOT part of the 50-town Blueprint operating cohort. It is shown as database coverage, not strategic geography.',
  };
}
