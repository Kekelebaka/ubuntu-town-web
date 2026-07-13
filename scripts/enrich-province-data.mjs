#!/usr/bin/env node
/**
 * enrich-province-data.mjs
 * 
 * Reads scripts/data/towns.js (which has GPS coords + descriptions for 111 towns)
 * and enriches the province JSON files with this data.
 * 
 * Also adds province-level hero images and descriptions.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PROJ_ROOT = process.cwd();
const DATA_DIR = join(PROJ_ROOT, 'src/data/provinces');

// Import towns data (it's a JS module exporting TOWNS array)
const townsModulePath = join(PROJ_ROOT, 'scripts/data/towns.js');
const townsContent = readFileSync(townsModulePath, 'utf-8');
// Extract the TOWNS array by evaluating the module
const TOWNS = (() => {
  // The file exports a const TOWNS = [...] — extract it
  const match = townsContent.match(/const TOWNS = (\[[\s\S]*?\]);/);
  if (!match) throw new Error('Could not parse TOWNS from towns.js');
  return eval(match[1]);
})();

// Province hero images (Unsplash search terms for each province)
const PROVINCE_HEROS = {
  'free-state': { hero_image: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=1200&q=80', hero_query: 'free state south africa landscape', description: 'The heartland of South Africa, where golden grasslands stretch to the horizon and sandstone towns hold centuries of stories. Free State is home to 22 towns across rolling farmlands, the Maluti Mountains, and the Golden Gate Highlands.' },
  'western-cape': { hero_image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=80', hero_query: 'table mountain cape town', description: 'From the iconic Table Mountain to the Garden Route, the Western Cape blends world-class natural beauty with a thriving innovation economy. 17 towns from Cape Town to the Cederberg form the backbone of South Africa\'s tourism and tech capital.' },
  'gauteng': { hero_image: 'https://images.unsplash.com/photo-1577992804682-8e7d2c5dca3d?w=1200&q=80', hero_query: 'johannesburg skyline sunset', description: 'Africa\'s economic powerhouse. Johannesburg, Pretoria, and 11 more towns drive the continent\'s largest urban economy — from Sandton\'s finance district to Soweto\'s heritage streets.' },
  'kwaZulu-natal': { hero_image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=1200&q=80', hero_query: 'durban beachfront golden mile', description: 'Where the Indian Ocean meets Zulu heritage. 12 towns from Durban\'s golden beaches to the Drakensberg mountains, blending subtropical warmth with deep cultural roots.' },
  'mpumalanga': { hero_image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&q=80', hero_query: 'blyde river canyon mpumalanga', description: 'The Panorama Route, Kruger Park gateway, and 13 towns in South Africa\'s most dramatic landscape. From God\'s Window to the Lowveld, Mpumalanga is where nature writes its masterpiece.'},
  'limpopo': { hero_image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&q=80', hero_query: 'limpopo bushveld baobab', description: 'The great north — Venda culture, baobab trees, and 9 towns where Sepedi, Venda, and Tsonga traditions converge. Limpopo is South Africa\'s gateway to the African continent.' },
  'eastern-cape': { hero_image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=80', hero_query: 'hole in the wall eastern cape', description: 'The Wild Coast, Mandela\'s homeland, and 10 towns where Xhosa culture meets dramatic coastline. From East London to Coffee Bay, the Eastern Cape is raw, beautiful, and deeply storied.'},
  'north-west': { hero_image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&q=80', hero_query: 'pilanesberg crater north west', description: 'The platinum belt, Pilanesberg crater, and 8 towns in South Africa\'s mining heartland. From Rustenburg to Mafikeng, the North West blends mineral wealth with rich cultural heritage.'},
  'northern-cape': { hero_image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80', hero_query: 'namaqualand flowers northern cape', description: 'South Africa\'s largest and most sparsely populated province — 7 towns across the diamond coast, Namaqualand\'s spring flowers, and the vast Karoo. The Northern Cape is frontier country.'},
};

// Province descriptions
const PROVINCE_DESCS = {
  'free-state': 'The heartland of South Africa. 22 towns across golden grasslands, the Maluti Mountains, and the Golden Gate Highlands.',
  'western-cape': 'From Table Mountain to the Garden Route. 17 towns in South Africa\'s tourism and tech capital.',
  'gauteng': 'Africa\'s economic powerhouse. 13 towns driving the continent\'s largest urban economy.',
  'kwaZulu-natal': 'Where the Indian Ocean meets Zulu heritage. 12 towns from beaches to mountains.',
  'mpumalanga': 'The Panorama Route and Kruger gateway. 13 towns in dramatic Lowveld landscape.',
  'limpopo': 'The great north. 9 towns where Venda, Sepedi, and Tsonga cultures converge.',
  'eastern-cape': 'The Wild Coast and Mandela\'s homeland. 10 towns on raw, dramatic coastline.',
  'north-west': 'The platinum belt and Pilanesberg. 8 towns in the mining heartland.',
  'northern-cape': 'Frontier country. 7 towns across the diamond coast and Namaqualand flowers.',
};

function enrichTownData(jsonTown, dbTown) {
  // Merge GPS coordinates
  if (dbTown.latitude && dbTown.longitude) {
    jsonTown.lat = dbTown.latitude;
    jsonTown.lng = dbTown.longitude;
  }
  // Merge description
  if (dbTown.description) {
    jsonTown.description = dbTown.description;
  }
  // Merge population estimate
  if (dbTown.population_estimate) {
    jsonTown.population_estimate = dbTown.population_estimate;
  }
  // Merge archetype
  if (dbTown.archetype) {
    jsonTown.archetype = dbTown.archetype;
  }
  return jsonTown;
}

// Process each province
const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
let totalEnriched = 0;
let totalAdded = 0;

for (const file of files) {
  const provSlug = file.replace('.json', '');
  const filePath = join(DATA_DIR, file);
  const provData = JSON.parse(readFileSync(filePath, 'utf-8'));
  
  // Add province-level data
  const provMeta = PROVINCE_HEROS[provSlug];
  if (provMeta) {
    provData.hero_image = provMeta.hero_image;
    provData.description = provMeta.description;
  }
  
  // Match towns from towns.js
  for (const jsonTown of provData.towns) {
    const dbTown = TOWNS.find(t => t.slug === jsonTown.slug);
    if (dbTown) {
      enrichTownData(jsonTown, dbTown);
      totalEnriched++;
    }
  }
  
  // Add towns from towns.js that aren't in JSON yet
  const provinceMapping = {
    'free-state': 'free-state',
    'western-cape': 'western-cape',
    'gauteng': 'gauteng',
    'kwaZulu-natal': 'kwazulu-natal',
    'mpumalanga': 'mpumalanga',
    'limpopo': 'limpopo',
    'eastern-cape': 'eastern-cape',
    'north-west': 'north-west',
    'northern-cape': 'northern-cape',
  };
  
  const provTowns = TOWNS.filter(t => t.province_slug === provinceMapping[provSlug]);
  for (const dbTown of provTowns) {
    if (provData.towns.find(t => t.slug === dbTown.slug)) continue;
    
    const newTown = {
      slug: dbTown.slug,
      name: dbTown.name,
      region: dbTown.archetype ? dbTown.archetype.replace(/_/g, ' ') : '',
      status: 'ghost',
      render_pct: 0,
      opportunity_potential: 30,
      lat: dbTown.latitude,
      lng: dbTown.longitude,
      description: dbTown.description,
      population_estimate: dbTown.population_estimate,
      archetype: dbTown.archetype,
      coordinator_status: 'recruiting',
      route: `/town/${dbTown.slug}`,
      illustrative: true,
    };
    
    provData.towns.push(newTown);
    totalAdded++;
  }
  
  writeFileSync(filePath, JSON.stringify(provData, null, 2) + '\n');
  console.log(`${provSlug}: ${provData.towns.length} towns (${provData.towns.filter(t => t.lat).length} with GPS)`);
}

console.log(`\nDone: ${totalEnriched} towns enriched with GPS+descriptions, ${totalAdded} new towns added`);
