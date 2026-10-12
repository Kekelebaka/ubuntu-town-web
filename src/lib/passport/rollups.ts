// src/lib/passport/rollups.ts — pure rollup computations (town -> province -> national).
// CASCADE LAW: counts are preserved; incompatible metrics (ratios, money) are NEVER summed.
// Only counts of comparable units aggregate; everything else surfaces per-entity with coverage.

import type { NationalRollupView, PassportSnapshot, ProvinceRollupView, TownPassportView } from './types';

export interface RollupCounts {
  towns: number;
  cells: number;
  stance_counts: Record<string, number>;
  agenda_open: number;
  evidence_class_counts: Record<string, number>;
  active_cells: { town: string; initiative: string; stance: string }[];
}

function emptyCounts(): RollupCounts {
  return { towns: 0, cells: 0, stance_counts: {}, agenda_open: 0, evidence_class_counts: {}, active_cells: [] };
}

function addTown(c: RollupCounts, t: TownPassportView): void {
  c.towns += 1;
  c.agenda_open += t.agenda.summary.open ?? 0;
  for (const cell of t.cells) {
    c.cells += 1;
    c.stance_counts[cell.stance] = (c.stance_counts[cell.stance] ?? 0) + 1;
    if (cell.stance !== 'OBSERVE') c.active_cells.push({ town: t.name, initiative: cell.initiative_key, stance: cell.stance });
  }
  for (const facts of Object.values(t.reality)) {
    for (const f of facts) c.evidence_class_counts[f.truth_class] = (c.evidence_class_counts[f.truth_class] ?? 0) + 1;
  }
}

export function rollupTowns(towns: TownPassportView[]): RollupCounts {
  const c = emptyCounts();
  for (const t of towns) addTown(c, t);
  return c;
}

export function rollupProvince(snapshot: PassportSnapshot, province: string): RollupCounts {
  return rollupTowns(snapshot.towns.filter((t) => t.province.toLowerCase() === province.toLowerCase()));
}

export function rollupNational(snapshot: PassportSnapshot): RollupCounts {
  return rollupTowns(snapshot.towns);
}

/** Consistency check: province rollups must sum exactly to the national rollup (counts only). */
export function validateRollupConsistency(snapshot: PassportSnapshot): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const national = rollupNational(snapshot);
  const byProvince = snapshot.provinces.map((p) => rollupProvince(snapshot, p.province));
  const sumTowns = byProvince.reduce((a, b) => a + b.towns, 0);
  const sumCells = byProvince.reduce((a, b) => a + b.cells, 0);
  const sumAgenda = byProvince.reduce((a, b) => a + b.agenda_open, 0);
  if (sumTowns !== national.towns) problems.push(`province town sum ${sumTowns} != national ${national.towns}`);
  if (sumCells !== national.cells) problems.push(`province cell sum ${sumCells} != national ${national.cells}`);
  if (sumAgenda !== national.agenda_open) problems.push(`province agenda sum ${sumAgenda} != national ${national.agenda_open}`);
  for (const p of snapshot.provinces) {
    const pCounted = rollupProvince(snapshot, p.province);
    if (pCounted.towns !== p.towns) problems.push(`${p.province}: computed ${pCounted.towns} towns != stored ${p.towns}`);
    if (pCounted.cells !== p.cells) problems.push(`${p.province}: computed ${pCounted.cells} cells != stored ${p.cells}`);
    if (pCounted.agenda_open !== p.agenda_open) problems.push(`${p.province}: computed agenda ${pCounted.agenda_open} != stored ${p.agenda_open}`);
  }
  // every town must carry exactly 10 cells (the canonical ten) — comparable counts only
  for (const t of snapshot.towns) {
    if (t.cells.length !== 10) problems.push(`${t.slug}: ${t.cells.length} cells != 10`);
  }
  return { ok: problems.length === 0, problems };
}

/** Freshness/versioning surfacing — every page shows one of these lines verbatim. */
export function dataStateLine(input: { state: string; state_note: string; as_of: string; version: string; roster_ratification: string }): string {
  return `DATA STATE: ${input.state} — ${input.state_note} (as_of ${input.as_of}, intelligence v${input.version}, roster: ${input.roster_ratification})`;
}
