#!/usr/bin/env node
/**
 * Ubuntu Town — Hero Photo URL Generator (No API Key Required)
 *
 * Generates source.unsplash.com URLs for all 111 towns in the project.
 * These URLs redirect to real Unsplash landscape photos matching the search query.
 * No API key needed — source.unsplash.com is a free, open endpoint.
 *
 * Usage: node scripts/fetch-hero-photos.mjs
 * Output: src/data/photos.json — mapping of slug → hero photo URL
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOWNS_PATH = path.join(__dirname, 'data', 'towns.js');
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'photos.json');

// Read and parse the TOWNS array from towns.js
const townsRaw = fs.readFileSync(TOWNS_PATH, 'utf8');

// Extract town entries using regex — matches name, slug, province_slug
const townRegex = /\{\s*name:\s*"([^"]+)",\s*slug:\s*"([^"]+)",\s*province_slug:\s*"([^"]+)"/g;
const towns = [];
let match;
while ((match = townRegex.exec(townsRaw)) !== null) {
  towns.push({ name: match[1], slug: match[2], province_slug: match[3] });
}

console.log(`📸 Ubuntu Town — Hero Photo URL Generator`);
console.log(`Found ${towns.length} towns in towns.js\n`);

// Search term overrides for towns that need specific landmarks
// Falls back to "{townName} south africa" for everything else
const SEARCH_OVERRIDES = {
  // === FREE STATE ===
  'bloemfontein': 'bloemfontein naval hill south africa',
  'ladybrand': 'ladybrand maloti mountains free state',
  'ficksburg': 'ficksburg cherry festival free state',
  'bethlehem': 'golden gate highlands free state',
  'clarens': 'clarens free state sandstone village',
  'kroonstad': 'kroonstad free state vaal river',
  'fouriesburg': 'sani pass maloti mountains free state',
  'golden-gate': 'golden gate highlands national park',
  'jagersfontein': 'diamond mine historic south africa',
  'reitz': 'free state sunflower farming',
  'lindley': 'free state grain fields countryside',
  'petrusburg': 'free state rural farming town',
  'villiers': 'free state highveld landscape',
  'heidelberg-fs': 'free state small town church',
  'staasiens': 'free state wheat fields farming',
  'philippolis': 'philippolis mission station free state',
  'trompsburg': 'free state sheep farming lesotho border',
  'springfontein': 'free state veld railway heritage',
  'smithfield': 'oliver tambo birthplace free state',
  'wepener': 'caledon river lesotho border free state',
  'thaba-nchu': 'thaba nchu basotho mountain free state',
  'mangaung': 'mangaung university free state city',

  // === WESTERN CAPE ===
  'cape-town': 'table mountain cape town waterfront',
  'stellenbosch': 'stellenbosch oak streets winelands',
  'paarl': 'paarl rock mountain winelands',
  'george': 'outeniqua mountains george garden route',
  'mossel-bay': 'mossel bay beach diaz museum',
  'knysna': 'knysna heads lagoon garden route',
  'plettenberg-bay': 'plettenberg bay robberg peninsula',
  'worcester': 'worcester western cape wine valley',
  'hermanus': 'hermanus whale watching south africa',
  'cango-caves': 'cango caves oudtshoorn stalactites',
  'swellendam': 'swellendam cape dutch architecture',
  'cederberg': 'cederberg rock formations wilderness',
  'hopefield': 'west coast wildflowers south africa',
  'citrusdal': 'citrusdal orange orchards cederberg',
  'porterville': 'porterville paragliding west coast',
  'langebaan': 'langebaan lagoon west coast',
  'george-west': 'western cape rural farming landscape',

  // === GAUTENG ===
  'johannesburg': 'johannesburg skyline nelson mandela bridge',
  'pretoria': 'pretoria union buildings jacaranda',
  'ekurhuleni': 'germiston gauteng industrial',
  'soweto': 'vilakazi street soweto orlando towers',
  'tembisa': 'tembisa township gauteng',
  'randburg': 'randburg northern johannesburg',
  'sandton': 'sandton city johannesburg mandela square',
  'centurion': 'centurion gauteng pretoria',
  'midrand': 'midrand conference centre gauteng',
  'mabopane': 'mabopane pretoria township',
  'mamelodi': 'mamelodi eastern pretoria',
  'soshanguve': 'soshanguve pretoria township',

  // === KWAZULU-NATAL ===
  'durban': 'durban golden mile beachfront mosess mabhida',
  'pietermaritzburg': 'pietermaritzburg city hall midlands',
  'newcastle': 'newcastle kwazulu natal mountains',
  'umlazi': 'umlazi durban township',
  'kwamashu': 'kwamashu durban township',
  'richards-bay': 'richards bay harbour kwazulu natal',
  'vryheid': 'vryheid battlefields kwazulu natal',
  'estcourt': 'estcourt drakensberg midlands kwazulu natal',
  'ladysmith': 'ladysmith siege battlefields kwazulu natal',
  'hluhluwe': 'hluhluwe imfolozi park big five',
  'st-lucia': 'st lucia estuary isimangaliso wetland',
  'port-shepstone': 'port shepstone oribi gorge south coast',

  // === LIMPOPO ===
  'polokwane': 'polokwane limpopo peter mokaba stadium',
  'thohoyandou': 'thohoyandou venda limpopo',
  'tzaneen': 'tzaneen magoebaskloof tropical limpopo',
  'mokopane': 'mokopane makapansgat limpopo bushveld',
  'giyani': 'giyani tsonga limpopo',
  'musina': 'musina baobab tree limpopo river',
  'phafula': 'limpopo mountains bushveld rural',
  'tubatse': 'tubatse mining limpopo sekhukhune',
  'limpopo-town': 'limpopo bushveld landscape',

  // === MPUMALANGA ===
  'nelspruit': 'nelspruit mbombela lowveld kruger',
  'emalahleni': 'emalahleni coal mining mpumalanga',
  'middelburg': 'middelburg mpumalanga highveld',
  'barberton': 'barberton greenstone belt mpumalanga',
  'sabie': 'sabie waterfall mpumalanga panorama route',
  'graskop': 'gods window panorama route mpumalanga',
  'pilgrims-rest': 'pilgrims rest historic gold mining village',
  'standerton': 'standerton vaal river mpumalanga',
  'secunda': 'secunda sasol mpumalanga industry',
  'eelands': 'mpumalanga nature reserve conservation',
  'badplaas': 'badplaas mineral springs mpumalanga',
  'lydenburg': 'lydenburg long tom pass mpumalanga',
  'witbank': 'witbank emalahleni coal mpumalanga',

  // === EASTERN CAPE ===
  'east-london': 'east london buffalo river eastern cape beach',
  'gqeberha': 'gqeberha port elizabeth shark rock pier',
  'mthatha': 'mthatha mandela museum wild coast',
  'grahamstown': 'makhanda national arts festival rhodes university',
  'kariega': 'kariega eastern cape beach addo',
  'port-alfred': 'port alfred kowie river eastern cape',
  'alice': 'university fort hare alice eastern cape',
  'komani': 'komani queenstown eastern cape',
  'port-st-johns': 'port st johns wild coast umzimvubu',
  'hogsback': 'hogsback waterfall amathole forest eastern cape',

  // === NORTH WEST ===
  'rustenburg': 'rustenburg pilanesberg sun city',
  'mafikeng': 'mafikeng museum north west',
  'klerksdorp': 'klerksdorp gold mining',
  'potchefstroom': 'potchefstroom dam north west',
  'ventersdorp': 'ventersdorp farming north west cattle',
  'lichtenburg': 'lichtenburg diamond north west sunflower',
  'coligny': 'coligny farming north west maize',
  'mahikeng': 'mahikeng north west capital university',

  // === NORTHERN CAPE ===
  'kimberley': 'kimberley big hole diamond mine',
  'upington': 'upington orange river kalahari',
  'springbok': 'springbok namaqualand wildflowers',
  'colesberg': 'colesberg karoo merino sheep',
  'de-aar': 'de aar railway junction karoo',
  'kuruman': 'kuruman eye spring moffat mission',
  'postmasburg': 'postmasburg iron ore kalahari',
};

/**
 * Build an Unsplash source URL for a given search query.
 * source.unsplash.com returns a random photo matching the query.
 * Adding ?{random} busts CDN cache so each page load gets a fresh image.
 */
