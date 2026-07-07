#!/usr/bin/env node
/**
 * enrich-supabase-data.mjs
 * 
 * Queries Supabase for opportunities, signals, stories, businesses,
 * events, access_points and merges them into province JSON files.
 * Also adds seed stories/businesses/events for towns not yet in Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('[enrich] No Supabase credentials — skipping');
  process.exit(0);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// Seed stories for towns not in Supabase
const SEED_STORIES = [
  { slug: 'clarens', title: 'Art Village Rising', content: 'Clarens galleries now attract visitors from around the world. The annual Arts Festival brings thousands to our small mountain village.', author_name: 'Anna V.' },
  { slug: 'harrismith', title: 'N3 Crossroads Opportunity', content: 'Being on the N3 between Joburg and Durban means truckers stop here. We are turning that traffic into trade.', author_name: 'Sipho M.' },
  { slug: 'cape-town', title: 'From Khayelitsha to Cape Town IT', content: 'Sipho started as volunteer coordinator, now works at a tech startup in the CBD. Ubuntu Town changed his life.', author_name: 'Sipho N.' },
  { slug: 'durban', title: 'Warwick Junction Traders Unite', content: 'The informal traders at Warwick Junction formed a cooperative. Now we share resources and market together.', author_name: 'Nomsa K.' },
  { slug: 'nelspruit', title: 'Kruger Gateway Tourism Boost', content: 'Tourists passing through to Kruger now stop in Nelspruit. Our tourism guides created walking tours of the town.', author_name: 'Mandla T.' },
  { slug: 'kimberley', title: 'Big Hole, Big Dreams', content: 'People say Kimberley ran out of diamonds. But the real gem is the people. I started a hair salon with R5,000.', author_name: 'Reneilwe M.' },
  { slug: 'polokwane', title: 'Street Light Signal Fixed', content: 'After a signal was logged, coordinator escalated. Within 10 days, LED replacements installed in Seshego.', author_name: 'Tshilidzi M.' },
  { slug: 'east-london', title: 'Wild Coast Coding Academy', content: 'In Mdantsane, youth are learning to code through free programmes. Now some work remotely for Cape Town companies.', author_name: 'Ayanda N.' },
  { slug: 'rustenburg', title: 'Mining Town Diversifies', content: 'Rustenburg is more than platinum. The tourism sector is growing with Sun City and Pilanesberg nearby.', author_name: 'Pieter V.' },
  { slug: 'mafikeng', title: 'First Digital Business Map', content: 'Kelebogile mapped 47 businesses. 12 had no online presence. Now they do. Mafikeng is going digital.', author_name: 'Kelebogile T.' },
];

// Seed events for major towns
const SEED_EVENTS = [
  { slug: 'ficksburg', title: 'Cherry Festival', description: 'Annual cherry harvest celebration with tastings, music, and market stalls', event_date: '2026-11-15' },
  { slug: 'clarens', title: 'Clarens Arts Festival', description: 'Annual arts and culture festival celebrating local talent', event_date: '2026-09-20' },
  { slug: 'bloemfontein', title: 'MACUFE Festival', description: 'Mangaung African Cultural Festival — music, dance, art, and theatre', event_date: '2026-10-01' },
  { slug: 'cape-town', title: 'Cape Town Youth Skills Fair', description: 'Free skills fair with 20+ exhibitors and training providers', event_date: '2026-07-22' },
  { slug: 'durban', title: 'Durban July', description: 'South Africa\'s premier horse racing and fashion event', event_date: '2026-07-04' },
  { slug: 'johannesburg', title: 'Ubuntu Town JHB Launch', description: 'Official launch of Ubuntu Town digital twin for Johannesburg', event_date: '2026-07-15' },
  { slug: 'knysna', title: 'Knysna Oyster Festival', description: 'Food, sport, and oysters on the Garden Route', event_date: '2026-07-01' },
  { slug: 'hermanus', title: 'Whale Festival', description: 'Celebration of the southern right whale season', event_date: '2026-10-01' },
  { slug: 'rustenburg', title: 'Bafokeng Cultural Festival', description: 'Traditional Setswana cultural celebration', event_date: '2026-12-16' },
  { slug: 'nelspruit', title: 'Lowveld Agrifood Expo', description: 'Agricultural and food expo showcasing Mpumalanga produce', event_date: '2026-08-20' },
];

// Seed businesses for towns not in Supabase
const SEED_BUSINESSES = [
  { slug: 'ladybrand', name: 'Ladybrand Farm Stall', category: 'food', is_verified: false },
  { slug: 'ficksburg', name: 'Cherry Festival Market', category: 'tourism', is_verified: false },
  { slug: 'clarens', name: 'Clarens Brewery', category: 'food', is_verified: false },
  { slug: 'clarens', name: 'Clarens Village Square Art Gallery', category: 'tourism', is_verified: false },
  { slug: 'bethlehem', name: 'Maluti View B&B', category: 'hospitality', is_verified: false },
  { slug: 'harrismith', name: 'Platberg Mountain Resort', category: 'hospitality', is_verified: false },
  { slug: 'george', name: 'Outeniqua Transport Museum', category: 'tourism', is_verified: false },
  { slug: 'stellenbosch', name: 'Stellenbosch Wine Estates', category: 'food', is_verified: false },
  { slug: 'knysna', name: 'Knysna Heads Restaurant', category: 'food', is_verified: false },
  { slug: 'hermanus', name: 'Hermanus Whale Watching', category: 'tourism', is_verified: false },
  { slug: 'newcastle', name: 'Newcastle Show Grounds', category: 'tourism', is_verified: false },
  { slug: 'pietermaritzburg', name: 'Midlands Meander Craft Route', category: 'tourism', is_verified: false },
  { slug: 'gqeberha', name: 'Addo Elephant National Park', category: 'tourism', is_verified: false },
  { slug: 'mthatha', name: 'Mandela Museum', category: 'tourism', is_verified: false },
  { slug: 'thohoyandou', name: 'University of Venda', category: 'education', is_verified: false },
  { slug: 'upington', name: 'Orange River Wine Cellars', category: 'food', is_verified: false },
  { slug: 'springbok', name: 'Namaqualand Tourism', category: 'tourism', is_verified: false },
  { slug: 'brits', name: 'Pilanesberg Game Reserve', category: 'tourism', is_verified: false },
];

const DATA_DIR = join(process.cwd(), 'src/data/provinces');

(async () => {
  console.log('[enrich] Querying Supabase for all content...');
  
  // Fetch all data
  const [oppsRes, sigsRes, storiesRes, bizRes, eventsRes, apRes, townsRes] = await Promise.all([
    sb.from('opportunities').select('id,title,type,source,deadline_date,town_id,metadata'),
    sb.from('town_signals').select('id,title,category,status,town_id'),
    sb.from('stories').select('id,title,content,author_name,town_id'),
    sb.from('businesses').select('id,name,category,is_verified,town_id'),
    sb.from('events').select('id,title,description,event_date,town_id'),
    sb.from('access_points').select('id,name,category,is_verified,town_id'),
    sb.from('towns').select('id,slug'),
  ]);

  // Build town_id → slug mapping
  const idToSlug = {};
  (townsRes.data || []).forEach(t => idToSlug[t.id] = t.slug);

  // Group data by town slug
  const oppsByTown = {};
  (oppsRes.data || []).forEach(o => {
    const slug = idToSlug[o.town_id];
    if (slug) { if (!oppsByTown[slug]) oppsByTown[slug] = []; oppsByTown[slug].push(o); }
  });

  const sigsByTown = {};
  (sigsRes.data || []).forEach(s => {
    const slug = idToSlug[s.town_id];
    if (slug) { if (!sigsByTown[slug]) sigsByTown[slug] = []; sigsByTown[slug].push(s); }
  });

  const storiesByTown = {};
  (storiesRes.data || []).forEach(s => {
    const slug = idToSlug[s.town_id];
    if (slug) { if (!storiesByTown[slug]) storiesByTown[slug] = []; storiesByTown[slug].push(s); }
  });

  const bizByTown = {};
  (bizRes.data || []).forEach(b => {
    const slug = idToSlug[b.town_id];
    if (slug) { if (!bizByTown[slug]) bizByTown[slug] = []; bizByTown[slug].push(b); }
  });

  const eventsByTown = {};
  (eventsRes.data || []).forEach(e => {
    const slug = idToSlug[e.town_id];
    if (slug) { if (!eventsByTown[slug]) eventsByTown[slug] = []; eventsByTown[slug].push(e); }
  });

  const apByTown = {};
  (apRes.data || []).forEach(a => {
    const slug = idToSlug[a.town_id];
    if (slug) { if (!apByTown[slug]) apByTown[slug] = []; apByTown[slug].push(a); }
  });

  // Add seed data for towns not in Supabase
  SEED_STORIES.forEach(s => {
    if (!storiesByTown[s.slug]) storiesByTown[s.slug] = [];
    storiesByTown[s.slug].push({ ...s, id: `seed-${s.slug}-story`, town_id: null });
  });
  SEED_EVENTS.forEach(e => {
    if (!eventsByTown[e.slug]) eventsByTown[e.slug] = [];
    eventsByTown[e.slug].push({ ...e, id: `seed-${e.slug}-evt`, town_id: null });
  });
  SEED_BUSINESSES.forEach(b => {
    if (!bizByTown[b.slug]) bizByTown[b.slug] = [];
    bizByTown[b.slug].push({ ...b, id: `seed-${b.slug}-biz`, town_id: null });
  });

  console.log(`[enrich] Opps: ${Object.keys(oppsByTown).length} towns, Sigs: ${Object.keys(sigsByTown).length}, Stories: ${Object.keys(storiesByTown).length}, Biz: ${Object.keys(bizByTown).length}, Events: ${Object.keys(eventsByTown).length}`);

  // Process each province
  const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  let totalEnriched = 0;

  for (const file of files) {
    const filePath = join(DATA_DIR, file);
    const provData = JSON.parse(readFileSync(filePath, 'utf-8'));

    for (const town of provData.towns) {
      const s = town.slug;
      let changed = false;

      if (oppsByTown[s]?.length) { town.opportunities = oppsByTown[s]; changed = true; }
      if (sigsByTown[s]?.length) { town.signals = sigsByTown[s]; changed = true; }
      if (storiesByTown[s]?.length) { town.stories = storiesByTown[s]; changed = true; }
      if (bizByTown[s]?.length) { town.businesses = bizByTown[s]; changed = true; }
      if (eventsByTown[s]?.length) { town.events = eventsByTown[s]; changed = true; }
      if (apByTown[s]?.length) { town.access_points = apByTown[s]; changed = true; }
      if (changed) totalEnriched++;
    }

    writeFileSync(filePath, JSON.stringify(provData, null, 2) + '\n');
    const enriched = provData.towns.filter(t => t.opportunities || t.stories || t.businesses).length;
    console.log(`${file.replace('.json','')}: ${enriched} towns with content`);
  }

  console.log(`\n[enrich] Done: ${totalEnriched} towns enriched with Supabase content`);
})();
