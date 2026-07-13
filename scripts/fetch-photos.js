#!/usr/bin/env node
// Ubuntu Town — Photo Fetcher from Unsplash
// Usage: UNSPLASH_ACCESS_KEY=xxx node scripts/fetch-photos.js
// Get your free key at: https://unsplash.com/developers

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'photos', 'towns');
const MANIFEST_PATH = path.join(OUTPUT_DIR, '_manifest.json');

// Search terms optimised for Unsplash — each town gets 2-3 queries
const TOWN_QUERIES = {
  // FREE STATE
  'bloemfontein': ['bloemfontein south africa', 'naval hill', 'free state roses'],
  'ladybrand': ['ladybrand south africa', 'maloti mountains basotho'],
  'ficksburg': ['ficksburg cherry south africa', 'free state farming'],
  'bethlehem': ['bethlehem free state mountains', 'golden gate south africa'],
  'clarens': ['clarens free state village', 'clarens sandstone art'],
  'kroonstad': ['kroonstad free state', 'vaal river south africa'],
  'fouriesburg': ['fouriesburg maloti', 'sani pass lesotho'],
  'golden-gate': ['golden gate highlands national park', 'basotho cultural village'],
  'jagersfontein': ['diamond mine south africa historic', 'free state town'],
  'reitz': ['free state sunflower farm', 'south african agriculture'],
  'lindley': ['free state grain farming', 'south african countryside'],
  'petrusburg': ['free state rural town', 'south africa farming community'],
  'villiers': ['free state highway n3', 'highveld landscape'],
  'heidelberg fs': ['free state riet river', 'south african church town'],
  'staasiens': ['free state farmlands', 'south african wheat fields'],
  'philippolis': ['philippolis mission station', 'historic cape dutch free state'],
  'trompsburg': ['trompsburg free state sheep', 'lesotho border south africa'],
  'springfontein': ['springfontein railway', 'free state veld'],
  'smithfield': ['smithfield oliver tambo', 'free state heritage'],
  'wepener': ['wepener lesotho border', 'caledon river free state'],
  'thaba-nchu': ['thaba nchu basotho', 'black mountain free state'],
  'mangaung': ['mangaung university free state', 'macufe festival'],

  // WESTERN CAPE
  'cape-town': ['table mountain cape town', 'cape town waterfront', 'bo-kaap colourful houses'],
  'stellenbosch': ['stellenbosch oak lined streets', 'stellenbosch winelands cape dutch'],
  'paarl': ['paarl rock mountain', 'paarl winelands cape'],
  'george': ['outeniqua mountains george', 'garden route george'],
  'mossel-bay': ['mossel bay beach diaz', 'dias museum mossel bay'],
  'knysna': ['knysna heads lagoon', 'knysna indigenous forest'],
  'plettenberg-bay': ['plettenberg bay beach', 'robberg peninsula'],
  'worcester': ['worcester western cape boland', 'karoo botanical garden'],
  'hermanus': ['hermanus whale watching', 'hemel en aarde valley'],
  'cango-caves': ['cango caves oudtshoorn', 'limestone stalactites'],
  'swellendam': ['swellendam cape dutch architecture', 'bontebok national park'],
  'cederberg': ['cederberg rock formations', 'san rock art cederberg'],
  'hopefield': ['west coast wildflowers springbok', 'hopefield flowers'],
  'citrusdal': ['citrusdal orange orchards', 'cederberg olifants river'],
  'porterville': ['porterville paragliding', 'west coast south africa'],
  'langebaan': ['langebaan lagoon', 'west coast national park'],
  'george-west': ['george western cape rural', 'cape farming landscape'],

  // GAUTENG
  'johannesburg': ['johannesburg skyline', 'nelson mandela bridge', 'maboneng precinct'],
  'pretoria': ['union buildings pretoria', 'jacaranda trees pretoria'],
  'ekurhuleni': ['germiston gauteng', 'east rand industrial'],
  'soweto': ['vilakazi street soweto', 'orlando towers soweto'],
  'tembisa': ['tembisa township gauteng', 'ekurhuleni community'],
  'randburg': ['randburg shopping', 'northern johannesburg'],
  'sandton': ['sandton city johannesburg', 'nelson mandela square'],
  'centurion': ['centurion gauteng', 'pretoria south'],
  'midrand': ['midrand conference centre', 'waterfall city gauteng'],
  'mabopane': ['mabopane pretoria township', 'northern tshwane'],
  'mamelodi': ['mamelodi pretoria', 'eastern tshwane township'],
  'soshanguve': ['soshanguve pretoria', 'northern gauteng township'],

  // KWAZULU-NATAL
  'durban': ['durban golden mile beachfront', 'moses mabhida stadium', 'ushaka marine world'],
  'pietermaritzburg': ['pietermaritzburg city hall', 'midlands meander craft'],
  'newcastle': ['newcastle kwaZulu natal', 'dannhauser mountains'],
  'umlazi': ['umlazi durban township', 'south durban'],
  'kwamashu': ['kwamashu durban', 'north durban township'],
  'richards-bay': ['richards bay harbour', 'kwaZulu natal coast'],
  'vryheid': ['vryheid battlefields', 'northern kzn coal mining'],
  'estcourt': ['estcourt drakensberg', 'kwaZulu natal midlands'],
  'ladysmith': ['ladysmith siege battlefields', 'spioenkop'],
  'hluhluwe': ['hluhluwe imfolozi park', 'big five kwaZulu natal'],
  'st-lucia': ['st lucia estuary isimangaliso', 'hippo estuary'],
  'port-shepstone': ['port shepstone south coast', 'oribi gorge'],

  // LIMPOPO
  'polokwane': ['polokwane limpopo', 'peter mokaba stadium'],
  'thohoyandou': ['thohoyandou venda', 'university of venda'],
  'tzaneen': ['tzaneen tropical limpopo', 'magoebaskloof'],
  'mokopane': ['mokopane makapansgat', 'limpopo bushveld'],
  'giyani': ['giyani tsonga limpopo', 'gazankulu'],
  'musina': ['musina baobab tree', 'limpopo river border'],
  'phafula': ['limpopo mountains bushveld', 'rural limpopo'],
  'tubatse': ['tubatse mining limpopo', 'sekhukhune district'],
  'limpopo-town': ['limpopo province landscape', 'south african bushveld'],

  // MPUMALANGA
  'nelspruit': ['nelspruit mbombela lowveld', 'kruger park entrance'],
  'emalahleni': ['emalahleni coal mining mpumalanga', 'witbank'],
  'middelburg': ['middelburg mpumalanga highveld', 'mpumalanga farming'],
  'barberton': ['barberton greenstone belt', 'mpumalanga heritage'],
  'sabie': ['sabie waterfall mpumalanga', 'panorama route'],
  'graskop': ['gods window panorama route', 'three rondavels mpumalanga'],
  'pilgrims-rest': ['pilgrims rest historic street', 'royal hotel mpumalanga'],
  'standerton': ['standerton vaal river', 'mpumalanga farming'],
  'secunda': ['secunda sasol mpumalanga', 'coal to liquids'],
  'eelands': ['eelands nature reserve mpumalanga', 'mpumalanga conservation'],
  'badplaas': ['badplaas mineral springs', 'mpumalanga resort'],
  'lydenburg': ['lydenburg lydenburg heads', 'long tom pass mpumalanga'],
  'witbank': ['witbank emalahleni coal', 'mpumalanga energy'],

  // EASTERN CAPE
  'east-london': ['east london eastern cape beach', 'buffalo river'],
  'gqeberha': ['gqeberha port elizabeth shark rock pier', 'addo elephant park'],
  'mthatha': ['mthatha mandela museum', 'wild coast transkei'],
  'grahamstown': ['makhanda national arts festival', 'rhodes university'],
  'kariega': ['kariega eastern cape beach', 'addo elephants'],
  'port-alfred': ['port alfred kowie river', 'eastern cape coastal'],
  'alice': ['university fort hare alice', 'eastern cape heritage'],
  'komani': ['komani queenstown eastern cape', 'xhosa heritage'],
  'port-st-johns': ['port st johns wild coast', 'umzimvubu river mouth'],
  'hogsback': ['hogsback waterfall eastern cape', 'amathole forest'],

  // NORTH WEST
  'rustenburg': ['rustenburg pilanesberg', 'sun city north west'],
  'mafikeng': ['mafikeng museum north west', 'bophuthatswana parliament'],
  'klerksdorp': ['klerksdorp gold mining', 'witwatersrand'],
  'potchefstroom': ['potchefstroom dam', 'aardklop festival'],
  'ventersdorp': ['ventersdorp farming north west', 'cattle farms'],
  'lichtenburg': ['lichtenburg diamond north west', 'sunflower fields'],
  'coligny': ['coligny farming north west', 'maize fields'],
  'mahikeng': ['mahikeng north west capital', 'university north west'],

  // NORTHERN CAPE
  'kimberley': ['kimberley big hole diamond', 'mine museum northern cape'],
  'upington': ['upington orange river', 'kalahari red dunes'],
  'springbok': ['springbok namaqualand wildflowers', 'goegap nature reserve'],
  'colesberg': ['colesberg karoo sheep', 'merino wool'],
  'de-aar': ['de aar railway junction', 'karoo train'],
  'kuruman': ['kuruman eye spring', 'moffat mission'],
  'postmasburg': ['postmasburg iron ore mining', 'kalahari landscape'],
};

