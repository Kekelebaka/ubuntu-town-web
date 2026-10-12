#!/usr/bin/env node
// scripts/guard-env-separation.mjs
//
// ENVIRONMENT SEPARATION GUARD (Phase 2).
//
// Fails (exit 1) if any STAGING configuration references a PRODUCTION identifier
// (Supabase project ref, Pages project, or production publishable key). This closes the
// staging->production data-exposure path that `wrangler.work-staging.jsonc` had (it pointed
// at the production Supabase project under an E005 copy-paste header).
//
// A config file is treated as STAGING if its filename or its `name`/worker field contains
// "staging" or "stg". Every staging config is scanned for production identifiers.
//
// Usage:  node scripts/guard-env-separation.mjs [file.jsonc ...]
//         (with no args, scans the repo's wrangler*.jsonc + *.staging.* configs)

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// --- production identifiers that must NEVER appear in a staging config ---
const PRODUCTION_IDENTIFIERS = [
  'afiokbhuxfdacbsipoqk',                 // production Supabase project ref
  'ubuntu-town-web-git',                  // production Cloudflare Pages project
  'sb_publishable_JKHeDgqBRGv4vwCMIdo23w_NbU_HGR_', // production publishable key
];

const STAGING_MARKER = /staging|stg/i;

function stripComments(src) {
  // remove /* block */ and // line comments so documentation mentions aren't false positives;
  // only actual config VALUES are scanned.
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function isStagingConfig(path, content) {
  if (STAGING_MARKER.test(path)) return true;
  // also treat as staging if the worker name inside is staging-marked
  const nameMatch = content.match(/"name"\s*:\s*"([^"]+)"/);
  return !!(nameMatch && STAGING_MARKER.test(nameMatch[1]));
}

function collectFiles(args) {
  if (args.length) return args;
  const out = [];
  for (const f of readdirSync('.')) {
    if (/^wrangler.*\.(jsonc?|toml)$/i.test(f) || /\.staging\./i.test(f)) out.push(f);
  }
  return out.sort();
}

const files = collectFiles(process.argv.slice(2));
let violations = [];
let stagingChecked = 0;

for (const file of files) {
  let content;
  try { content = readFileSync(file, 'utf8'); } catch { continue; }
  if (!isStagingConfig(file, content)) continue;
  stagingChecked++;
  const scannable = stripComments(content);
  for (const id of PRODUCTION_IDENTIFIERS) {
    if (scannable.includes(id)) {
      const line = content.split('\n').findIndex(l => stripComments(l).includes(id)) + 1;
      violations.push({ file, id, line });
    }
  }
}

if (violations.length) {
  console.error('ENV SEPARATION GUARD: FAIL — staging config references a PRODUCTION identifier.');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ->  ${v.id}`);
  }
  console.error('Staging must target staging infrastructure only. Fix the config before deploying.');
  process.exit(1);
}

console.log(`ENV SEPARATION GUARD: PASS — ${stagingChecked} staging config(s) scanned, no production identifiers found.`);
process.exit(0);
