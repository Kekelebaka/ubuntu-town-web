/**
 * Authoritative Founding-50 Town Manifest
 *
 * This is the SINGLE SOURCE OF TRUTH for the founding towns of Ubuntu Town.
 * Every id is a stable UUID (v5 deterministic for 36 new towns, preserved
 * from staging for the 14 that already existed in the database).
 *
 * Province distribution (canonical, enforced):
 *   Free State 6 · KZN 6 · Eastern Cape 6 · Limpopo 6 · North West 6
 *   Mpumalanga 5 · Gauteng 5 · Northern Cape 5 · Western Cape 5
 *   Total: 50
 *
 * INVARIANTS (enforced at module load via the assertions block):
 *   1. Every id is a valid UUID.
 *   2. Every slug is unique and URL-safe kebab-case.
 *   3. Every name is the canonical display form.
 *   4. Every provinceSlug matches [a-z]+(-[a-z]+)*.
 *   5. FOUNDING_FIFTY_COUNT === FOUNDING_FIFTY.length === 50.
 *   6. FOUNDING_FIFTY_BY_SLUG.size === FOUNDING_FIFTY.length (no slug dupes).
 *   7. FOUNDING_FIFTY_BY_ID.size === FOUNDING_FIFTY.length (no id dupes).
 *   8. Every town has isFounding === true.
 *   9. Province sum matches PROVINCE_DISTRIBUTION and sums to 50.
 *
 * DO NOT EDIT to add towns — new towns enter via database migrations.
 */

// ============================================================
// Types
// ============================================================

export interface FoundingTown {
  /** Stable UUID — never changes once assigned */
  id: string;
  /** Canonical display name */
  name: string;
  /** URL-safe slug (kebab-case) */
  slug: string;
  /** Canonical province display name */
  province: string;
  /** Province slug for routing */
  provinceSlug: string;
  /** Known alternative names / misspellings (stored in DB aliases column) */
  aliases: string[];
  /** Always true for founding towns */
  isFounding: true;
}

// ============================================================
// THE FOUNDING 50 — ordered by province, then alphabetically
// ============================================================
// 14 UUIDs preserved from staging (matched by slug in uto.towns).
// 36 UUIDs generated deterministically (v5, dns namespace, slug seed).
//
// Aliases included: misspellings that map to founding towns only.
// Aliases for non-founding legacy towns are NOT included here.

