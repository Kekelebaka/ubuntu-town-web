#!/usr/bin/env node
/**
 * enrich-cv-counts.mjs
 * Counts profiles per town and adds cv_count to province JSONs.
 * Shows "N youth have created CVs" on town pages.
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
  // Get profiles with town info
  const { data: profiles } = await sb.from('profiles').select('id,town_id');
  const { data: towns } = await sb.from('towns').select('id,slug');

  const idToSlug = {};
  towns?.forEach(t => idToSlug[t.id] = t.slug);

  // Count profiles per town
  const counts = {};
  profiles?.forEach(p => {
    const slug = idToSlug[p.town_id];
    if (slug) {
      counts[slug] = (counts[slug] || 0) + 1;
    }
  });

  console.log('CV counts per town:', counts);

  // Add to province JSONs
  const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  let total = 0;

  for (const file of files) {
    const filePath = join(DATA_DIR, file);
    const provData = JSON.parse(readFileSync(filePath, 'utf-8'));
    let changed = false;

    for (const town of provData.towns) {
      if (counts[town.slug]) {
        town.cv_count = counts[town.slug];
        changed = true;
        total++;
      }
    }

    if (changed) {
      writeFileSync(filePath, JSON.stringify(provData, null, 2) + '\n');
    }
  }

  console.log(`Added CV counts to ${total} towns`);
})();
