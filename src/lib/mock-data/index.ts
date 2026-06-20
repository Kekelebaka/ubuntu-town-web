import type { Database } from '../database.types';
import { supabase, hasRealCredentials } from '../supabase-client';

export type Town = Database['public']['Tables']['towns']['Row'];
export type Opportunity = Database['public']['Tables']['opportunities']['Row'];
export type Business = Database['public']['Tables']['businesses']['Row'];
export type Signal = Database['public']['Tables']['town_signals']['Row'];
export type Coordinator = Database['public']['Tables']['coordinators']['Row'];
export type Province = Database['public']['Tables']['provinces']['Row'];
export type TownMetric = Database['public']['Tables']['town_metrics']['Row'];

export const mockProvinces: Province[] = [
  { id: 'prov-gauteng', name: 'Gauteng', slug: 'gauteng', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-wc', name: 'Western Cape', slug: 'western-cape', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-kzn', name: 'KwaZulu-Natal', slug: 'kwaZulu-natal', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-ec', name: 'Eastern Cape', slug: 'eastern-cape', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-limp', name: 'Limpopo', slug: 'limpopo', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-mpu', name: 'Mpumalanga', slug: 'mpumalanga', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-nw', name: 'North West', slug: 'north-west', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-fs', name: 'Free State', slug: 'free-state', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-nc', name: 'Northern Cape', slug: 'northern-cape', created_at: '2024-01-01T00:00:00Z' },
];

