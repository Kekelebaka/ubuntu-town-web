#!/usr/bin/env node
// Ubuntu Town — Master Seed Script
// Seeds ALL Supabase tables with real data
// Usage: SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx node scripts/seed-all.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ===== DATA IMPORTS =====
const { PROVINCES } = await import('./data/provinces.js');
const { TOWNS } = await import('./data/towns.js');

// ===== NATIONAL OPPORTUNITIES =====
const NATIONAL_OPPORTUNITIES = [
  { title: "NYDA Grant Programme — R100K to R1M", type: "grant", source: "NYDA", deadline_date: "2026-12-31", metadata: { amount: "R100,000 - R1,000,000", url: "https://nyda.gov.za", eligibility: "SA youth 18-35, registered business" } },
  { title: "NYDA Solomon Mahlangu Scholarship", type: "bursary", source: "NYDA", deadline_date: "2026-02-28", metadata: { amount: "Full cost of study", url: "https://nyda.gov.za", eligibility: "SA youth 14-35" } },
  { title: "NSFAS — National Student Financial Aid", type: "bursary", source: "NSFAS", deadline_date: "2026-01-31", metadata: { url: "https://www.nsfas.org.za", eligibility: "Household income < R350,000" } },
  { title: "EPWP — Expanded Public Works", type: "employment", source: "EPWP", deadline_date: "2026-12-31", metadata: { amount: "R150-350/day", url: "https://www.epwp.gov.za" } },
  { title: "SEDA Business Incubation", type: "enterprise", source: "SEDA", deadline_date: "2026-12-31", metadata: { url: "https://www.seda.org.za", description: "Free business incubation" } },
  { title: "SEFA Small Enterprise Finance", type: "grant", source: "SEFA", deadline_date: "2026-12-31", metadata: { amount: "R500 - R5,000,000", url: "https://www.sefa.org.za" } },
  { title: "Artisan Development Programme", type: "training", source: "DHET", deadline_date: "2026-09-30", metadata: { url: "https://www.dhet.gov.za", trades: "13 trades" } },
  { title: "DALRRD — Agricultural Support", type: "grant", source: "DALRRD", deadline_date: "2026-08-31", metadata: { url: "https://www.dalrrd.gov.za" } },
  { title: "NLC — Community Development Grant", type: "grant", source: "NLC", deadline_date: "2026-10-31", metadata: { amount: "Up to R500,000", url: "https://www.nlcsa.org.za" } },
  { title: "IDC — Youth Entrepreneurship Fund", type: "grant", source: "IDC", deadline_date: "2026-12-31", metadata: { amount: "R1M - R50M", url: "https://www.idc.co.za" } },
  { title: "merSETA — Manufacturing Learnerships", type: "training", source: "merSETA", deadline_date: "2026-12-31", metadata: { stipend: "R3,500-5,000/month", url: "https://merseta.org.za" } },
  { title: "BankSETA — Banking Learnerships", type: "training", source: "BankSETA", deadline_date: "2026-12-31", metadata: { stipend: "R4,000-6,000/month", url: "https://bankseta.org.za" } },
  { title: "CATHSSETA — Tourism Learnerships", type: "training", source: "CATHSSETA", deadline_date: "2026-12-31", metadata: { stipend: "R3,000-4,500/month", url: "https://cathsseta.org.za" } },
  { title: "CETA — Construction Learnerships", type: "training", source: "CETA", deadline_date: "2026-12-31", metadata: { stipend: "R3,200-5,000/month", url: "https://ceta.org.za" } },
  { title: "DSBD — Township Entrepreneurship", type: "grant", source: "DSBD", deadline_date: "2026-11-30", metadata: { amount: "Up to R50,000", url: "https://www.dsbd.gov.za" } },
  { title: "TETA — Transport Bursaries", type: "bursary", source: "TETA", deadline_date: "2026-10-15", metadata: { amount: "Up to R60,000/year", url: "https://teta.org.za" } },
];