async function fetchPhotos(query, count = 3) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&order_by=relevance`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }
  });

  if (!res.ok) {
    console.error(`  Unsplash API error: ${res.status} ${res.statusText}`);
    return [];
  }

  const data = await res.json();
  return (data.results || []).map(img => ({
    id: img.id,
    urls: img.urls,
    description: img.description || img.alt_description || '',
    author: img.user?.name || 'Unknown',
    author_url: img.user?.links?.html || '',
    width: img.width,
    height: img.height,
    color: img.color,
  }));
}

async function main() {
  if (!UNSPLASH_KEY) {
    console.error('❌ Set UNSPLASH_ACCESS_KEY env variable.');
    console.error('   Get a free key at: https://unsplash.com/developers');
    process.exit(1);
  }

  console.log('📸 Ubuntu Town — Photo Fetcher');
  console.log('==============================\n');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Load existing manifest if any
  let manifest = {};
  if (fs.existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    console.log(`Found existing manifest with ${Object.keys(manifest).length} towns\n`);
  }

  const entries = Object.entries(TOWN_QUERIES);
  let totalPhotos = 0;
  let errors = 0;

  for (let i = 0; i < entries.length; i++) {
    const [townSlug, queries] = entries[i];
    console.log(`[${i + 1}/${entries.length}] ${townSlug}...`);

    const photos = [];
    for (const query of queries) {
      try {
        const results = await fetchPhotos(query, 2);
        photos.push(...results);
        // Rate limit: ~50 req/hr on free tier
        await new Promise(r => setTimeout(r, 1500));
      } catch (e) {
        console.error(`  ⚠️  Error on "${query}": ${e.message}`);
        errors++;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    manifest[townSlug] = photos;
    totalPhotos += photos.length;
    console.log(`  ✅ ${photos.length} photos found`);
  }

  // Save manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log('\n📊 Summary');
  console.log('==========');
  console.log(`Towns: ${entries.length}`);
  console.log(`Total photos: ${totalPhotos}`);
  console.log(`Errors: ${errors}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
  console.log('\n✅ Done! Run upload-photos.js to push to Supabase Storage.');
}

main();