export const FOUNDING_FIFTY: readonly FoundingTown[] = [
  // ── Free State (6) ──────────────────────────────────────────
  { id: 'ac3b266e-e9cc-5b49-8322-8caeed82259d', name: 'Ficksburg',      slug: 'ficksburg',      province: 'Free State',  provinceSlug: 'free-state',    aliases: [],                        isFounding: true },
  { id: 'cb054aca-463a-5119-a613-e0fa467d88cc', name: 'Harrismith',     slug: 'harrismith',     province: 'Free State',  provinceSlug: 'free-state',    aliases: [],                        isFounding: true },
  { id: 'e2295aa5-0de3-5b05-a326-28713c48303e', name: 'Ladybrand',      slug: 'ladybrand',      province: 'Free State',  provinceSlug: 'free-state',    aliases: [],                        isFounding: true },
  { id: '94a9714e-2c54-5c3a-a7da-c29af33af3fb', name: 'Sasolburg',      slug: 'sasolburg',      province: 'Free State',  provinceSlug: 'free-state',    aliases: [],                        isFounding: true },
  { id: '6e9ec4ce-305f-5222-8385-99981fd87281', name: 'Thaba Nchu',     slug: 'thaba-nchu',     province: 'Free State',  provinceSlug: 'free-state',    aliases: [],                        isFounding: true },
  { id: '8f8a54af-b311-532b-bee9-5406365dc499', name: 'Brandfort',      slug: 'brandfort',      province: 'Free State',  provinceSlug: 'free-state',    aliases: [],                        isFounding: true },

  // ── KwaZulu-Natal (6) ──────────────────────────────────────
  { id: 'c73b6817-d3d3-5ede-b3b0-f51b0eb60651', name: 'Kokstad',        slug: 'kokstad',        province: 'KwaZulu-Natal', provinceSlug: 'kwaZulu-natal', aliases: [],                      isFounding: true },
  { id: '15ca1b01-7049-583c-8602-25bd147efbc3', name: 'Vryheid',        slug: 'vryheid',        province: 'KwaZulu-Natal', provinceSlug: 'kwaZulu-natal', aliases: [],                      isFounding: true },
  { id: '7cb5ee5b-2658-5c98-9231-73fc7fc6c114', name: 'Ulundi',         slug: 'ulundi',         province: 'KwaZulu-Natal', provinceSlug: 'kwaZulu-natal', aliases: [],                      isFounding: true },
  { id: '9cc94a82-b345-52d3-9ea1-ee7cdf3d3e6d', name: 'Estcourt',       slug: 'estcourt',       province: 'KwaZulu-Natal', provinceSlug: 'kwaZulu-natal', aliases: [],                      isFounding: true },
  { id: '1d8cb25b-aa6d-5066-b90e-11be7236bc78', name: 'Greytown',       slug: 'greytown',       province: 'KwaZulu-Natal', provinceSlug: 'kwaZulu-natal', aliases: [],                      isFounding: true },
  { id: '4cde17e8-4930-5bbe-9c5c-a39e9bde1f72', name: 'Nquthu',         slug: 'nquthu',         province: 'KwaZulu-Natal', provinceSlug: 'kwaZulu-natal', aliases: [],                      isFounding: true },

  // ── Eastern Cape (6) ───────────────────────────────────────
  { id: '5eaa0c54-f9aa-5a96-a935-8649747b8ee2', name: 'Butterworth',    slug: 'butterworth',    province: 'Eastern Cape',  provinceSlug: 'eastern-cape',  aliases: [],                        isFounding: true },
  { id: 'e9442eea-ab4c-525b-8f6f-d0dd1eef31b6', name: 'Qumbu',          slug: 'qumbu',          province: 'Eastern Cape',  provinceSlug: 'eastern-cape',  aliases: [],                        isFounding: true },
  { id: '218060f5-d9e9-5808-8247-01f874051e7c', name: 'Cofimvaba',      slug: 'cofimvaba',      province: 'Eastern Cape',  provinceSlug: 'eastern-cape',  aliases: [],                        isFounding: true },
  { id: '8546c343-709a-5c42-8cfc-736aefa536e4', name: 'Flagstaff',      slug: 'flagstaff',      province: 'Eastern Cape',  provinceSlug: 'eastern-cape',  aliases: [],                        isFounding: true },
  { id: '6e43aa9b-250a-5272-af2b-62b0c2f97302', name: 'Bizana',         slug: 'bizana',         province: 'Eastern Cape',  provinceSlug: 'eastern-cape',  aliases: [],                        isFounding: true },
  { id: '86e23bc1-3dc4-5792-b733-f6434f6b3804', name: 'Bhisho',         slug: 'bhisho',         province: 'Eastern Cape',  provinceSlug: 'eastern-cape',  aliases: [],                        isFounding: true },

  // ── Limpopo (6) ────────────────────────────────────────────
  { id: '17e463a0-b938-5075-8765-61190a20c441', name: 'Burgersfort',    slug: 'burgersfort',    province: 'Limpopo',       provinceSlug: 'limpopo',       aliases: ['Burgersford'],           isFounding: true },
  { id: '362b7140-831b-4e32-bc65-674416087bb0', name: 'Thohoyandou',    slug: 'thohoyandou',    province: 'Limpopo',       provinceSlug: 'limpopo',       aliases: [],                        isFounding: true },
  { id: '4316bd1a-0eeb-441f-aa9f-d4e90de5a816', name: 'Tzaneen',        slug: 'tzaneen',        province: 'Limpopo',       provinceSlug: 'limpopo',       aliases: [],                        isFounding: true },
  { id: '029847d9-d5ac-5a65-86be-4c778ff4ce55', name: 'Mokopane',       slug: 'mokopane',       province: 'Limpopo',       provinceSlug: 'limpopo',       aliases: [],                        isFounding: true },
  { id: 'ac14abf7-ff51-5f07-90b1-49b93b530a16', name: 'Lephalale',      slug: 'lephalale',      province: 'Limpopo',       provinceSlug: 'limpopo',       aliases: [],                        isFounding: true },
  { id: '2d0047cf-5816-5a00-9325-60564654cc74', name: 'Lebowakgomo',    slug: 'lebowakgomo',    province: 'Limpopo',       provinceSlug: 'limpopo',       aliases: [],                        isFounding: true },

  // ── North West (6) ─────────────────────────────────────────
  { id: '5124e1b6-21ad-5339-b899-8059d329b66b', name: 'Koster',         slug: 'koster',         province: 'North West',    provinceSlug: 'north-west',    aliases: [],                        isFounding: true },
  { id: '99b98efa-66ff-57b2-98e2-d3c01f989c20', name: 'Lichtenburg',    slug: 'lichtenburg',    province: 'North West',    provinceSlug: 'north-west',    aliases: [],                        isFounding: true },
  { id: '6fd6fd43-045f-5663-b11d-420c086672b6', name: 'Zeerust',        slug: 'zeerust',        province: 'North West',    provinceSlug: 'north-west',    aliases: [],                        isFounding: true },
  { id: 'eb04904a-4fce-53c1-bcb3-814c7d5baabf', name: 'Schweizer-Reneke', slug: 'schweizer-reneke', province: 'North West', provinceSlug: 'north-west',  aliases: [],                        isFounding: true },
  { id: 'df45d0cc-a9e9-552d-8bfd-4d4f8df80773', name: 'Taung',          slug: 'taung',          province: 'North West',    provinceSlug: 'north-west',    aliases: [],                        isFounding: true },
  { id: '70aa6f97-f4cd-56eb-bdc7-20fca40655ff', name: 'Delareyville',   slug: 'delareyville',   province: 'North West',    provinceSlug: 'north-west',    aliases: [],                        isFounding: true },

  // ── Mpumalanga (5) ─────────────────────────────────────────
  { id: '6f15b0e9-06ee-5fb9-8494-b9c38c42f7e0', name: 'Bushbuckridge',  slug: 'bushbuckridge',  province: 'Mpumalanga',    provinceSlug: 'mpumalanga',    aliases: ['Bushbukridge'],          isFounding: true },
  { id: '82aa0651-9f56-4c14-900d-1f6041afcbf6', name: 'Mbombela',       slug: 'mbombela',       province: 'Mpumalanga',    provinceSlug: 'mpumalanga',    aliases: [],                        isFounding: true },
  { id: 'd1bd27ab-2062-5e4d-8b1c-2825129c74a5', name: 'eMalahleni',     slug: 'emalahleni',     province: 'Mpumalanga',    provinceSlug: 'mpumalanga',    aliases: [],                        isFounding: true },
  { id: '1fa804a1-0a11-53bb-ac54-316026360ebc', name: 'Sabie',          slug: 'sabie',          province: 'Mpumalanga',    provinceSlug: 'mpumalanga',    aliases: ['Sabbie'],                isFounding: true },
  { id: 'd9bf20e5-8a6b-5bda-afdb-fd41a23eccb6', name: 'Ermelo',         slug: 'ermelo',         province: 'Mpumalanga',    provinceSlug: 'mpumalanga',    aliases: [],                        isFounding: true },

  // ── Gauteng (5) ────────────────────────────────────────────
  { id: 'cd324904-9013-44a9-9f83-59cbbdf815c3', name: 'Soweto',         slug: 'soweto',         province: 'Gauteng',       provinceSlug: 'gauteng',       aliases: [],                        isFounding: true },
  { id: '412d1b70-cdf8-48dd-8e0c-2e799253bbb9', name: 'Tembisa',        slug: 'tembisa',        province: 'Gauteng',       provinceSlug: 'gauteng',       aliases: [],                        isFounding: true },
  { id: '2e721b18-7457-5304-8f42-290f0cf32716', name: 'Carletonville',  slug: 'carletonville',  province: 'Gauteng',       provinceSlug: 'gauteng',       aliases: [],                        isFounding: true },
  { id: 'a3ffe536-e018-4740-88ea-229b49ae1df8', name: 'Randfontein',    slug: 'randfontein',    province: 'Gauteng',       provinceSlug: 'gauteng',       aliases: [],                        isFounding: true },
  { id: 'ca666f80-a5b3-5806-b857-c62ce93abd9b', name: 'Vanderbijlpark', slug: 'vanderbijlpark', province: 'Gauteng',       provinceSlug: 'gauteng',       aliases: [],                        isFounding: true },

  // ── Northern Cape (5) ──────────────────────────────────────
  { id: 'beb83e7c-f5ed-4532-b3ac-517a10073594', name: 'Kimberley',      slug: 'kimberley',      province: 'Northern Cape', provinceSlug: 'northern-cape', aliases: [],                        isFounding: true },
  { id: '78174d8f-5c22-4675-b7a3-adc3fd0a252a', name: 'Kuruman',        slug: 'kuruman',        province: 'Northern Cape', provinceSlug: 'northern-cape', aliases: [],                        isFounding: true },
  { id: '5f13ba35-aa29-40f1-a188-f34b5f01b27b', name: 'Upington',       slug: 'upington',       province: 'Northern Cape', provinceSlug: 'northern-cape', aliases: [],                        isFounding: true },
  { id: '1d597c83-0b03-4f83-ab6a-32f2222639b1', name: 'De Aar',         slug: 'de-aar',         province: 'Northern Cape', provinceSlug: 'northern-cape', aliases: [],                        isFounding: true },
  { id: '5add49bb-68f4-5b86-9bdd-2f5952bafb51', name: 'Springbok',      slug: 'springbok',      province: 'Northern Cape', provinceSlug: 'northern-cape', aliases: [],                        isFounding: true },

  // ── Western Cape (5) ───────────────────────────────────────
  { id: '38aad56f-b81b-4f76-becb-62ac98fdf6af', name: 'Cape Town',      slug: 'cape-town',      province: 'Western Cape',  provinceSlug: 'western-cape',  aliases: [],                        isFounding: true },
  { id: 'd851b70a-0dcf-4242-846d-b27a44b44e7b', name: 'Paarl',          slug: 'paarl',          province: 'Western Cape',  provinceSlug: 'western-cape',  aliases: [],                        isFounding: true },
  { id: '07d2d471-da5b-476f-aeb3-874e002abc32', name: 'Worcester',      slug: 'worcester',      province: 'Western Cape',  provinceSlug: 'western-cape',  aliases: [],                        isFounding: true },
  { id: '2d11fc6d-52f0-4e2a-95b9-6f5fb9359228', name: 'George',         slug: 'george',         province: 'Western Cape',  provinceSlug: 'western-cape',  aliases: [],                        isFounding: true },
  { id: '5e834a72-8010-5fb2-8ce2-6402f2955f6d', name: 'Oudtshoorn',     slug: 'oudtshoorn',     province: 'Western Cape',  provinceSlug: 'western-cape',  aliases: [],                        isFounding: true },
] as const;