export const mockTowns: Town[] = [
  { id: 'town-jhb', province_id: 'prov-gauteng', name: 'Johannesburg', slug: 'johannesburg', archetype: 'metropolitan', population_estimate: 5600000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-pta', province_id: 'prov-gauteng', name: 'Pretoria', slug: 'pretoria', archetype: 'metropolitan', population_estimate: 2921000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-tsh', province_id: 'prov-gauteng', name: 'Tshwane', slug: 'tshwane', archetype: 'metropolitan', population_estimate: 2921000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-ct', province_id: 'prov-wc', name: 'Cape Town', slug: 'cape-town', archetype: 'metropolitan', population_estimate: 4600000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-stell', province_id: 'prov-wc', name: 'Stellenbosch', slug: 'stellenbosch', archetype: 'urban', population_estimate: 155000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-dur', province_id: 'prov-kzn', name: 'Durban', slug: 'durban', archetype: 'urban', population_estimate: 3442361, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-pmb', province_id: 'prov-kzn', name: 'Pietermaritzburg', slug: 'pietermaritzburg', archetype: 'urban', population_estimate: 750000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-el', province_id: 'prov-ec', name: 'East London', slug: 'east-london', archetype: 'urban', population_estimate: 478676, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-bhi', province_id: 'prov-ec', name: 'Bhisho', slug: 'bhisho', archetype: 'peri-urban', population_estimate: 135418, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-mth', province_id: 'prov-ec', name: 'Mthatha', slug: 'mthatha', archetype: 'peri-urban', population_estimate: 74754, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-pe', province_id: 'prov-ec', name: 'Port Elizabeth', slug: 'port-elizabeth', archetype: 'urban', population_estimate: 1263000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-pol', province_id: 'prov-limp', name: 'Polokwane', slug: 'polokwane', archetype: 'peri-urban', population_estimate: 65000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-thoh', province_id: 'prov-limp', name: 'Thohoyandou', slug: 'thohoyandou', archetype: 'rural', population_estimate: 46840, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-nelspr', province_id: 'prov-mpu', name: 'Nelspruit', slug: 'nelspruit', archetype: 'peri-urban', population_estimate: 115131, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-emal', province_id: 'prov-mpu', name: 'Emalahleni', slug: 'emalahleni', archetype: 'peri-urban', population_estimate: 520000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-maf', province_id: 'prov-nw', name: 'Mafikeng', slug: 'mafikeng', archetype: 'peri-urban', population_estimate: 75000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-rs', province_id: 'prov-nw', name: 'Rustenburg', slug: 'rustenburg', archetype: 'urban', population_estimate: 395585, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-bloem', province_id: 'prov-fs', name: 'Bloemfontein', slug: 'bloemfontein', archetype: 'urban', population_estimate: 520000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-wel', province_id: 'prov-fs', name: 'Welkom', slug: 'welkom', archetype: 'peri-urban', population_estimate: 431944, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-kim', province_id: 'prov-nc', name: 'Kimberley', slug: 'kimberley', archetype: 'urban', population_estimate: 142089, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-upington', province_id: 'prov-nc', name: 'Upington', slug: 'upington', archetype: 'rural', population_estimate: 74640, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-klerks', province_id: 'prov-nw', name: 'Klerksdorp', slug: 'klerksdorp', archetype: 'urban', population_estimate: 400000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-pot', province_id: 'prov-mpu', name: 'Potchefstroom', slug: 'potchefstroom', archetype: 'peri-urban', population_estimate: 200000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-witbank', province_id: 'prov-mpu', name: 'Witbank', slug: 'witbank', archetype: 'peri-urban', population_estimate: 650000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-graham', province_id: 'prov-ec', name: 'Grahamstown', slug: 'grahamstown', archetype: 'rural', population_estimate: 50000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-king', province_id: 'prov-kzn', name: 'King Williams Town', slug: 'king-williams-town', archetype: 'rural', population_estimate: 72522, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-bhisho', province_id: 'prov-ec', name: 'Bhisho Central', slug: 'bhisho-central', archetype: 'peri-urban', population_estimate: 50000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'town-albert', province_id: 'prov-nw', name: 'Alberton', slug: 'alberton', archetype: 'urban', population_estimate: 402678, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
];

interface TownWithCounts extends Town {
  coordinators: number;
  opportunities: number;
  signals: number;
}

export const townsWithCounts: TownWithCounts[] = mockTowns.map(town => {
  const seed = town.name.charCodeAt(0);
  return {
    ...town,
    coordinators: 1 + (seed % 3),
    opportunities: (seed % 10) + 3,
    signals: (seed % 20) + 5,
  };
});

function generateOpportunities(townSlug: string): Opportunity[] {
  const names = ['SAP Internship', 'Youth Mentorship', 'Digital Skills Training'];
  const types = ['internship', 'volunteer', 'training'];
  const count = 2 + (townSlug.length % 4);
  return Array.from({ length: count }, (_, i) => ({
    id: `opp-${townSlug}-${i}`,
    town_id: townSlug,
    title: names[i % names.length],
    type: types[i % types.length],
    description: `Opportunity in ${townSlug}.`,
    source: i % 2 === 0 ? 'government' : 'ngo',
    deadline_date: i === 0 ? '2025-12-31' : null,
    url: null,
    metadata: {},
    created_at: '2024-01-01T00:00:00Z',
  }));
}

function generateBusinesses(townSlug: string): Business[] {
  const names = ['Local Corner Shop', 'Town Spaza', 'Community Clinic'];
  const categories = ['retail', 'healthcare', 'education'];
  const count = 2 + (townSlug.length % 3);
  return Array.from({ length: count }, (_, i) => ({
    id: `biz-${townSlug}-${i}`,
    town_id: townSlug,
    name: names[i % names.length],
    category: categories[i % categories.length],
    description: `Service in ${townSlug}.`,
    is_verified: true,
    owner_profile_id: null,
    contact_email: null,
    contact_phone: null,
    created_at: '2024-01-01T00:00:00Z',
  }));
}

function generateSignals(townSlug: string): Signal[] {
  const titles = ['Road Repair Needed', 'Water Issue', 'Safety Concern'];
  const categories = ['infrastructure', 'utilities', 'safety'];
  const count = 3 + (townSlug.length % 5);
  return Array.from({ length: count }, (_, i) => ({
    id: `sig-${townSlug}-${i}`,
    town_id: townSlug,
    user_id: null,
    title: titles[i % titles.length],
    category: categories[i % categories.length],
    description: `Signal from ${townSlug}.`,
    status: 'pending',
    submitted_by: null,
    created_at: '2024-01-01T00:00:00Z',
  }));
}

function generateCoordinators(townSlug: string): Coordinator[] {
  const names = ['Thabo M.', 'Naledi K.'];
  const count = 1 + (townSlug.length % 2);
  return names.slice(0, count).map((name, i) => ({
    id: `coord-${townSlug}-${i}`,
    town_id: townSlug,
    status: 'active',
    earnings: {},
    display_name: name,
    phone: null,
    created_at: '2024-01-01T00:00:00Z',
  }));
}

function generateMetrics(town: Town): TownMetric {
  const seed = town.name.charCodeAt(0);
  return {
    id: `metric-${town.slug}`,
    town_id: town.id,
    youth_mapped: (seed % 500) + 50,
    active_coordinators: 1 + (seed % 3),
    open_opportunities: (seed % 10) + 3,
    active_signals: (seed % 20) + 5,
    updated_at: '2024-01-01T00:00:00Z',
  };
}

export async function getProvinces(): Promise<Province[]> {
  if (hasRealCredentials) {
    const { data, error } = await supabase.from('provinces').select('*');
    if (error) return mockProvinces;
    return data || mockProvinces;
  }
  return mockProvinces;
}

export async function getAllTowns(): Promise<Town[]> {
  if (hasRealCredentials) {
    const { data, error } = await supabase.from('towns').select('*');
    if (error) return mockTowns;
    return data || mockTowns;
  }
  return mockTowns;
}

export async function getTownBySlug(slug: string): Promise<Town | null> {
  if (hasRealCredentials) {
    const { data, error } = await supabase.from('towns').select('*').eq('slug', slug).single();
    if (error) return mockTowns.find(t => t.slug === slug) || null;
    return data || null;
  }
  return mockTowns.find(t => t.slug === slug) || null;
}

export async function getTownsByProvince(provinceSlug: string): Promise<Town[]> {
  if (hasRealCredentials) {
    const { data, error } = await supabase.from('towns').select('*').eq('province_id', provinceSlug);
    if (error) return mockTowns;
    return data || mockTowns;
  }
  const prov = mockProvinces.find(p => p.slug === provinceSlug);
  if (!prov) return mockTowns;
  return mockTowns.filter(t => t.province_id === prov.id);
}

export async function getOpportunitiesForTown(townSlug: string): Promise<Opportunity[]> {
  if (hasRealCredentials) {
    const { data, error } = await supabase.from('opportunities').select('*').eq('town_slug', townSlug);
    if (error) return generateOpportunities(townSlug);
    return data || generateOpportunities(townSlug);
  }
  return generateOpportunities(townSlug);
}

export async function getBusinessesForTown(townSlug: string): Promise<Business[]> {
  if (hasRealCredentials) {
    const { data, error } = await supabase.from('businesses').select('*').eq('town_slug', townSlug);
    if (error) return generateBusinesses(townSlug);
    return data || generateBusinesses(townSlug);
  }
  return generateBusinesses(townSlug);
}

export async function getSignalsForTown(townSlug: string): Promise<Signal[]> {
  if (hasRealCredentials) {
    const { data, error } = await supabase.from('town_signals').select('*').eq('town_slug', townSlug);
    if (error) return generateSignals(townSlug);
    return data || generateSignals(townSlug);
  }
  return generateSignals(townSlug);
}

export async function getCoordinatorsForTown(townSlug: string): Promise<Coordinator[]> {
  if (hasRealCredentials) {
    const { data, error } = await supabase.from('coordinators').select('*').eq('town_slug', townSlug);
    if (error) return generateCoordinators(townSlug);
    return data || generateCoordinators(townSlug);
  }
  return generateCoordinators(townSlug);
}

export async function getMetricsForTown(town: Town): Promise<TownMetric> {
  if (hasRealCredentials) {
    const { data, error } = await supabase.from('town_metrics').select('*').eq('town_slug', town.slug).single();
    if (error || !data) return generateMetrics(town);
    return data;
  }
  return generateMetrics(town);
}
