// Ubuntu Town — Core TypeScript Types
// Matches the engineering build spec data models

export type TownStatus = 'ghost' | 'building' | 'live';
export type PersonaLens = 'investor' | 'visitor' | 'resident' | 'funder' | 'coordinator';
export type CoordinatorStatus = 'recruiting' | 'assigned' | 'active' | 'dormant';

export interface NetworkStats {
  towns: number;
  provinces: number;
  coordinators: number;
}

export interface TownRef {
  slug: string;
  name: string;
  region?: string;
  district?: string;
  status: TownStatus;
  render_pct: number;
  opportunity_potential: number;
  heritage: boolean;
  coordinator_status: CoordinatorStatus;
  route: string;
  illustrative: boolean;
  live_url?: string;
  twin_ref?: string;
}

export interface ProvinceAggregates {
  towns: number;
  live: number;
  building: number;
  unclaimed: number;
  opportunity_index_avg: number;
}

export interface ProvinceData {
  slug: string;
  name: string;
  hero_image?: string;
  default_lens?: PersonaLens;
  network: NetworkStats;
  aggregates: ProvinceAggregates;
  data_vintage: string;
  note?: string;
  towns: TownRef[];
}

export interface PersonaConfig {
  label: string;
  emoji: string;
  accent: string;
  spotlight: string;
  province_sort: string;
}

export interface TownGeo {
  lat: number;
  lng: number;
  elevation_m?: number;
  area_km2?: number;
  wards?: number;
}

export interface TownTwin {
  slug: string;
  name: string;
  province: string;
  district: string;
  municipality: string;
  status: TownStatus;
  render_pct: number;
  coordinator: { id: string; name: string; active: boolean };
  geo: TownGeo;
  stats: Record<string, { value: number; year?: number; unit?: string; scope?: string; source?: string }>;
  loop: { signals: number; workpacks: number; proof: number; memory: number; actions: number };
  opportunity_index: number;
  locations: { name: string; category: string; layer: string; lat: number; lng: number; address: string; contact: string; source: string }[];
  opportunities: { id: string; title: string; category: string; score: number; impact: number; feasibility: number; difficulty: string; investmentTier: string; investmentRange: string; horizon: string; partners: string[]; actions: string[]; rationale: string; brand: string }[];
  assets: Record<string, string>;
  modules: Record<string, string>;
  sources: string[];
  data_vintage: string;
  flags: string[];
  illustrative: boolean;
}