// ===== MUNICIPAL OPPORTUNITIES =====
const MUNICIPAL_OPPORTUNITIES = {
  'cape-town': [
    { title: "Cape Town Green Economy Skills", type: "training", source: "City of Cape Town", deadline_date: "2026-08-31", metadata: { stipend: "R3,800/month", url: "https://www.capetown.gov.za" } },
    { title: "Wesgro Tourism Internships", type: "employment", source: "Wesgro", deadline_date: "2026-07-31", metadata: { stipend: "R5,000/month", url: "https://www.wesgro.co.za" } },
  ],
  'johannesburg': [
    { title: "Jozi Digital Ambassadors", type: "employment", source: "City of Johannesburg", deadline_date: "2026-09-30", metadata: { stipend: "R4,500/month", url: "https://www.joburg.org.za" } },
    { title: "JHB Market Trading Permits", type: "enterprise", source: "CoJ", deadline_date: "2026-12-31", metadata: { url: "https://www.joburg.org.za" } },
  ],
  'durban': [
    { title: "eThekwini Tourism Learnerships", type: "training", source: "eThekwini", deadline_date: "2026-09-30", metadata: { stipend: "R3,200/month", url: "https://www.durban.gov.za" } },
  ],
  'soweto': [
    { title: "Soweto SMME Development", type: "enterprise", source: "Gauteng SMME Agency", deadline_date: "2026-11-30", metadata: { url: "https://www.gauteng.gov.za" } },
    { title: "Soweto Heritage Tourism Training", type: "training", source: "Gauteng Tourism", deadline_date: "2026-11-30", metadata: { stipend: "R3,500/month" } },
  ],
  'pretoria': [
    { title: "City of Tshwane Youth Skills", type: "training", source: "City of Tshwane", deadline_date: "2026-10-31", metadata: { stipend: "R3,200/month", url: "https://www.tshwane.gov.za" } },
  ],
  'bloemfontein': [
    { title: "Mangaung Agricultural Grant", type: "grant", source: "Mangaung Municipality", deadline_date: "2026-10-31", metadata: { amount: "Up to R75,000", url: "https://www.mangaung.co.za" } },
  ],
  'nelspruit': [
    { title: "Mbombela Eco-Tourism Programme", type: "training", source: "Mbombela Municipality", deadline_date: "2026-09-30", metadata: { stipend: "R3,000/month", url: "https://www.mbombela.gov.za" } },
    { title: "Mpumalanga Field Ranger Programme", type: "employment", source: "Mpumalanga Parks", deadline_date: "2026-08-31", metadata: { stipend: "R4,000/month", url: "https://www.mtpa.co.za" } },
  ],
  'polokwane': [
    { title: "Limpopo Rural Enterprise Programme", type: "enterprise", source: "Limpopo LED", deadline_date: "2026-11-30", metadata: { url: "https://www.leda.gov.za" } },
  ],
  'east-london': [
    { title: "Buffalo City Coastal Tourism", type: "training", source: "Buffalo City", deadline_date: "2026-10-31", metadata: { stipend: "R3,000/month" } },
  ],
  'gqeberha': [
    { title: "NMB Automotive Skills Programme", type: "training", source: "NMB Municipality", deadline_date: "2026-09-30", metadata: { stipend: "R3,500/month" } },
  ],
  'rustenburg': [
    { title: "Rustenburg Mining Skills Programme", type: "training", source: "Rustenburg Municipality", deadline_date: "2026-10-31", metadata: { stipend: "R3,500/month" } },
  ],
  'kimberley': [
    { title: "Sol Plaatje Diamond Skills", type: "training", source: "Sol Plaatje Municipality", deadline_date: "2026-08-31", metadata: { stipend: "R3,500/month" } },
  ],
  'mahikeng': [
    { title: "RSRDM Agricultural Enterprise", type: "enterprise", source: "RSRDM District", deadline_date: "2026-11-30", metadata: { url: "https://www.rsrdm.gov.za" } },
  ],
  'upington': [
    { title: "ZF Mgcawu Kalahari Agriculture", type: "training", source: "ZF Mgcawu District", deadline_date: "2026-09-30", metadata: { stipend: "R3,000/month" } },
  ],
};

