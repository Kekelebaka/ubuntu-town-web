// src/lib/e002/real.ts — EXPERIENCE 002 real-data layer (PUBLIC-ONLY).
// Access posture: read-only Supabase REST with the PUBLISHABLE/anon key. RLS decides.
// NO service-role, NO stored credentials, NO writes. Server-side only (never shipped to client).
// Truth classes: REAL / DERIVED / INSUFFICIENT ACCESS / NO RECORDS FOUND.

export type TruthClass = 'REAL' | 'DERIVED' | 'INSUFFICIENT ACCESS' | 'NO RECORDS FOUND' | 'UNVERIFIED';

export interface CanonicalTown {
  id: string;
  name: string;
  slug: string;
  province: string | null;
  status: string | null;
  recruitment_status: string | null;
  applicant_count: number | null;
  is_founding: boolean | null;
  public_self_approve: boolean | null;
  opportunity_notes: string | null;
  population_estimate: number | null;
  archetype: string | null;
  municipality_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegacyTownNarrative {
  id: string;
  name: string;
  slug: string;
  archetype: string | null;
  population_estimate: number | null;
  context: unknown; // JSON research notes (own provenance language)
  context_updated_at: string | null;
  coordinator_id: string | null;
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

async function restGet<T>(path: string, profile?: string): Promise<T[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('E002: Supabase public endpoint not configured');
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };
  if (profile) headers['Accept-Profile'] = profile;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers, next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`E002 read failed (${res.status}) for ${path}`);
  return (await res.json()) as T[];
}

/** REAL: the 81 canonical town rows (uto.towns). */
export async function getCanonicalTowns(): Promise<CanonicalTown[]> {
  return restGet<CanonicalTown>('towns?select=*&order=name', 'uto');
}

export async function getTownBySlug(slug: string): Promise<CanonicalTown | null> {
  const rows = await restGet<CanonicalTown>(`towns?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`, 'uto');
  return rows[0] ?? null;
}

/** REAL (legacy source): the 7 public.towns narrative rows. Joined to canonical by slug. */
export async function getLegacyNarratives(): Promise<LegacyTownNarrative[]> {
  return restGet<LegacyTownNarrative>('towns?select=*&order=name');
}

// ---------- DERIVED (computed from real rows; formulas are the product) ----------

export function provinceGroups(towns: CanonicalTown[]): { province: string; towns: CanonicalTown[] }[] {
  const map = new Map<string, CanonicalTown[]>();
  for (const t of towns) {
    const key = t.province ?? 'Unassigned';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return Array.from(map.entries()).map(([province, towns]) => ({ province, towns }))
    .sort((a, b) => b.towns.length - a.towns.length || a.province.localeCompare(b.province));
}

export function provinceSlug(province: string): string {
  return province.toLowerCase().replace(/\s+/g, '-');
}

export function geographyDeltas(towns: CanonicalTown[], windowDays: number, now = Date.now()) {
  const cutoff = now - windowDays * 86_400_000;
  const created = towns.filter((t) => Date.parse(t.created_at) >= cutoff);
  const updated = towns.filter((t) => Date.parse(t.updated_at) >= cutoff && Date.parse(t.created_at) < cutoff);
  return { windowDays, created, updated };
}

export function coverage() {
  return [
    { layer: 'GEOGRAPHY', state: 'AVAILABLE' as const, note: '81 canonical town records, read live from the canonical system.' },
    { layer: 'OPPORTUNITY CONTEXT', state: 'AVAILABLE' as const, note: '33 canonical records carry public opportunity notes.' },
    { layer: 'LEGACY NARRATIVE', state: 'AVAILABLE' as const, note: '7 researched narrative records (separate legacy source).' },
    { layer: 'MISSIONS', state: 'PROTECTED' as const, note: 'Records exist in the canonical system but are not available to this read-only public experience.' },
    { layer: 'WORK', state: 'PROTECTED' as const, note: 'Records exist in the canonical system but are not available to this read-only public experience.' },
    { layer: 'PROOF', state: 'PROTECTED' as const, note: 'Records exist in the canonical system but are not available to this read-only public experience.' },
    { layer: 'ROLE', state: 'PROTECTED' as const, note: 'Role assignments exist in the canonical system but are not available to this read-only public experience.' },
    { layer: 'MEMORY / SIGNALS', state: 'PROTECTED' as const, note: 'Records exist in the canonical system but are not available to this read-only public experience.' },
    { layer: 'LEARNINGS', state: 'NO RECORDS' as const, note: 'No records found — this object is absent from the canonical schema.' },
  ];
}

// ---------- Statement shapes (epistemic classes per CoS contract) ----------

export interface E002Statement {
  kind: 'computed' | 'inferred' | 'authored' | 'insufficient_evidence' | 'insufficient_access';
  text: string;
  evidence: string[]; // row ids / field names
  reasoning?: string;
  limitation?: string;
}

export function nationalStatements(towns: CanonicalTown[]): E002Statement[] {
  const provinces = provinceGroups(towns);
  const withNotes = towns.filter((t) => t.opportunity_notes).length;
  const founding = towns.filter((t) => t.is_founding).length;
  return [
    {
      kind: 'computed',
      text: `${towns.length} canonical town records are represented across ${provinces.length} provinces.`,
      evidence: ['uto.towns (live read)'],
      reasoning: 'Count of rows returned by the canonical geography source.',
      limitation: 'Canonical geography only. This is not the approved Blueprint cohort.',
    },
    {
      kind: 'computed',
      text: `${withNotes} of ${towns.length} canonical records carry public opportunity context.`,
      evidence: ['uto.towns.opportunity_notes'],
      reasoning: 'Rows with a non-empty opportunity_notes field.',
      limitation: 'Opportunity notes are context, not verified demand.',
    },
    {
      kind: 'computed',
      text: `${founding} canonical records carry the is_founding flag.`,
      evidence: ['uto.towns.is_founding'],
      reasoning: 'Count of rows where is_founding = true.',
      limitation: 'This flag is a canonical field. Its relationship to the approved Blueprint roster is unverified (governance decision pending).',
    },
    {
      kind: 'insufficient_evidence',
      text: 'Operational movement cannot be evaluated from geography alone.',
      evidence: [],
      limitation: 'No comparable prior state is available for missions, work, or proof — those records are not accessible to this experience.',
    },
  ];
}

export function townStatements(t: CanonicalTown): E002Statement[] {
  return [
    {
      kind: 'computed',
      text: `${t.name} is a canonical town record in ${t.province ?? 'an unassigned province'}, status "${t.status ?? 'unset'}", recruitment "${t.recruitment_status ?? 'unset'}".`,
      evidence: [t.id],
      reasoning: 'Direct read of the canonical town record fields.',
      limitation: 'Status fields describe the record, not operational activity.',
    },
    {
      kind: 'insufficient_access',
      text: 'Operational activity for this town cannot currently be evaluated.',
      evidence: [],
      limitation: 'Protected mission, work, proof and role records are not available to this read-only public experience. Authorised operational access would be required.',
    },
  ];
}
