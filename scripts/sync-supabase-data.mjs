#!/usr/bin/env node
/**
 * sync-supabase-data.mjs
 * 
 * Runs at build time: queries Supabase for real town data and enriches
 * the static province JSON files with live metrics, opportunity counts,
 * and coordinator status.
 * 
 * Towns in Supabase get real data overlaid.
 * Towns NOT in Supabase keep their illustrative values.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('[sync] No Supabase credentials — skipping enrichment');
  process.exit(0);
}

// Skip if placeholder values
if (SUPABASE_URL.includes('placeholder') || SUPABASE_KEY === 'placeholder-key') {
  console.log('[sync] Placeholder credentials — skipping enrichment');
  process.exit(0);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// Auto-detect schema: check if towns table has province_id (old) or province (uto)
let USE_UTO = false;

async function detectSchema() {
  try {
    const { data } = await sb.from('towns').select('province_id').limit(1);
    if (data && data.length > 0 && data[0].province_id !== undefined) {
      USE_UTO = false;
      console.log('[sync] Schema: old (province_id)');
      return;
    }
  } catch {}
  // Try uto-style
  try {
    const { data } = await sb.from('towns').select('province').limit(1);
    if (data !== null) {
      USE_UTO = true;
      console.log('[sync] Schema: uto (province text)');
      return;
    }
  } catch {}
  console.log('[sync] Schema: defaulting to old');
}

// Province ID → JSON slug mapping (old schema)
const PROV_MAP = {
  'prov-gauteng': 'gauteng',
  'prov-wc': 'western-cape',
  'prov-kzn': 'kwaZulu-natal',
  'prov-ec': 'eastern-cape',
  'prov-limp': 'limpopo',
  'prov-mpu': 'mpumalanga',
  'prov-nw': 'north-west',
  'prov-fs': 'free-state',
  'prov-nc': 'northern-cape',
};

// Reverse: JSON slug → province ID
const SLUG_TO_PROV = Object.fromEntries(Object.entries(PROV_MAP).map(([k, v]) => [v, k]));

function calcRenderPct(metrics, oppCount) {
  if (!metrics) return 0;
  // Composite score: youth mapped + coordinators + opportunities + signals
  const youthScore = Math.min(40, (metrics.youth_mapped || 0) / 10);
  const coordScore = Math.min(20, (metrics.active_coordinators || 0) * 10);
  const oppScore = Math.min(25, (oppCount || 0) * 5);
  const signalScore = Math.min(15, (metrics.active_signals || 0) * 5);
  return Math.round(youthScore + coordScore + oppScore + signalScore);
}

(async () => {
  console.log('[sync] Querying Supabase...');
  
  await detectSchema();
  
  // Fetch all data in parallel — adjust selects based on schema
  const townSelect = USE_UTO 
    ? 'id,name,slug,province,population_estimate'
    : 'id,name,slug,province_id,coordinator_id,population_estimate';
  
  const [townsRes, metricsRes, oppsRes, coordsRes] = await Promise.all([
    sb.from('towns').select(townSelect),
    sb.from('town_metrics').select('town_id,youth_mapped,active_coordinators,open_opportunities,active_signals'),
    sb.from('opportunities').select('town_id,type'),
    sb.from('coordinators').select('id,display_name,status,town_id'),
  ]);

  if (townsRes.error) { console.error('[sync] Towns query failed:', townsRes.error.message); process.exit(1); }
  
  const dbTowns = townsRes.data || [];
  const dbMetrics = metricsRes.data || [];
  const dbOpps = oppsRes.data || [];
  const dbCoords = coordsRes.data || [];
  
  console.log(`[sync] Loaded: ${dbTowns.length} towns, ${dbMetrics.length} metrics, ${dbOpps.length} opportunities, ${dbCoords.length} coordinators`);

  // Build lookup maps
  const metricsByTown = {};
  dbMetrics.forEach(m => { metricsByTown[m.town_id] = m; });
  
  const oppCountByTown = {};
  dbOpps.forEach(o => { oppCountByTown[o.town_id] = (oppCountByTown[o.town_id] || 0) + 1; });
  
  const coordsByTown = {};
  dbCoords.forEach(c => {
    if (!coordsByTown[c.town_id]) coordsByTown[c.town_id] = [];
    coordsByTown[c.town_id].push(c);
  });

  // Process each province JSON file
  const dataDir = join(process.cwd(), 'src/data/provinces');
  const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));
  
  let totalEnriched = 0;
  let totalAdded = 0;
  
  for (const file of files) {
    const provSlug = file.replace('.json', '');
    const provId = SLUG_TO_PROV[provSlug];
    if (!provId) {
      console.log(`[sync] No province mapping for ${provSlug} — skipping`);
      continue;
    }
    
    const filePath = join(dataDir, file);
    const provData = JSON.parse(readFileSync(filePath, 'utf-8'));
    
    // Find Supabase towns for this province
    const provTowns = USE_UTO
      ? dbTowns.filter(t => {
          const prov = (t.province || '').toLowerCase().replace(/\s+/g, '-');
          return prov === provSlug || provSlug.includes(prov);
        })
      : dbTowns.filter(t => t.province_id === provId);
    
    // Enrich existing towns
    for (const jsonTown of provData.towns) {
      const dbTown = provTowns.find(t => t.slug === jsonTown.slug);
      if (dbTown) {
        // Town exists in Supabase — overlay real data
        const metrics = metricsByTown[dbTown.id];
        const oppCount = oppCountByTown[dbTown.id] || 0;
        const coords = coordsByTown[dbTown.id] || [];
        
        jsonTown.render_pct = calcRenderPct(metrics, oppCount);
        jsonTown.opportunity_potential = Math.max(jsonTown.opportunity_potential || 0, oppCount * 15);
        
        if (coords.length > 0) {
          jsonTown.coordinator_status = 'assigned';
          // uto coordinator visibility rule: never show name until contract signed
          if (!USE_UTO) jsonTown.coordinator_name = coords[0].display_name;
        }
        
        if (metrics) {
          jsonTown.youth_mapped = metrics.youth_mapped;
          jsonTown.active_signals = metrics.active_signals;
          jsonTown.open_opportunities = metrics.open_opportunities;
        }
        
        // If it has a coordinator and metrics, mark as building or live
        if (coords.length > 0 && metrics && (metrics.youth_mapped || 0) > 100) {
          jsonTown.status = 'building';
          jsonTown.illustrative = false;
        }
        
        totalEnriched++;
      }
    }
    
    // Add Supabase towns not in JSON (new towns discovered from DB)
    for (const dbTown of provTowns) {
      if (provData.towns.find(t => t.slug === dbTown.slug)) continue; // already in JSON
      
      const metrics = metricsByTown[dbTown.id];
      const oppCount = oppCountByTown[dbTown.id] || 0;
      const coords = coordsByTown[dbTown.id] || [];
      
      const renderPct = calcRenderPct(metrics, oppCount);
      const hasCoordinator = coords.length > 0;
      const hasMetrics = metrics && (metrics.youth_mapped || 0) > 0;
      
      let status = 'ghost';
      if (hasCoordinator && hasMetrics && renderPct > 30) status = 'building';
      else if (hasCoordinator) status = 'building';
      
      const newTown = {
        slug: dbTown.slug,
        name: dbTown.name,
        region: '',
        status,
        render_pct: renderPct,
        opportunity_potential: Math.max(oppCount * 15, 30),
        coordinator_status: hasCoordinator ? 'assigned' : 'recruiting',
        route: `/town/${dbTown.slug}`,
        illustrative: false,
      };
      
      if (hasCoordinator) {
        if (!USE_UTO) newTown.coordinator_name = coords[0].display_name;
      }
      if (metrics) {
        newTown.youth_mapped = metrics.youth_mapped;
        newTown.active_signals = metrics.active_signals;
        newTown.open_opportunities = metrics.open_opportunities;
      }
      
      provData.towns.push(newTown);
      totalAdded++;
    }
    
    // Recalculate aggregates from actual town data
    const towns = provData.towns;
    const live = towns.filter(t => t.status === 'live').length;
    const building = towns.filter(t => t.status === 'building').length;
    const unclaimed = towns.filter(t => t.status === 'ghost').length;
    const avgOpp = towns.reduce((sum, t) => sum + (t.render_pct || 0), 0) / Math.max(towns.length, 1);
    
    provData.aggregates = {
      towns: towns.length,
      live,
      building,
      unclaimed,
      opportunity_index_avg: Math.round(avgOpp * 10) / 10,
    };
    
    provData.data_vintage = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    writeFileSync(filePath, JSON.stringify(provData, null, 2) + '\n');
    console.log(`[sync] ${provSlug}: ${provData.towns.length} towns (${live} live, ${building} building, ${unclaimed} unclaimed)`);
  }
  
  console.log(`[sync] Done: ${totalEnriched} towns enriched, ${totalAdded} new towns added from Supabase`);
})();
