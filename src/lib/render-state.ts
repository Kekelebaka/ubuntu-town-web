import { TownStatus } from './ubuntu-town-types';

// Town-size-tiered targets (from §7 of the build spec)
const TIER_TARGETS = {
  small: { coverage: 60, proof: 60 },   // < 30,000
  mid:   { coverage: 120, proof: 120 },  // 30,000–100,000
  large: { coverage: 180, proof: 180 },  // > 100,000
} as const;

export function getTownTier(population: number): 'small' | 'mid' | 'large' {
  if (population < 30000) return 'small';
  if (population <= 100000) return 'mid';
  return 'large';
}

export function calcRenderPct(params: {
  locatedPoints: number;
  proofUnits: number;
  publishedModules: number;
  population: number;
}): number {
  const tier = getTownTier(params.population);
  const targets = TIER_TARGETS[tier];
  const coverage = Math.min(1, params.locatedPoints / targets.coverage);
  const proof = Math.min(1, params.proofUnits / targets.proof);
  const modules = params.publishedModules / 8;
  return Math.round(100 * (0.45 * coverage + 0.30 * proof + 0.25 * modules));
}

export function deriveStatus(renderPct: number, hasCoordinator: boolean): TownStatus {
  if (!hasCoordinator || renderPct < 5) return 'ghost';
  if (renderPct >= 95) return 'live';
  return 'building';
}

export function getStatusSkin(status: TownStatus, renderPct: number, hue: number = 35) {
  switch (status) {
    case 'ghost':
      return {
        bg: '#F6EDDB', border: '#ECE3D2', borderStyle: 'dashed',
        textMuted: true, glow: 'none', pinOpacity: 0.15,
      };
    case 'building':
      const i = renderPct / 100;
      return {
        bg: `hsl(${hue}, ${Math.round(30 + 25 * i)}%, ${Math.round(92 - 12 * i)}%)`,
        border: `hsl(${hue}, ${Math.round(25 + 20 * i)}%, ${Math.round(80 - 10 * i)}%)`,
        borderStyle: 'solid', textMuted: false,
        glow: `0 0 ${Math.round(20 * i)}px hsla(${hue}, 40%, 50%, ${0.1 + 0.15 * i})`,
        pinOpacity: 0.3 + 0.7 * i,
      };
    case 'live':
      return {
        bg: '#FFFFFF', border: '#EEB849', borderStyle: 'solid',
        textMuted: false, glow: '0 0 30px rgba(238,184,73,0.25)', pinOpacity: 1,
      };
  }
}

export function hashToHue(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}
