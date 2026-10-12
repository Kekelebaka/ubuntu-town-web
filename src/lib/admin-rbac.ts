// src/lib/admin-rbac.ts — ADMINISTRATION: pure role-bridge + write-intent logic (testable).
// The product role families (COORDINATOR · INITIATIVE HEAD · UBUNTU TOWN STAFF) map onto the
// schema's role_key enum at THIS layer. The schema is never rewritten; the bridge is documented
// (contradiction D-02). Every write intent is previewable before a human confirms it.

export const ROLE_KEY_ENUM = [
  'admin', 'ops', 'coordinator', 'deputy', 'ambassador', 'media', 'partner', 'sponsor', 'viewer',
] as const;
export type RoleKey = (typeof ROLE_KEY_ENUM)[number];

export interface RoleFamily {
  key: string;
  label: string;
  roleKey: RoleKey;
  scope: 'town' | 'initiative' | 'national' | 'town-optional';
  description: string;
  bridgeNote: string;
}

export const ROLE_FAMILIES: RoleFamily[] = [
  {
    key: 'coordinator',
    label: 'Coordinator',
    roleKey: 'coordinator',
    scope: 'town',
    description: 'Town execution — operates one town across its initiative cells.',
    bridgeNote: 'role_key = coordinator · town_id required · creates/updates the coordinators record.',
  },
  {
    key: 'deputy-coordinator',
    label: 'Deputy Coordinator',
    roleKey: 'deputy',
    scope: 'town',
    description: 'Deputises for the town coordinator.',
    bridgeNote: 'role_key = deputy · town_id required.',
  },
  {
    key: 'initiative-head',
    label: 'Initiative Head',
    roleKey: 'ops',
    scope: 'initiative',
    description: 'Initiative ownership — owns the operating model, BMC and town deployments of one canonical initiative.',
    bridgeNote:
      'BRIDGE (D-02): the schema has no initiative-scoped role_key and role_assignments has no ' +
      'initiative column — so this writes role_key = ops with town_id NULL and records the ' +
      'initiative scope in profiles.facts.initiative_scope. A schema-native initiative scope is a ' +
      'reconciliation requirement (G3), not a reason to invent a column.',
  },
  {
    key: 'staff',
    label: 'Ubuntu Town Staff',
    roleKey: 'ops',
    scope: 'national',
    description: 'National / shared functions — economics, learning, education, media, ecosystem, growth.',
    bridgeNote: 'role_key = ops · town_id NULL (national scope).',
  },
  {
    key: 'hq-admin',
    label: 'National Admin (HQ)',
    roleKey: 'admin',
    scope: 'national',
    description: 'Top administration — grants roles, maintains town records, oversees the network.',
    bridgeNote: 'role_key = admin · town_id NULL — satisfies uto.is_hq() and app.is_national().',
  },
  {
    key: 'media',
    label: 'Media',
    roleKey: 'media',
    scope: 'town-optional',
    description: 'Town media and storytelling.',
    bridgeNote: 'role_key = media · town_id optional.',
  },
  {
    key: 'ambassador',
    label: 'Ambassador',
    roleKey: 'ambassador',
    scope: 'town-optional',
    description: 'Represents Ubuntu Town in an ecosystem.',
    bridgeNote: 'role_key = ambassador · town_id optional.',
  },
];

export function familyByKey(key: string): RoleFamily | undefined {
  return ROLE_FAMILIES.find((f) => f.key === key);
}

// ---------------------------------------------------------------------------
// WRITE INTENT — exactly what a grant will write, computed before the human confirms.
// ---------------------------------------------------------------------------
export interface GrantIntent {
  action: 'grant-role';
  userEmail: string;
  userId: string;
  roleFamily: RoleFamily;
  townId: string | null;
  townName: string | null;
  initiativeKey: string | null;
  personName: string;
  phone: string | null;
}

