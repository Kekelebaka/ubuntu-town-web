// src/lib/e003/registry.ts — CANONICAL INITIATIVE REGISTRY (Blueprint = portfolio authority).
// The canonical ten names are EXACT (governing directive). A Supabase row does NOT become an
// approved initiative merely because it exists. Conflicts are marked, never silently reconciled.

export type ReconciliationState =
  | 'DB RECORD LINKED'                      // documented exact/variant name match
  | 'POSSIBLE BLUEPRINT MATCH — UNRESOLVED' // evidence suggests but equivalence NOT fabricated
  | 'BLUEPRINT INITIATIVE — DATABASE RECORD ABSENT'
  | 'DATABASE-ONLY RECORD';                 // exists in DB, not in the canonical ten

export interface CanonicalInitiative {
  key: string;            // stable OS key
  name: string;           // EXACT canonical name (Blueprint)
  purpose: string | null; // canonical purpose when legitimately sourced — never invented copy
  purposeSource: 'BLUEPRINT' | 'SUPABASE DESCRIPTION' | 'NOT MATERIALIZED';
  dbKey: string | null;   // linked public.initiatives key, if documented
  dbRow: { key: string; name: string; tagline: string; description: string; badge: string } | null;
  reconciliation: ReconciliationState;
  reconciliationNote: string;
}

// The canonical ten (exact names per governing directive).
export const CANONICAL_TEN: CanonicalInitiative[] = [
  {
    key: 'daycare', name: 'Daycare',
    purpose: 'The Digital Operating System for Early Childhood Development.',
    purposeSource: 'SUPABASE DESCRIPTION',
    dbKey: 'daycareos',
    dbRow: { key: 'daycareos', name: 'DaycareOS', tagline: 'The Digital Operating System for Early Childhood Development.', description: 'Early childhood development activation engine.', badge: 'PATHWAY' },
    reconciliation: 'POSSIBLE BLUEPRINT MATCH — UNRESOLVED',
    reconciliationNote: 'DB row "DaycareOS" may or may not be this initiative (branding diverges; DaycareOS also names a separate product in the estate). Equivalence NOT fabricated — human decision required (C-01).',
  },
  {
    key: 'family-house', name: 'Family House',
    purpose: 'Strong Families. Strong Communities.',
    purposeSource: 'SUPABASE DESCRIPTION',
    dbKey: 'familyhouse',
    dbRow: { key: 'familyhouse', name: 'FamilyHouse', tagline: 'Strong Families. Strong Communities.', description: 'Family support activation engine.', badge: 'PATHWAY' },
    reconciliation: 'DB RECORD LINKED',
    reconciliationNote: 'Variant spelling only (familyhouse). Display name follows the canonical "Family House".',
  },
  {
    key: 'framesouth', name: 'FrameSouth',
    purpose: 'Capture the Story of Your Town.',
    purposeSource: 'SUPABASE DESCRIPTION',
    dbKey: 'framesouth',
    dbRow: { key: 'framesouth', name: 'FrameSouth', tagline: 'Capture the Story of Your Town.', description: 'Town media activation engine.', badge: 'PATHWAY' },
    reconciliation: 'DB RECORD LINKED', reconciliationNote: 'Exact name match.',
  },
  {
    key: 'kasibuy', name: 'KasiBuy',
    purpose: 'Support Local. Buy Local. Grow Local.',
    purposeSource: 'SUPABASE DESCRIPTION',
    dbKey: 'kasibuy',
    dbRow: { key: 'kasibuy', name: 'KasiBuy', tagline: 'Support Local. Buy Local. Grow Local.', description: 'Township commerce mapped into local buying power.', badge: 'PATHWAY' },
    reconciliation: 'DB RECORD LINKED', reconciliationNote: 'Exact name match.',
  },
  {
    key: 'insidetown', name: 'InsideTown',
    purpose: null, purposeSource: 'NOT MATERIALIZED',
    dbKey: null, dbRow: null,
    reconciliation: 'BLUEPRINT INITIATIVE — DATABASE RECORD ABSENT',
    reconciliationNote: 'No catalog row. "Inside.Town Media" appears in canonical town opportunity notes (context, not a portfolio record). Purpose text requires the Blueprint source — NOT invented here.',
  },
  {
    key: 'orbit-music', name: 'Orbit Music',
    purpose: 'Celebrate Local Creative Talent.',
    purposeSource: 'SUPABASE DESCRIPTION',
    dbKey: 'orbit-music',
    dbRow: { key: 'orbit-music', name: 'Orbit Music', tagline: 'Celebrate Local Creative Talent.', description: 'Creative talent activation engine.', badge: 'PATHWAY' },
    reconciliation: 'DB RECORD LINKED', reconciliationNote: 'Exact name match.',
  },
  {
    key: 'fixeasy', name: 'FixEasy',
    purpose: 'Every Repair Creates Opportunity.',
    purposeSource: 'SUPABASE DESCRIPTION',
    dbKey: 'fixeasy',
    dbRow: { key: 'fixeasy', name: 'FixEasy', tagline: 'Every Repair Creates Opportunity.', description: 'Constraint-to-action repair economy engine.', badge: 'PATHWAY' },
    reconciliation: 'DB RECORD LINKED', reconciliationNote: 'Exact name match.',
  },
  {
    key: 'ai-cafe', name: 'AI Cafe',
    purpose: 'Making AI Useful for Every Community.',
    purposeSource: 'SUPABASE DESCRIPTION',
    dbKey: 'ai-cafe',
    dbRow: { key: 'ai-cafe', name: 'AI Café', tagline: 'Making AI Useful for Every Community.', description: 'Community AI utility engine.', badge: 'PATHWAY' },
    reconciliation: 'DB RECORD LINKED',
    reconciliationNote: 'Variant spelling only (AI Café). Display name follows the canonical "AI Cafe".',
  },
  {
    key: 'ubuntu-socials', name: 'Ubuntu Socials',
    purpose: null, purposeSource: 'NOT MATERIALIZED',
    dbKey: null, dbRow: null,
    reconciliation: 'BLUEPRINT INITIATIVE — DATABASE RECORD ABSENT',
    reconciliationNote: 'DB row "Buntu Bar" ("Where the community gathers.") may or may not be this initiative — equivalence NOT fabricated. Purpose text requires the Blueprint source (C-01).',
  },
  {
    key: 'jeff', name: 'Jeff',
    purpose: null, purposeSource: 'NOT MATERIALIZED',
    dbKey: null, dbRow: null,
    reconciliation: 'BLUEPRINT INITIATIVE — DATABASE RECORD ABSENT',
    reconciliationNote: 'No catalog row. Purpose text requires the Blueprint source — NOT invented here.',
  },
];

