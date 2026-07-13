#!/usr/bin/env node
/**
 * enrich-services.mjs
 * Adds seed services data to province JSON files for the resident persona.
 * Services are linked to businesses via business_id in Supabase,
 * but we embed them at build time since the table is empty.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'src/data/provinces');

// Seed services by town
const SERVICES = {
  'bloemfontein': [
    { title: 'Motheo TVET College — NATED programmes', description: 'Engineering, business, and utility studies. Registration open.', price_range: 'R5,000 - R15,000/year', category: 'education' },
    { title: 'National Museum — school tours', description: 'Free educational tours for schools. Natural history and cultural exhibits.', price_range: 'Free', category: 'tourism' },
    { title: 'Mangaung Water & Sanitation', description: 'Municipal water and sanitation services. Report faults online.', price_range: 'Municipal rates', category: 'utility' },
  ],
  'cape-town': [
    { title: 'Cape Peninsula TVET — business programmes', description: 'Business studies, IT, and hospitality. Campuses across Cape Town.', price_range: 'R8,000 - R20,000/year', category: 'education' },
    { title: 'MyCiTi Bus — central line', description: 'Integrated rapid transit system connecting CBD, suburbs, and airport.', price_range: 'R7 - R50', category: 'transport' },
    { title: 'Khayelitsha Community Health Centre', description: 'Primary healthcare services, HIV/TB treatment, maternal health.', price_range: 'Free', category: 'healthcare' },
  ],
  'johannesburg': [
    { title: 'SW Gauteng TVET — Sandton campus', description: 'Engineering, business, and IT programmes. NSFAS eligible.', price_range: 'R6,000 - R18,000/year', category: 'education' },
    { title: 'Rea Vaya Bus — BRT system', description: 'Bus rapid transit connecting Soweto, CBD, and Rosebank.', price_range: 'R10 - R40', category: 'transport' },
    { title: 'Chris Hani Baragwanath Hospital', description: 'Third-largest hospital in the world. Emergency and specialist services.', price_range: 'Free (public)', category: 'healthcare' },
  ],
  'durban': [
    { title: 'Umgungundlovu TVET — PMB campus', description: 'Engineering, agriculture, and business programmes.', price_range: 'R5,000 - R12,000/year', category: 'education' },
    { title: 'People Mover — Durban CBD bus', description: 'Hop-on hop-off bus service covering the beachfront and CBD.', price_range: 'R5 - R20', category: 'transport' },
    { title: 'Addington Hospital', description: 'Major public hospital on the North Beach road. Emergency services.', price_range: 'Free (public)', category: 'healthcare' },
  ],
  'pretoria': [
    { title: 'Tshwane North TVET', description: 'Engineering and business programmes. Multiple campuses.', price_range: 'R5,000 - R14,000/year', category: 'education' },
    { title: 'A Re Yeng — Tshwane BRT', description: 'Bus rapid transit connecting Pretoria CBD, Hatfield, and Soshanguve.', price_range: 'R8 - R35', category: 'transport' },
  ],
  'nelspruit': [
    { title: 'Mbombela TVET College', description: 'Hospitality, engineering, and business programmes.', price_range: 'R4,000 - R10,000/year', category: 'education' },
    { title: 'Kruger Mpumalanga International Airport', description: 'Gateway to Kruger Park. Daily flights to Joburg and Cape Town.', price_range: 'R800 - R3,000', category: 'transport' },
  ],
  'polokwane': [
    { title: 'University of Limpopo — Turfloop campus', description: 'Medicine, law, science, and humanities. Main campus.', price_range: 'R10,000 - R35,000/year', category: 'education' },
    { title: 'Mall of the North — anchor tenant directory', description: 'Regional shopping centre with 200+ stores, food court, and cinema.', price_range: 'Varies', category: 'retail' },
  ],
  'kimberley': [
    { title: 'Sol Plaatje University', description: 'Newest SA university. Education, heritage, and creative arts.', price_range: 'R8,000 - R25,000/year', category: 'education' },
    { title: 'Big Hole Museum & Diamond Mine', description: 'Largest hand-dug excavation in the world. Museum and mine tour.', price_range: 'R120 - R200', category: 'tourism' },
  ],
  'east-london': [
    { title: 'Buffalo City TVET', description: 'Business, engineering, and hospitality programmes.', price_range: 'R4,000 - R10,000/year', category: 'education' },
    { title: 'East London Museum — dodo exhibit', description: 'Home to the only complete dodo skeleton in the world.', price_range: 'R30 - R50', category: 'tourism' },
  ],
  'mafikeng': [
    { title: 'North-West University — Mafikeng campus', description: 'Education, law, science, and commerce.', price_range: 'R8,000 - R28,000/year', category: 'education' },
    { title: 'Mafikeng Museum — Bophuthatswana parliament', description: 'History of the former homeland and Setswana culture.', price_range: 'R20 - R40', category: 'tourism' },
  ],
  'upington': [
    { title: 'Upington TVET campus', description: 'Agriculture and business programmes for the Northern Cape.', price_range: 'R3,000 - R8,000/year', category: 'education' },
    { title: 'Orange River Wine Cellars', description: 'South Africa\'s most northerly wine route. Cellar tours and tastings.', price_range: 'R50 - R150', category: 'tourism' },
  ],
  'clarens': [
    { title: 'Clarens Village Square — art galleries', description: 'Over 20 galleries and craft shops in the sandstone village.', price_range: 'Free entry', category: 'tourism' },
    { title: 'Golden Gate Highlands — day visitor centre', description: 'Dramatic sandstone cliffs and high-altitude grasslands.', price_range: 'R40 - R80', category: 'tourism' },
  ],
  'ficksburg': [
    { title: 'Cherry Festival — November annually', description: 'Annual cherry harvest celebration. Tastings, music, market stalls.', price_range: 'R50 - R200', category: 'tourism' },
    { title: 'Masermeng Cultural Village', description: 'Authentic Basotho heritage experiences and traditional meals.', price_range: 'R100 - R300', category: 'tourism' },
  ],
};

const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
let total = 0;

for (const file of files) {
  const filePath = join(DATA_DIR, file);
  const provData = JSON.parse(readFileSync(filePath, 'utf-8'));
  let changed = false;

  for (const town of provData.towns) {
    if (SERVICES[town.slug] && !town.services) {
      town.services = SERVICES[town.slug];
      changed = true;
      total++;
    }
  }

  if (changed) {
    writeFileSync(filePath, JSON.stringify(provData, null, 2) + '\n');
  }
}

console.log(`Added services to ${total} towns`);