export function validateGrant(input: {
  email: string;
  familyKey: string;
  townId?: string | null;
  townName?: string | null;
  initiativeKey?: string | null;
  personName: string;
}): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const family = familyByKey(input.familyKey);
  if (!input.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email)) errors.push('A valid email is required to locate the person\'s account.');
  if (!input.personName || input.personName.trim().length < 2) errors.push('The person\'s full name is required.');
  if (!family) errors.push('Select a role family.');
  if (family && family.scope === 'town' && !input.townId) errors.push(`${family.label} requires a town — scope is never assumed.`);
  if (family && family.scope === 'initiative' && !input.initiativeKey) errors.push('Initiative Head requires an initiative — scope is never assumed.');
  return errors.length ? { ok: false, errors } : { ok: true };
}

export function describeGrant(intent: GrantIntent): string[] {
  const lines = [
    `1. role_assignments ← INSERT { user_id: ${intent.userId} (${intent.personName}), role_key: "${intent.roleFamily.roleKey}", town_id: ${intent.townId ?? 'NULL'}, granted_by: <the signed-in admin> }`,
  ];
  if (intent.roleFamily.roleKey === 'coordinator' || intent.roleFamily.roleKey === 'deputy') {
    lines.push(`2. coordinators ← UPSERT { id: ${intent.userId}, display_name: "${intent.personName}", town_id: ${intent.townId}, status: "active"${intent.phone ? `, phone: "${intent.phone}"` : ''} }`);
    lines.push('3. users.primary_role ← UPDATE to the granted role_key');
  } else if (intent.roleFamily.scope === 'initiative') {
    lines.push(`2. profiles.facts ← MERGE { initiative_scope: "${intent.initiativeKey}" } (D-02 bridge — schema has no initiative column)`);
    lines.push('3. users.primary_role ← UPDATE to "ops"');
  } else {
    lines.push('2. users.primary_role ← UPDATE to the granted role_key');
  }
  lines.push('Authority: admin_all (is_admin()) RLS — the database decides. No service role is used.');
  return lines;
}

// ---------------------------------------------------------------------------

// TOWN EDIT INTENT — editable vs governance-locked fields
// ---------------------------------------------------------------------------
export interface TownEditField {
  name: string;
  label: string;
  table: 'uto.towns' | 'public.towns';
  type: 'text' | 'textarea' | 'number' | 'select';
  options?: string[];
  locked?: boolean;
  note?: string;
}

export const TOWN_EDIT_FIELDS: TownEditField[] = [
  { name: 'status', label: 'Record status', table: 'uto.towns', type: 'select', options: ['recruit', 'launch'], note: 'Canonical operational state.' },
  { name: 'recruitment_status', label: 'Recruitment status', table: 'uto.towns', type: 'text' },
  { name: 'applicant_count', label: 'Applicant count', table: 'uto.towns', type: 'number' },
  { name: 'opportunity_notes', label: 'Opportunity notes', table: 'uto.towns', type: 'textarea', note: 'Real signal object — surfaced on the town page.' },
  { name: 'is_founding', label: 'Founding flag', table: 'uto.towns', type: 'select', options: ['true', 'false'], locked: true, note: 'GOVERNANCE-LOCKED (G4): the founding flag is roster evidence, not an editable setting. Changes require the ratified Blueprint roster decision.' },
  { name: 'public_self_approve', label: 'Public self-approve', table: 'uto.towns', type: 'select', options: ['true', 'false'], locked: true, note: 'GOVERNANCE-LOCKED: a permissions-bearing flag — changing it is a consequential authorisation decision.' },
];

export function validateTownEdit(values: Record<string, string>): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if ('applicant_count' in values && values.applicant_count !== '' && !/^\d+$/.test(values.applicant_count)) {
    errors.push('Applicant count must be a whole number — or leave it unchanged.');
  }
  for (const f of TOWN_EDIT_FIELDS) {
    if (f.locked && f.name in values) errors.push(`${f.label} is governance-locked and cannot be changed here.`);
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}

export function describeTownEdit(townName: string, changes: Record<string, string>): string[] {
  const lines = Object.entries(changes).map(([k, v], i) => `${i + 1}. uto.towns.${k} ← "${v}" (town: ${townName})`);
  lines.push('Authority: the signed-in session must pass uto.is_hq() AND the database update policy (RLS) must allow the write. The database decides.');
  return lines;
}