// Real DB rows with no canonical counterpart (rendered ONLY in reconciliation contexts).
export const DATABASE_ONLY_ROWS = [
  { key: 'ubuntu-town', name: 'Ubuntu Town', tagline: 'One Town. Many Hands. Real Opportunities.', badge: 'PLATFORM', note: 'The operating platform itself — not one of the ten activation engines.' },
  { key: 'job-fixer', name: 'Job Fixer', tagline: 'Every CV is a door.', badge: 'PATHWAY', note: 'DATABASE-ONLY RECORD — portfolio status unreconciled. Never presented as canonical.' },
  { key: 'ubuntu-academy', name: 'Ubuntu Academy', tagline: 'Skills Create Opportunity.', badge: 'PATHWAY', note: 'DATABASE-ONLY RECORD — portfolio status unreconciled.' },
  { key: 'ecochar', name: 'EcoChar', tagline: 'Waste to Wealth. Sustainable Charcoal.', badge: 'PATHWAY', note: 'DATABASE-ONLY RECORD — portfolio status unreconciled.' },
  { key: 'buntu-bar', name: 'Buntu Bar', tagline: 'Where the community gathers.', badge: 'PATHWAY', note: 'DATABASE-ONLY RECORD — possible relation to "Ubuntu Socials" is UNRESOLVED (see C-01). Never merged.' },
];

export const RECONCILIATION_SUMMARY = {
  canonicalTotal: 10,
  dbCatalogRows: 12,
  linked: CANONICAL_TEN.filter((c) => c.reconciliation === 'DB RECORD LINKED').length,
  possibleUnresolved: CANONICAL_TEN.filter((c) => c.reconciliation === 'POSSIBLE BLUEPRINT MATCH — UNRESOLVED').length,
  dbAbsent: CANONICAL_TEN.filter((c) => c.reconciliation === 'BLUEPRINT INITIATIVE — DATABASE RECORD ABSENT').length,
  dbOnly: DATABASE_ONLY_ROWS.length,
};

export function initiativeByKey(key: string): CanonicalInitiative | undefined {
  return CANONICAL_TEN.find((c) => c.key === key);
}