// ===== ACCESS POINTS =====
const ACCESS_POINTS = [
  { name: "SASSA Bloemfontein Office", category: "government", is_verified: true, town_slug: "bloemfontein" },
  { name: "SASSA Cape Town Regional", category: "government", is_verified: true, town_slug: "cape-town" },
  { name: "SASSA Johannesburg North", category: "government", is_verified: true, town_slug: "johannesburg" },
  { name: "SASSA Durban Regional", category: "government", is_verified: true, town_slug: "durban" },
  { name: "SASSA Pretoria Office", category: "government", is_verified: true, town_slug: "pretoria" },
  { name: "SASSA Polokwane Office", category: "government", is_verified: true, town_slug: "polokwane" },
  { name: "SASSA Nelspruit Office", category: "government", is_verified: true, town_slug: "nelspruit" },
  { name: "SASSA East London Office", category: "government", is_verified: true, town_slug: "east-london" },
  { name: "SASSA Kimberley Office", category: "government", is_verified: true, town_slug: "kimberley" },
  { name: "SASSA Mahikeng Office", category: "government", is_verified: true, town_slug: "mahikeng" },
  { name: "V&A Waterfront Free WiFi", category: "wifi", is_verified: true, town_slug: "cape-town" },
  { name: "Nelson Mandela Square Free WiFi", category: "wifi", is_verified: true, town_slug: "johannesburg" },
  { name: "uShaka Free WiFi", category: "wifi", is_verified: true, town_slug: "durban" },
  { name: "SA Post Office Bloemfontein", category: "post_office", is_verified: true, town_slug: "bloemfontein" },
  { name: "SA Post Office Cape Town", category: "post_office", is_verified: true, town_slug: "cape-town" },
  { name: "SA Post Office Johannesburg", category: "post_office", is_verified: true, town_slug: "johannesburg" },
  { name: "NYDA Cape Town", category: "government", is_verified: true, town_slug: "cape-town" },
  { name: "NYDA Johannesburg", category: "government", is_verified: true, town_slug: "johannesburg" },
  { name: "Motheo TVET College", category: "education", is_verified: true, town_slug: "bloemfontein" },
  { name: "Cape Peninsula TVET", category: "education", is_verified: true, town_slug: "cape-town" },
  { name: "SW Gauteng TVET", category: "education", is_verified: true, town_slug: "johannesburg" },
  { name: "Umgungundlovu TVET", category: "education", is_verified: true, town_slug: "pietermaritzburg" },
  { name: "Chris Hani Baragwanath Hospital", category: "healthcare", is_verified: true, town_slug: "soweto" },
  { name: "Groote Schuur Hospital", category: "healthcare", is_verified: true, town_slug: "cape-town" },
  { name: "Addington Hospital", category: "healthcare", is_verified: true, town_slug: "durban" },
];