function buildUnsplashUrl(query, seed = null) {
  const encoded = encodeURIComponent(query);
  const cacheBuster = seed ? `&sig=${seed}` : `&${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `https://source.unsplash.com/1200x800/?${encoded}${cacheBuster}`;
}

// Generate photo URLs for all towns
const photos = {};
let count = 0;

for (const town of towns) {
  const searchQuery = SEARCH_OVERRIDES[town.slug] || `${town.name} south africa`;
  photos[town.slug] = {
    url: buildUnsplashUrl(searchQuery, town.slug),
    query: searchQuery,
    town_name: town.name,
    province: town.province_slug,
  };
  count++;
}

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
fs.mkdirSync(outputDir, { recursive: true });

// Write the JSON file
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(photos, null, 2));

console.log(`✅ Generated hero photo URLs for ${count} towns`);
console.log(`📁 Output: ${OUTPUT_PATH}`);
console.log(`\n💡 These are source.unsplash.com URLs that redirect to real photos.`);
console.log(`   No API key required. Each URL returns a random matching landscape photo.\n`);

// Summary by province
const byProvince = {};
for (const town of towns) {
  if (!byProvince[town.province_slug]) byProvince[town.province_slug] = 0;
  byProvince[town.province_slug]++;
}
console.log('📊 Towns by province:');
for (const [prov, n] of Object.entries(byProvince).sort((a, b) => b[1] - a[1])) {
  console.log(`   ${prov}: ${n}`);
}