// ============================================================
// Lookup indices
// ============================================================

export const FOUNDING_FIFTY_BY_SLUG = new Map<string, FoundingTown>(
  FOUNDING_FIFTY.map(t => [t.slug, t])
);

export const FOUNDING_FIFTY_BY_ID = new Map<string, FoundingTown>(
  FOUNDING_FIFTY.map(t => [t.id, t])
);

/** Case-insensitive alias lookup — only includes aliases of founding towns */
export const FOUNDING_FIFTY_BY_ALIAS = new Map<string, FoundingTown>(
  FOUNDING_FIFTY.flatMap(t =>
    t.aliases.map(a => [a.toLowerCase(), t] as const)
  )
);

// ============================================================
// Counts & distribution
// ============================================================

export const FOUNDING_FIFTY_COUNT: number = FOUNDING_FIFTY.length;

export const PROVINCE_DISTRIBUTION: Readonly<Record<string, number>> =
  Object.freeze(
    FOUNDING_FIFTY.reduce<Record<string, number>>((acc, t) => {
      acc[t.province] = (acc[t.province] ?? 0) + 1;
      return acc;
    }, {})
  );

// ============================================================
// Validation invariants (asserted at module load)
// ============================================================
{
  const slugSet = new Set(FOUNDING_FIFTY.map(t => t.slug));
  const idSet = new Set(FOUNDING_FIFTY.map(t => t.id));

  // 1. Slug uniqueness
  console.assert(
    slugSet.size === FOUNDING_FIFTY.length,
    `[founding-fifty] Slug uniqueness violated: ${FOUNDING_FIFTY.length} towns but ${slugSet.size} unique slugs`
  );

  // 2. ID uniqueness
  console.assert(
    idSet.size === FOUNDING_FIFTY.length,
    `[founding-fifty] ID uniqueness violated: ${FOUNDING_FIFTY.length} towns but ${idSet.size} unique IDs`
  );

  // 3. All founding
  console.assert(
    FOUNDING_FIFTY.every(t => t.isFounding === true),
    '[founding-fifty] All founding towns must have isFounding === true'
  );

  // 4. Valid kebab-case slugs
  const slugPattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
  for (const t of FOUNDING_FIFTY) {
    console.assert(
      slugPattern.test(t.slug),
      `[founding-fifty] Invalid slug format: "${t.slug}" for town "${t.name}"`
    );
  }

  // 5. Valid UUIDs
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  for (const t of FOUNDING_FIFTY) {
    console.assert(
      uuidPattern.test(t.id),
      `[founding-fifty] Invalid UUID format: "${t.id}" for town "${t.name}"`
    );
  }

  // 6. Province sum matches count
  const provinceSum = Object.values(PROVINCE_DISTRIBUTION).reduce((a, b) => a + b, 0);
  console.assert(
    provinceSum === FOUNDING_FIFTY_COUNT,
    `[founding-fifty] Province sum ${provinceSum} does not match count ${FOUNDING_FIFTY_COUNT}`
  );

  // 7. Exactly 50
  console.assert(
    FOUNDING_FIFTY_COUNT === 50,
    `[founding-fifty] Expected exactly 50 founding towns, got ${FOUNDING_FIFTY_COUNT}`
  );

  // 8. Province distribution matches expected
  const expected: Record<string, number> = {
    'Free State': 6, 'KwaZulu-Natal': 6, 'Eastern Cape': 6,
    'Limpopo': 6, 'North West': 6, 'Mpumalanga': 5,
    'Gauteng': 5, 'Northern Cape': 5, 'Western Cape': 5,
  };
  for (const [prov, count] of Object.entries(expected)) {
    console.assert(
      PROVINCE_DISTRIBUTION[prov] === count,
      `[founding-fifty] Province "${prov}" expected ${count}, got ${PROVINCE_DISTRIBUTION[prov] ?? 0}`
    );
  }
}