// ===== BUSINESSES =====
const BUSINESSES = [
  { name: "V&A Waterfront", category: "tourism", is_verified: true, town_slug: "cape-town" },
  { name: "Standard Bank Sandton", category: "finance", is_verified: true, town_slug: "johannesburg" },
  { name: "uShaka Marine World", category: "tourism", is_verified: true, town_slug: "durban" },
  { name: "University of Free State", category: "education", is_verified: true, town_slug: "bloemfontein" },
  { name: "University of Pretoria", category: "education", is_verified: true, town_slug: "pretoria" },
  { name: "Big Hole Museum", category: "tourism", is_verified: true, town_slug: "kimberley" },
  { name: "Sol Plaatje University", category: "education", is_verified: true, town_slug: "kimberley" },
  { name: "Kruger Gate Hotel", category: "hospitality", is_verified: true, town_slug: "nelspruit" },
  { name: "Lowveld Botanical Garden", category: "tourism", is_verified: true, town_slug: "nelspruit" },
  { name: "University of Limpopo", category: "education", is_verified: true, town_slug: "polokwane" },
  { name: "Mall of the North", category: "retail", is_verified: true, town_slug: "polokwane" },
  { name: "Nahoon Beach Restaurant", category: "food", is_verified: true, town_slug: "east-london" },
  { name: "Addo Elephant National Park", category: "tourism", is_verified: true, town_slug: "gqeberha" },
  { name: "Sun City Resort", category: "tourism", is_verified: true, town_slug: "rustenburg" },
  { name: "Pilanesberg Game Reserve", category: "tourism", is_verified: true, town_slug: "rustenburg" },
  { name: "Mafikeng Museum", category: "tourism", is_verified: true, town_slug: "mafikeng" },
  { name: "Upington Wine Cellars", category: "food", is_verified: true, town_slug: "upington" },
  { name: "Kalahari Red Dunes Lodge", category: "hospitality", is_verified: true, town_slug: "upington" },
  { name: "Clarens Brewery", category: "food", is_verified: true, town_slug: "clarens" },
  { name: "Golden Gate Highlands National Park", category: "tourism", is_verified: true, town_slug: "golden-gate" },
  { name: "Knysna Heads", category: "tourism", is_verified: true, town_slug: "knysna" },
  { name: "Stellenbosch Wine Estates", category: "food", is_verified: true, town_slug: "stellenbosch" },
  { name: "Robberg Nature Reserve", category: "tourism", is_verified: true, town_slug: "plettenberg-bay" },
  { name: "Hogsback Forest Reserve", category: "tourism", is_verified: true, town_slug: "hogsback" },
  { name: "Pilgrim's Rest Heritage", category: "tourism", is_verified: true, town_slug: "pilgrims-rest" },
  { name: "God's Window Viewpoint", category: "tourism", is_verified: true, town_slug: "graskop" },
  { name: "Sabi Sabi Game Reserve", category: "tourism", is_verified: true, town_slug: "sabie" },
  { name: "Hluhluwe-iMfolozi Park", category: "tourism", is_verified: true, town_slug: "hluhluwe" },
  { name: "iSimangaliso Wetland Park", category: "tourism", is_verified: true, town_slug: "st-lucia" },
  { name: "Springbok Namaqualand Tourism", category: "tourism", is_verified: true, town_slug: "springbok" },
  { name: "Upington Orange River Wine", category: "food", is_verified: true, town_slug: "upington" },
  { name: "De Aar Railway Heritage", category: "tourism", is_verified: true, town_slug: "de-aar" },
  { name: "Kuruman Eye Spring", category: "tourism", is_verified: true, town_slug: "kuruman" },
];

// ===== EVENTS =====
const EVENTS = [
  { title: "Cherry Festival Ficksburg", description: "Annual cherry harvest celebration with tastings, music, and market stalls", event_date: "2026-11-15", town_slug: "ficksburg" },
  { title: "MACUFE Festival Mangaung", description: "Mangaung African Cultural Festival — music, dance, art, and theatre", event_date: "2026-10-01", town_slug: "bloemfontein" },
  { title: "National Arts Festival Makhanda", description: "South Africa's biggest arts festival — theatre, music, visual arts", event_date: "2026-06-25", town_slug: "grahamstown" },
  { title: "Aardklop Arts Festival", description: "Potchefstroom's annual arts and culture festival", event_date: "2026-09-28", town_slug: "potchefstroom" },
  { title: "Whale Festival Hermanus", description: "Celebration of the southern right whale season", event_date: "2026-10-01", town_slug: "hermanus" },
  { title: "Knysna Oyster Festival", description: "Food, sport, and oysters on the Garden Route", event_date: "2026-07-01", town_slug: "knysna" },
  { title: "Durban July", description: "South Africa's premier horse racing and fashion event", event_date: "2026-07-04", town_slug: "durban" },
  { title: "Sundi Dance Festival Durban", description: "Traditional Zulu dance and cultural celebration", event_date: "2026-07-24", town_slug: "durban" },
  { title: "Namaqualand Flower Season", description: "Wildflower viewing in Springbok and surrounds", event_date: "2026-08-15", town_slug: "springbok" },
  { title: "Bafokeng Cultural Festival", description: "Traditional Setswana cultural celebration", event_date: "2026-12-16", town_slug: "rustenburg" },
  { title: "Limpopo Cultural Festival", description: "Celebration of Limpopo's diverse cultures", event_date: "2026-09-24", town_slug: "polokwane" },
  { title: "Royal St Andrews Golf Tournament", description: "Annual golf championship in Port Alfred", event_date: "2026-03-15", town_slug: "port-alfred" },
];

