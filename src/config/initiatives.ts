/**
 * UBUNTU TOWN — INITIATIVE CATALOG (blueprint-aligned)
 * ====================================================
 * The 13 initiatives from the 2026 National Blueprint. These are not 13 apps —
 * they are capabilities on one operating brain, sharing People / Work / Proof /
 * Opportunities. This catalog is the display + tiering source; membership and
 * per-initiative capabilities are wired in a later gate (Train 3).
 *
 * Tier (blueprint A–E) governs how an initiative surfaces per town:
 *   A universal · B core-town · C demand-led · D hub · E digital/national
 *
 * `live` marks what is actually operational in the app today (honesty: only the
 * civic Work Proof Loop is proven; the rest are catalog entries until built).
 */

export type InitiativeTier = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Initiative {
  key: string;
  name: string;
  blurb: string;
  tier: InitiativeTier;
  /** Lucide icon name (resolved in the UI). */
  icon: string;
  /** Operational in the app today? */
  live: boolean;
}

export const TIER_LABEL: Record<InitiativeTier, string> = {
  A: 'Universal',
  B: 'Core town',
  C: 'Demand-led',
  D: 'Hub',
  E: 'Digital / national',
};

export const INITIATIVES: Initiative[] = [
  { key: 'daycareos', name: 'Ubuntu DaycareOS', blurb: 'Care infrastructure for daycare centres, practitioners and families.', tier: 'C', icon: 'Baby', live: false },
  { key: 'kasibuy', name: 'KasiBuy', blurb: 'Local commerce & marketplace connecting buyers and merchants.', tier: 'B', icon: 'ShoppingBag', live: false },
  { key: 'framesouth', name: 'FrameSouth', blurb: 'Opportunity infrastructure for photographers and visual creators.', tier: 'C', icon: 'Camera', live: false },
  { key: 'insidetown', name: 'InsideTown', blurb: 'The digital window into the town — places, services, stories.', tier: 'A', icon: 'Newspaper', live: false },
  { key: 'fixeasy24', name: 'FixEasy24', blurb: 'Connects people who need work done with capable local providers.', tier: 'B', icon: 'Wrench', live: false },
  { key: 'familyhouse', name: 'Familyhouse', blurb: 'Township & small-town accommodation platform.', tier: 'C', icon: 'Home', live: false },
  { key: 'aicafe', name: 'AI Cafe', blurb: 'Internet cafés upgraded into AI-enabled local digital hubs.', tier: 'D', icon: 'Cpu', live: false },
  { key: 'uhurumail', name: 'UhuruMail', blurb: 'A simple, secure email client for the Ubuntu Town era.', tier: 'E', icon: 'Mail', live: false },
  { key: 'orbitmusic', name: 'OrbitMusic', blurb: 'Music & creator-economy infrastructure for musicians and producers.', tier: 'C', icon: 'Music', live: false },
  { key: 'ubuntu_trader', name: 'Ubuntu Trader', blurb: 'Operating tools for informal & emerging traders — stock, sales, margins.', tier: 'B', icon: 'Store', live: false },
  { key: 'ubuntu_socials', name: 'Ubuntu Socials', blurb: 'Digitally enabled savings & social groups built on trusted participation.', tier: 'B', icon: 'Users', live: false },
  { key: 'jeff', name: 'Jeff — AI Companion', blurb: 'A practical AI companion for guidance, learning and everyday tasks.', tier: 'E', icon: 'Sparkles', live: false },
  { key: 'ubuntu_tax', name: 'Ubuntu Tax', blurb: 'Personal & business tax made simple, practical and manageable.', tier: 'E', icon: 'FileText', live: false },
];

export const INITIATIVE_BY_KEY: Record<string, Initiative> = Object.fromEntries(
  INITIATIVES.map(i => [i.key, i]),
);
