#!/usr/bin/env node
/**
 * enrich-province-coordinators.mjs
 * Adds coordinator profiles and featured stories to province JSONs.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const DATA_DIR = join(process.cwd(), 'src/data/provinces');

(async () => {
  // Fetch coordinators with town info
  const { data: coords } = await sb.from('coordinators').select('id,display_name,status,town_id');
  const { data: towns } = await sb.from('towns').select('id,slug,province_id');
  const { data: stories } = await sb.from('stories').select('id,title,content,author_name,town_id');
  const { data: opps } = await sb.from('opportunities').select('id,title,type,source,town_id');

  const idToSlug = {};
  towns?.forEach(t => idToSlug[t.id] = t.slug);
  const townToProv = {};
  towns?.forEach(t => townToProv[t.id] = t.province_id);
  
  // Group by province
  const coordsByProv = {};
  coords?.forEach(c => {
    const provId = townToProv[c.town_id];
    if (!coordsByProv[provId]) coordsByProv[provId] = [];
    coordsByProv[provId].push({ name: c.display_name, status: c.status, town: idToSlug[c.town_id] });
  });

  const storiesByProv = {};
  stories?.forEach(s => {
    const provId = townToProv[s.town_id];
    if (!storiesByProv[provId]) storiesByProv[provId] = [];
    storiesByProv[provId].push({ title: s.title, content: s.content, author: s.author_name, town: idToSlug[s.town_id] });
  });

  const oppsByProv = {};
  opps?.forEach(o => {
    const provId = townToProv[o.town_id];
    if (!oppsByProv[provId]) oppsByProv[provId] = [];
    if (!oppsByProv[provId].find(x => x.title === o.title)) {
      oppsByProv[provId].push({ title: o.title, type: o.type, source: o.source, town: idToSlug[o.town_id] });
    }
  });

  // Process each province
  const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  const provMap = {};
  (await sb.from('provinces').select('id,slug')).data?.forEach(p => provMap[p.id] = p.slug);

  for (const file of files) {
    const provSlug = file.replace('.json', '');
    const filePath = join(DATA_DIR, file);
    const provData = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Find province ID
    const provId = Object.entries(provMap).find(([id, slug]) => slug === provSlug)?.[0];
    if (!provId) continue;

    // Add coordinators
    if (coordsByProv[provId]?.length) {
      provData.coordinators = coordsByProv[provId];
    }

    // Add featured stories (top 3)
    if (storiesByProv[provId]?.length) {
      provData.featured_stories = storiesByProv[provId].slice(0, 3);
    }

    // Add top opportunities (unique, top 5)
    if (oppsByProv[provId]?.length) {
      provData.top_opportunities = oppsByProv[provId].slice(0, 5);
    }

    writeFileSync(filePath, JSON.stringify(provData, null, 2) + '\n');
    const cCount = provData.coordinators?.length || 0;
    const sCount = provData.featured_stories?.length || 0;
    const oCount = provData.top_opportunities?.length || 0;
    console.log(`${provSlug}: ${cCount} coordinators, ${sCount} stories, ${oCount} opportunities`);
  }
})();