// ===== STORIES =====
const STORIES = [
  { title: "From SASSA to Skills: My Journey in Bloemfontein", content: "When I lost my job at the clothing factory, I thought it was over. But through the SETA learnership programme, I trained as a welder. Now I earn R12,000 a month and I am teaching my neighbours the same trade.", author_name: "Thabo M.", town_slug: "bloemfontein" },
  { title: "Soweto Street Food to Restaurant Dream", content: "I started selling vetkoek from a street corner in Vilakazi Street. With the NYDA grant and SEDA mentoring, I opened a small restaurant. Now tourists and locals eat here.", author_name: "Nompumelelo K.", town_slug: "soweto" },
  { title: "Farming in the Free State Changed My Family", content: "My father farmed other people's land his whole life. Through the agricultural support programme, I got my own piece of land. Now we grow maize and sunflowers. The land is ours.", author_name: "Pieter V.", town_slug: "ficksburg" },
  { title: "Digital Skills on the Wild Coast", content: "In Mthatha, I learned to code through a free online programme. Now I work remotely for a Cape Town company while living in the Transkei. The internet changed everything.", author_name: "Ayanda N.", town_slug: "mthatha" },
  { title: "Kimberley Big Hole, Big Dreams", content: "People say Kimberley is a diamond town that ran out of diamonds. But the real gem is the people. I started a hair salon with a R5,000 loan and now I employ three women.", author_name: "Reneilwe M.", town_slug: "kimberley" },
  { title: "From Tourist Guide to Tourism Owner in Knysna", content: "I guided tourists through the Knysna Heads for ten years. When COVID hit, I lost everything. But the Garden Route development fund helped me start a kayak tour business.", author_name: "Sipho D.", town_slug: "knysna" },
  { title: "Kruger Park Gateway: My Life in Nelspruit", content: "I grew up in Nelspruit watching tourists pass through to Kruger. Now I run a safari company from my township. The gateway to the park is also the gateway to opportunity.", author_name: "Mandla T.", town_slug: "nelspruit" },
  { title: "Wild Coast Spirit: Port St Johns", content: "The river mouth at Port St Johns is the most beautiful place on earth. I take tourists hiking and tell them the stories my grandmother told me. The Wild Coast is not wild — it's alive.", author_name: "Nomvula P.", town_slug: "port-st-johns" },
];

// ===== SEED FUNCTIONS =====

async function seedProvinces() {
  console.log('🌍 Seeding provinces...');
  let ok = 0;
  for (const p of PROVINCES) {
    const { error } = await supabase.from('provinces').upsert(p, { onConflict: 'slug' });
    if (error) console.error(`  ❌ ${p.name}: ${error.message}`);
    else { console.log(`  ✅ ${p.name}`); ok++; }
  }
  return ok;
}

async function seedTowns() {
  console.log('🏘️ Seeding towns...');
  let ok = 0;
  // Build a map of province slug → id
  const { data: provRows } = await supabase.from('provinces').select('id, slug');
  const provMap = {};
  (provRows || []).forEach(p => provMap[p.slug] = p.id);

  for (const t of TOWNS) {
    const { error } = await supabase.from('towns').upsert({
      name: t.name,
      slug: t.slug,
      province_id: provMap[t.province_slug],
      latitude: t.latitude,
      longitude: t.longitude,
      population_estimate: t.population_estimate,
      archetype: t.archetype,
      description: t.description,
    }, { onConflict: 'slug' });
    if (error) console.error(`  ❌ ${t.name}: ${error.message}`);
    else { console.log(`  ✅ ${t.name}`); ok++; }
  }
  return ok;
}

