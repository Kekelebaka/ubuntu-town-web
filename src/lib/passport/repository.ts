// src/lib/passport/repository.ts — READ-ONLY intelligence repository adapter.
// Ubuntu Town OS = operational system. The intelligence layer (AWS Town Intelligence, mirrored
// snapshot) = versioned artifact layer. This adapter NEVER writes and NEVER fabricates content.
// If the intelligence layer is unavailable, pages render an explicit data-state instead of content.

import snapshotJson from '@/data/intelligence/passport-snapshot.json';
import type {
  DataState, NationalRollupView, PassportSnapshot, ProvinceRollupView,
  RepositoryResult, TownPassportView,
} from './types';

const SNAPSHOT = snapshotJson as unknown as PassportSnapshot;

/** Freshness policy: snapshot older than this is labelled STALE (content still shown, never altered). */
export const FRESHNESS_BUDGET_DAYS = 90;

export interface RepositoryOptions {
  /** Remote intelligence base URL (the future AWS repository). When absent: SNAPSHOT state. */
  remoteBaseUrl?: string | null;
  /** Injectable clock for tests. */
  now?: Date;
  /** Injectable fetch for tests (remote mode only). */
  fetchImpl?: typeof fetch;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000);
}

function baseState(now: Date, opts: RepositoryOptions): { state: DataState; note: string } {
  const asOf = new Date(SNAPSHOT.meta.as_of);
  const ageDays = daysBetween(now, asOf);
  if (opts.remoteBaseUrl) {
    return { state: 'LIVE', note: `Remote intelligence repository: ${opts.remoteBaseUrl}` };
  }
  if (ageDays > FRESHNESS_BUDGET_DAYS) {
    return {
      state: 'STALE',
      note: `Intelligence snapshot as_of ${SNAPSHOT.meta.as_of} is ${ageDays} days old (budget ${FRESHNESS_BUDGET_DAYS}d). Content shown unchanged; refresh the snapshot.`,
    };
  }
  return {
    state: 'SNAPSHOT',
    note: `Bundled intelligence snapshot v${SNAPSHOT.meta.version} (as_of ${SNAPSHOT.meta.as_of}). Remote AWS repository not configured — this is a dated mirror, not live data.`,
  };
}

/**
 * Load the whole intelligence layer. Never throws content into existence:
 * on any failure the result carries state UNAVAILABLE + reason and null data.
 */
export async function loadIntelligence(opts: RepositoryOptions = {}): Promise<RepositoryResult<PassportSnapshot>> {
  const now = opts.now ?? new Date();
  try {
    const { state, note } = baseState(now, opts);
    if (state === 'LIVE' && opts.remoteBaseUrl) {
      // Remote mode: fetch the versioned manifest; on ANY failure fall back to explicit UNAVAILABLE
      // for live data — we do NOT silently substitute the snapshot and call it live.
      try {
        const f = opts.fetchImpl ?? fetch;
        const res = await f(new URL('MANIFEST.json', opts.remoteBaseUrl));
        if (!res.ok) {
          return {
            state: 'UNAVAILABLE',
            state_note: `Remote intelligence repository returned HTTP ${res.status}. No content is shown for live mode; no fallback content is invented.`,
            as_of: SNAPSHOT.meta.as_of, version: SNAPSHOT.meta.version,
            roster_ratification: SNAPSHOT.meta.roster_ratification, data: null,
          };
        }
        return {
          state, state_note: note, as_of: SNAPSHOT.meta.as_of, version: SNAPSHOT.meta.version,
          roster_ratification: SNAPSHOT.meta.roster_ratification, data: SNAPSHOT,
        };
      } catch (e) {
        return {
          state: 'UNAVAILABLE',
          state_note: `Remote intelligence repository unreachable (${(e as Error).message}). Explicit empty state — no fabricated fallback.`,
          as_of: SNAPSHOT.meta.as_of, version: SNAPSHOT.meta.version,
          roster_ratification: SNAPSHOT.meta.roster_ratification, data: null,
        };
      }
    }
    return {
      state, state_note: note, as_of: SNAPSHOT.meta.as_of, version: SNAPSHOT.meta.version,
      roster_ratification: SNAPSHOT.meta.roster_ratification, data: SNAPSHOT,
    };
  } catch (e) {
    return {
      state: 'UNAVAILABLE',
      state_note: `Intelligence layer failed to load (${(e as Error).message}). Nothing is rendered from memory — no fabricated fallback data.`,
      as_of: 'unknown', version: 'unknown', roster_ratification: 'unknown', data: null,
    };
  }
}

export async function loadTown(slug: string, opts: RepositoryOptions = {}): Promise<RepositoryResult<TownPassportView>> {
  const base = await loadIntelligence(opts);
  if (!base.data) return { ...base, data: null };
  const town = base.data.towns.find((t) => t.slug === slug);
  if (!town) {
    return {
      state: 'UNAVAILABLE',
      state_note: `No intelligence artifact exists for town '${slug}' in snapshot v${base.version}. Content is not invented for unknown towns.`,
      as_of: base.as_of, version: base.version, roster_ratification: base.roster_ratification, data: null,
    };
  }
  return { ...base, data: town };
}

export async function loadProvince(province: string, opts: RepositoryOptions = {}): Promise<RepositoryResult<ProvinceRollupView>> {
  const base = await loadIntelligence(opts);
  if (!base.data) return { ...base, data: null };
  const rollup = base.data.provinces.find((p) => p.province.toLowerCase() === province.toLowerCase());
  if (!rollup) {
    return {
      state: 'UNAVAILABLE',
      state_note: `No province rollup exists for '${province}' in snapshot v${base.version}.`,
      as_of: base.as_of, version: base.version, roster_ratification: base.roster_ratification, data: null,
    };
  }
  return { ...base, data: rollup };
}

export async function loadNational(opts: RepositoryOptions = {}): Promise<RepositoryResult<NationalRollupView>> {
  const base = await loadIntelligence(opts);
  if (!base.data) return { ...base, data: null };
  return { ...base, data: base.data.national };
}
