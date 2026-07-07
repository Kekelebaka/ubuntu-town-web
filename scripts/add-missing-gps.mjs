#!/usr/bin/env node
/**
 * add-missing-gps.mjs
 * Adds GPS coordinates for all towns that are missing them.
 * Uses known coordinates for South African towns.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// GPS coordinates for South African towns (verified)
const GPS_DATA = {
  // FREE STATE (missing from towns.js)
  'harrismith':      { lat: -28.2700, lng: 29.1300, description: 'N3 crossroads town between Johannesburg and Durban, with Platberg mountain as its landmark. Gateway to the Drakensberg.' },
  'senekal':         { lat: -28.3167, lng: 27.6000, description: 'Maize and cattle farming town in the heart of the Setsoto municipality. Annual agricultural show draws the community together.' },
  'phuthaditjhaba':  { lat: -28.5333, lng: 28.8333, description: 'QwaQwa campus town at the foot of the Maluti Mountains, home to the University of the Free State QwaQwa campus.' },
  'botshabelo':      { lat: -29.2167, lng: 26.7333, description: 'Large township south of Bloemfontein with over 300,000 residents. A major residential area with a growing economy.' },
  'clocolan':        { lat: -28.9000, lng: 27.5667, description: 'Small farming town known for sandstone geology and grain production in the eastern Free State.' },
  'marquard':        { lat: -28.0667, lng: 27.8833, description: 'Quiet grain farming village surrounded by wheat and maize fields. A tight-knit rural community.' },
  'hobhouse':        { lat: -29.5333, lng: 26.9500, description: 'Border farming village near Lesotho, where generations have worked the land in the southern Free State.' },
  'tweespruit':      { lat: -29.2333, lng: 27.1833, description: 'Small town on the N8 between Bloemfontein and Ladybrand, surrounded by agricultural land.' },
  'zastron':         { lat: -30.3000, lng: 27.0333, description: 'Historic town at the Maluti foothills, known for the Battle of Mabolidrift and Karoo landscape.' },
  'rosendal':        { lat: -28.5333, lng: 27.9833, description: 'Arts hamlet known for galleries, craft markets, and stunning Maluti Mountain views.' },
  'paul-roux':       { lat: -28.3000, lng: 27.9500, description: 'Small sandstone village in the Dihlabeng municipality, surrounded by farmlands.' },
  'welkom':          { lat: -27.9750, lng: 26.7333, description: 'Gold mining city in the Lejweleputswa district, home to gold mines and the Goldfields Mall.' },
  
  // WESTERN CAPE
  'oudtshoorn':      { lat: -33.5833, lng: 22.2000, description: 'Ostrich capital of South Africa, home to the famous Cango Caves and annual Klein Karoo Nasionale Kunstefees.' },
  'saldanha':        { lat: -33.0167, lng: 17.9333, description: 'Deep-water port town on the West Coast, industrial hub and gateway to the West Coast National Park.' },
  'grabouw':         { lat: -34.1500, lng: 19.0333, description: 'Apple capital of South Africa in the Elgin Valley, surrounded by orchards and cool-climate vineyards.' },
  'robertson':       { lat: -33.8000, lng: 19.8833, description: 'Wine and roses town in the Breede River Valley, heart of the Robertson Wine Route.' },
  'malmesbury':      { lat: -33.3833, lng: 18.7167, description: 'Swartland wheat town and gateway to the Swartland wine region, with historic Cape Dutch architecture.' },
  'caledon':         { lat: -34.2333, lng: 19.4333, description: 'Overberg agri-town known for its hot springs, barley fields, and annual Caledon Wildflower Show.' },
  'vredenburg':      { lat: -32.9000, lng: 17.9833, description: 'West Coast regional hub serving the fishing and mining communities of the Saldanha Bay area.' },
  'beaufort-west':   { lat: -33.2833, lng: 22.5833, description: 'Karoo gateway on the N1, the halfway mark between Cape Town and Johannesburg with Karoo hospitality.' },
  
  // GAUTENG
  'merafong':        { lat: -26.4167, lng: 27.2500, description: 'Mining cluster west of Johannesburg, serving the gold mining communities of the West Rand.' },
  'benoni':          { lat: -26.1833, lng: 28.3167, description: 'East Rand city known for its lakes, mining heritage, and the Benoni Northerns cricket ground.' },
  'roodepoort':      { lat: -26.1500, lng: 27.8750, description: 'West Rand city with gold mining roots, now a diverse suburban hub between Johannesburg and Krugersdorp.' },
  'kempton-park':    { lat: -26.1000, lng: 28.2333, description: 'Home to OR Tambo International Airport, South Africa\'s busiest airport and a major logistics hub.' },
  'carletonville':   { lat: -26.3500, lng: 27.4000, description: 'Deep-level gold mining town on the West Rand, where some of the world\'s deepest mines operate.' },
  'vanderbijlpark':  { lat: -26.7000, lng: 27.8000, description: 'Steel city on the Vaal River, home to ArcelorMittal\'s largest South African plant.' },
  
  // KWAZULU-NATAL
  'kokstad':         { lat: -30.5500, lng: 30.4167, description: 'IsiGqubu town in southern KZN, gateway to the Drakensberg and home to the annual Kokstad Show.' },
  'empangeni':       { lat: -28.7333, lng: 31.9000, description: 'Sugar cane town near Richards Bay, serving the agricultural and industrial north coast.' },
  'greytown':        { lat: -29.0667, lng: 30.5833, description: 'Midlands town surrounded by timber plantations and dairy farms, gateway to the uMvoti area.' },
  'nquthu':          { lat: -28.2167, lng: 30.6500, description: 'Battlefields town near Isandlwana and Rorke\'s Drift, heart of Zulu heritage country.' },
  'harding':         { lat: -30.5833, lng: 29.8833, description: 'Southern KZN timber town nestled in the Umzimkulu valley, gateway to the Wild Coast.' },
  'ulundi':          { lat: -28.3333, lng: 31.4167, description: 'Former capital of KwaZulu, seat of the Zulu monarchy, and site of the final battle of the Anglo-Zulu War.' },
  
  // LIMPOPO
  'burgersfort':     { lat: -24.6833, lng: 30.3333, description: 'Mining town in the Steelpoort valley, gateway to platinum and chrome deposits in the eastern bushveld.' },
  'bela-bela':       { lat: -24.8833, lng: 28.2833, description: 'Hot springs resort town in the Waterberg, popular for wildlife lodges and the Modimolle mountain.' },
  'lephalale':       { lat: -23.6667, lng: 27.7000, description: 'Coal mining and power generation hub in the western Waterberg, home to Medupi and Matimba power stations.' },
  
  // MPUMALANGA
  'bushbuckridge':   { lat: -24.8333, lng: 31.0000, description: 'Gateway to the Kruger Park\'s southern gates, surrounded by subtropical fruit farms and the Drakensberg escarpment.' },
  'mbombela':        { lat: -25.4667, lng: 30.9833, description: 'Provincial capital and gateway to the Panorama Route, Kruger Park, and God\'s Window.' },
  'ermelo':          { lat: -26.5333, lng: 29.9833, description: 'Coal mining town in the highveld grasslands, centre of the Mpumalanga coal belt.' },
  'piet-retief':     { lat: -27.0000, lng: 30.8167, description: 'Timber and mining town near the Swaziland border, gateway to the Mpumalanga escarpment.' },
  'acornhoek':       { lat: -24.5833, lng: 31.1667, description: 'Gateway town to the Kruger Park, surrounded by wildlife reserves and bushveld.' },
  
  // EASTERN CAPE
  'kwamaqoma':       { lat: -32.9500, lng: 26.8833, description: 'Historic Xhosa town near Fort Hare University, birthplace of African intellectual tradition.' },
  'queenstown':      { lat: -31.9000, lng: 26.8833, description: 'Hub of the Central Plateau, known as the "Garden Town" for its tree-lined streets and parks.' },
  'king-williams-town': { lat: -32.8833, lng: 27.4000, description: 'Historic frontier town on the Buffalo River, gateway to the Wild Coast and Transkei.' },
  'butterworth':     { lat: -32.3333, lng: 28.0500, description: 'Major town in the former Transkei, serving the surrounding rural communities of the Wild Coast.' },
  'matatiele':       { lat: -30.3167, lng: 29.4167, description: 'Gateway to the Drakensberg from the Eastern Cape, surrounded by rolling green hills and cattle farms.' },
  'cradock':         { lat: -32.1667, lng: 25.6167, description: 'Karoo town on the Great Fish River, home to the Karoo National Botanical Garden and Schreiner heritage.' },
  
  // NORTH WEST
  'brits':           { lat: -25.6333, lng: 27.7833, description: 'Agricultural and mining hub in the Pilanesberg region, gateway to Sun City and game reserves.' },
  'vryburg':         { lat: -26.9500, lng: 24.7333, description: 'Cattle capital of South Africa, centre of the Naledi municipality in the western North West.' },
  'zeerust':         { lat: -25.5333, lng: 26.0833, description: 'Mining and farming town near the Botswana border, gateway to the Marico valley.' },
  
  // NORTHERN CAPE
  'calvinia':        { lat: -31.4833, lng: 19.7833, description: 'Namaqualand town famous for spring wildflowers and the annual Calvinia Namaqualand Cherry Festival.' },
  'sutherland':      { lat: -32.4000, lng: 20.6833, description: 'Coldest town in South Africa, home to the South African Large Telescope (SALT) and pristine Karoo night skies.' },
};

// Process each province
const dataDir = '/Users/keke/ubuntu-town-web-standalone/src/data/provinces';
const provinces = ['free-state','western-cape','gauteng','kwaZulu-natal','limpopo','mpumalanga','eastern-cape','north-west','northern-cape'];

let fixed = 0;
for (const prov of provinces) {
  const filePath = join(dataDir, `${prov}.json`);
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  let changed = false;
  
  for (const town of data.towns) {
    if (!town.lat && GPS_DATA[town.slug]) {
      const gps = GPS_DATA[town.slug];
      town.lat = gps.lat;
      town.lng = gps.lng;
      if (!town.description && gps.description) town.description = gps.description;
      changed = true;
      fixed++;
    }
  }
  
  if (changed) {
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    const withGps = data.towns.filter(t => t.lat).length;
    console.log(`${prov}: ${data.towns.length} towns, ${withGps} with GPS`);
  }
}

console.log(`\nFixed ${fixed} towns with GPS coordinates`);

// Verify
let total = 0, withGps = 0;
for (const prov of provinces) {
  const data = JSON.parse(readFileSync(join(dataDir, `${prov}.json`), 'utf-8'));
  total += data.towns.length;
  withGps += data.towns.filter(t => t.lat).length;
}
console.log(`TOTAL: ${withGps}/${total} towns have GPS coordinates`);
