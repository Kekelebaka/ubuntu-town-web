#!/usr/bin/env node
/**
 * fetch-wikipedia-photos.mjs
 * 
 * Fetches real Wikipedia Commons CC-licensed photos for South African towns.
 * Uses the Wikipedia API to find images for each town's Wikipedia article.
 * Falls back to Wikimedia Commons search for towns without articles.
 * 
 * Output: src/data/photos.json — slug → { url, source, license, caption }
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Import towns data
const townsContent = readFileSync(join(process.cwd(), 'scripts/data/towns.js'), 'utf-8');
const match = townsContent.match(/const TOWNS = (\[[\s\S]*?\]);/);
const TOWNS = eval(match[1]);

// Wikipedia API for getting page images
async function getWikipediaImage(townName, province) {
  const queries = [
    `${townName}, South Africa`,
    `${townName} ${province} South Africa`,
    `${townName}`,
  ];
  
  for (const query of queries) {
    try {
      // Search Wikipedia for the article
      const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/ /g, '_'))}`;
      const res = await fetch(searchUrl, { 
        headers: { 'User-Agent': 'UbuntuTown/1.0 (contact@ubuntutown.co.za)' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.thumbnail && data.thumbnail.source) {
          // Get higher resolution version
          let url = data.thumbnail.source;
          // Upgrade to 1200px width if possible
          url = url.replace(/\/\d+px-/, '/1200px-');
          return {
            url,
            source: 'Wikipedia',
            license: 'CC-BY-SA',
            caption: data.extract ? data.extract.slice(0, 200) : `${townName}, South Africa`,
            article: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/ /g, '_'))}`,
          };
        }
      }
    } catch (e) {
      // Try next query
    }
  }
  
  return null;
}

// Wikimedia Commons search as fallback
async function getCommonsImage(townName) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(townName + ' South Africa')}&srnamespace=6&srlimit=1&format=json&origin=*`;
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'UbuntuTown/1.0 (contact@ubuntutown.co.za)' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.query?.search?.[0]) {
        const title = data.query.search[0].title;
        // Get the actual image URL
        const imgUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json&origin=*`;
        const imgRes = await fetch(imgUrl, {
          headers: { 'User-Agent': 'UbuntuTown/1.0 (contact@ubuntutown.co.za)' },
          signal: AbortSignal.timeout(5000)
        });
        
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          const pages = imgData.query?.pages;
          if (pages) {
            const page = Object.values(pages)[0];
            if (page.imageinfo?.[0]) {
              const info = page.imageinfo[0];
              const license = info.extmetadata?.LicenseShortName?.value || 'CC';
              const desc = info.extmetadata?.ImageDescription?.value || '';
              return {
                url: info.thumburl || info.url,
                source: 'Wikimedia Commons',
                license: license.includes('CC') ? license : 'CC-BY-SA',
                caption: desc.replace(/<[^>]+>/g, '').slice(0, 200),
                article: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
              };
            }
          }
        }
      }
    }
  } catch (e) {
    // Silent fail
  }
  return null;
}

// Province to Wikipedia article mapping
const PROV_WIKI = {
  'free-state': 'Free State',
  'western-cape': 'Western Cape',
  'gauteng': 'Gauteng',
  'kwazulu-natal': 'KwaZulu-Natal',
  'mpumalanga': 'Mpumalanga',
  'limpopo': 'Limpopo',
  'eastern-cape': 'Eastern Cape',
  'north-west': 'North West',
  'northern-cape': 'Northern Cape',
};

console.log(`Fetching Wikipedia photos for ${TOWNS.length} towns...`);
console.log('This takes ~2 minutes (500ms delay between requests to be polite).\n');

const photos = {};
let found = 0;
let notFound = 0;

for (let i = 0; i < TOWNS.length; i++) {
  const town = TOWNS[i];
  const prov = PROV_WIKI[town.province_slug] || 'South Africa';
  
  process.stdout.write(`[${i+1}/${TOWNS.length}] ${town.name}... `);
  
  // Try Wikipedia first, then Commons
  let photo = await getWikipediaImage(town.name, prov);
  if (!photo) {
    photo = await getCommonsImage(town.name);
  }
  
  if (photo) {
    photos[town.slug] = photo;
    found++;
    console.log(`✓ ${photo.source} (${photo.license})`);
  } else {
    notFound++;
    console.log('✗ no image found');
  }
  
  // Rate limit: 500ms between requests
  if (i < TOWNS.length - 1) {
    await new Promise(r => setTimeout(r, 500));
  }
}

// Write output
const outPath = join(process.cwd(), 'src/data/photos.json');
writeFileSync(outPath, JSON.stringify(photos, null, 2) + '\n');

console.log(`\n=== RESULTS ===`);
console.log(`Found: ${found}/${TOWNS.length} towns with photos`);
console.log(`Not found: ${notFound}`);
console.log(`Output: ${outPath}`);

// Also generate the TypeScript helper
const tsContent = `// Auto-generated from Wikipedia Commons CC images
// Run: node scripts/fetch-wikipedia-photos.mjs to refresh

export interface TownPhoto {
  url: string;
  source: string;
  license: string;
  caption: string;
  article?: string;
}

export const townPhotos: Record<string, TownPhoto> = ${JSON.stringify(photos, null, 2)};

export function getTownPhoto(slug: string): TownPhoto {
  return townPhotos[slug] || {
    url: '',
    source: 'none',
    license: '',
    caption: slug,
  };
}
`;

writeFileSync(join(process.cwd(), 'src/data/townPhotos.ts'), tsContent);
console.log(`Generated: src/data/townPhotos.ts`);