async function seedOpportunities() {
  console.log('💼 Seeding opportunities...');
  let ok = 0;

  // National
  for (const opp of NATIONAL_OPPORTUNITIES) {
    const { error } = await supabase.from('opportunities').insert({
      title: opp.title,
      type: opp.type,
      source: opp.source,
      deadline_date: opp.deadline_date,
      metadata: opp.metadata,
      town_id: null,
    });
    if (error) console.error(`  ❌ ${opp.title}: ${error.message}`);
    else ok++;
  }

  // Municipal
  for (const [townSlug, opps] of Object.entries(MUNICIPAL_OPPORTUNITIES)) {
    const { data: town } = await supabase.from('towns').select('id').eq('slug', townSlug).single();
    if (!town) { console.error(`  ❌ Town not found: ${townSlug}`); continue; }

    for (const opp of opps) {
      const { error } = await supabase.from('opportunities').insert({
        title: opp.title,
        type: opp.type,
        source: opp.source,
        deadline_date: opp.deadline_date,
        metadata: opp.metadata,
        town_id: town.id,
      });
      if (error) console.error(`  ❌ ${opp.title}: ${error.message}`);
      else ok++;
    }
  }
  console.log(`  ✅ ${ok} opportunities seeded`);
  return ok;
}

async function seedAccessPoints() {
  console.log('📍 Seeding access points...');
  let ok = 0;
  for (const ap of ACCESS_POINTS) {
    const { data: town } = await supabase.from('towns').select('id').eq('slug', ap.town_slug).single();
    if (!town) continue;
    const { error } = await supabase.from('access_points').insert({
      name: ap.name,
      category: ap.category,
      is_verified: ap.is_verified,
      town_id: town.id,
    });
    if (error) console.error(`  ❌ ${ap.name}: ${error.message}`);
    else ok++;
  }
  console.log(`  ✅ ${ok} access points seeded`);
  return ok;
}

async function seedBusinesses() {
  console.log('🏪 Seeding businesses...');
  let ok = 0;
  for (const b of BUSINESSES) {
    const { data: town } = await supabase.from('towns').select('id').eq('slug', b.town_slug).single();
    if (!town) continue;
    const { error } = await supabase.from('businesses').insert({
      name: b.name,
      category: b.category,
      is_verified: b.is_verified,
      town_id: town.id,
    });
    if (error) console.error(`  ❌ ${b.name}: ${error.message}`);
    else ok++;
  }
  console.log(`  ✅ ${ok} businesses seeded`);
  return ok;
}

async function seedEvents() {
  console.log('📅 Seeding events...');
  let ok = 0;
  for (const e of EVENTS) {
    const { data: town } = await supabase.from('towns').select('id').eq('slug', e.town_slug).single();
    if (!town) continue;
    const { error } = await supabase.from('events').insert({
      title: e.title,
      description: e.description,
      event_date: e.event_date,
      town_id: town.id,
    });
    if (error) console.error(`  ❌ ${e.title}: ${error.message}`);
    else ok++;
  }
  console.log(`  ✅ ${ok} events seeded`);
  return ok;
}

async function seedStories() {
  console.log('📖 Seeding stories...');
  let ok = 0;
  for (const s of STORIES) {
    const { data: town } = await supabase.from('towns').select('id').eq('slug', s.town_slug).single();
    if (!town) continue;
    const { error } = await supabase.from('stories').insert({
      title: s.title,
      content: s.content,
      author_name: s.author_name,
      town_id: town.id,
    });
    if (error) console.error(`  ❌ ${s.title}: ${error.message}`);
    else ok++;
  }
  console.log(`  ✅ ${ok} stories seeded`);
  return ok;
}

async function updateMetrics() {
  console.log('📊 Updating town_metrics...');
  const { data: towns } = await supabase.from('towns').select('id');
  let ok = 0;
  for (const town of towns || []) {
    const { count: oppCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .or(`town_id.eq.${town.id},town_id.is.null`);

    await supabase.from('town_metrics').upsert({
      town_id: town.id,
      open_opportunities: oppCount || 0,
      active_signals: 0,
    }, { onConflict: 'town_id' });
    ok++;
  }
  console.log(`  ✅ ${ok} town metrics updated`);
}

// ===== MAIN =====

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.');
    process.exit(1);
  }

  console.log('🚀 Ubuntu Town — Master Seed Script');
  console.log('====================================\n');

  const s = Date.now();
  await seedProvinces();
  await seedTowns();
  await seedOpportunities();
  await seedAccessPoints();
  await seedBusinesses();
  await seedEvents();
  await seedStories();
  await updateMetrics();

  console.log(`\n🎉 Done in ${((Date.now() - s) / 1000).toFixed(1)}s`);
}

main().catch(e => { console.error(e); process.exit(1); });
