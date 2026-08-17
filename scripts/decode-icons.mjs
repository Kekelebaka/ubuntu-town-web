// Regenerates public/icons/*.png from base64 source at build time.
// Zero dependencies (Node Buffer). Binary can't be committed via our tooling,
// so the source lives as base64 text and is decoded here before next build.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const src = JSON.parse(readFileSync(join(here, 'icons.b64.json'), 'utf8'));
const dir = join(root, 'public', 'icons');
mkdirSync(dir, { recursive: true });
for (const [name, b64] of Object.entries(src)) {
  writeFileSync(join(dir, `${name}.png`), Buffer.from(b64, 'base64'));
}
console.log(`[decode-icons] wrote ${Object.keys(src).length} icons to public/icons/`);
