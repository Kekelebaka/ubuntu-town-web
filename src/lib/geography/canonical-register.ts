/**
 * Canonical Town Register — public API layer over the founding-fifty manifest.
 *
 * This module re-exports a backward-compatible interface consumed by:
 *   - town-context.ts  (type imports only)
 *   - useActorContext.ts (getTownBySlug, getProvinceForTown)
 *   - OpenDoor.tsx      (getTownBySlug, CANONICAL_PROVINCES)
 *
 * All data is delegated to founding-fifty-manifest.ts.
 * Thaba Nchu is now isFounding=true (no longer marked false).
 */

import {
  FOUNDING_FIFTY,
  FOUNDING_FIFTY_BY_SLUG,
  FOUNDING_FIFTY_BY_ID,
  FOUNDING_FIFTY_BY_ALIAS,
  FOUNDING_FIFTY_COUNT,
  PROVINCE_DISTRIBUTION,
  type FoundingTown,
} from './founding-fifty-manifest';

// ============================================================
// Types (backward-compatible)
// ============================================================

/** @deprecated Use FoundingTown from founding-fifty-manifest.ts */
export interface CanonicalTown {
  id: string;
  name: string;
  slug: string;
  province: string;
  provinceSlug: string;
  aliases: string[];
  isFounding: boolean;
}

export interface CanonicalProvince {
  name: string;
  slug: string;
  towns: CanonicalTown[];
}

// ============================================================
// Build province index from manifest
// ============================================================

const provinceMap = new Map<string, CanonicalProvince>();

for (const town of FOUNDING_FIFTY) {
  let province = provinceMap.get(town.province);
  if (!province) {
    province = { name: town.province, slug: town.provinceSlug, towns: [] };
    provinceMap.set(town.province, province);
  }
  province.towns.push(town as unknown as CanonicalTown);
}

const PROVINCES: CanonicalProvince[] = Array.from(provinceMap.values());

// ============================================================
// Lookup indices (case-insensitive alias lookup)
// ============================================================

const TOWN_BY_SLUG = new Map<string, CanonicalTown>(
  Array.from(FOUNDING_FIFTY_BY_SLUG.entries()).map(([k, v]) => [k, v as unknown as CanonicalTown])
);

const TOWN_BY_ID = new Map<string, CanonicalTown>(
  Array.from(FOUNDING_FIFTY_BY_ID.entries()).map(([k, v]) => [k, v as unknown as CanonicalTown])
);

const TOWN_BY_ALIAS = new Map<string, CanonicalTown>(
  Array.from(FOUNDING_FIFTY_BY_ALIAS.entries()).map(([k, v]) => [k, v as unknown as CanonicalTown])
);

// ============================================================
// PUBLIC API (backward-compatible)
// ============================================================

/** All 9 provinces with their founding towns */
export const CANONICAL_PROVINCES: readonly CanonicalProvince[] = PROVINCES;

/** All founding towns (50 — see founding-fifty-manifest.ts) */
export const CANONICAL_TOWNS: readonly CanonicalTown[] =
  FOUNDING_FIFTY as unknown as readonly CanonicalTown[];

/** Total town count (founding only — equals CANONICAL_TOWNS.length) */
export const TOTAL_TOWN_COUNT = FOUNDING_FIFTY_COUNT;

/** Founding town count — same as TOTAL_TOWN_COUNT since all are founding */
export const FOUNDING_TOWN_COUNT = FOUNDING_FIFTY_COUNT;

/** Look up a town by slug (primary key) */
export function getTownBySlug(slug: string): CanonicalTown | undefined {
  return TOWN_BY_SLUG.get(slug);
}

/** Look up a town by id (UUID) */
export function getTownById(id: string): CanonicalTown | undefined {
  return TOWN_BY_ID.get(id);
}

/** Look up a town by alias (case-insensitive) */
export function getTownByAlias(alias: string): CanonicalTown | undefined {
  return TOWN_BY_ALIAS.get(alias.toLowerCase());
}

/** Resolve a town from any known identifier (slug, id, or alias) */
export function resolveTown(identifier: string): CanonicalTown | undefined {
  return getTownBySlug(identifier)
    ?? getTownById(identifier)
    ?? getTownByAlias(identifier);
}

/** Get province for a town slug */
export function getProvinceForTown(townSlug: string): CanonicalProvince | undefined {
  const town = getTownBySlug(townSlug);
  if (!town) return undefined;
  return provinceMap.get(town.province);
}

/** Get all towns in a province */
export function getTownsInProvince(provinceSlug: string): CanonicalTown[] {
  const province = PROVINCES.find(p => p.slug === provinceSlug);
  return province?.towns ?? [];
}

/** Search towns by name (fuzzy match) */
export function searchTowns(query: string): CanonicalTown[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return (FOUNDING_FIFTY as unknown as CanonicalTown[]).filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.slug.includes(q) ||
    t.aliases.some(a => a.toLowerCase().includes(q))
  );
}

/** Validate that a town slug is in the canonical register */
export function isCanonicalTown(slug: string): boolean {
  return TOWN_BY_SLUG.has(slug);
}

/** Validate that a province slug is canonical */
export function isCanonicalProvince(provinceSlug: string): boolean {
  return provinceMap.has(provinceSlug) || PROVINCES.some(p => p.slug === provinceSlug);
}

// Re-export manifest constants for direct access
export { FOUNDING_FIFTY_COUNT, PROVINCE_DISTRIBUTION } from './founding-fifty-manifest';
