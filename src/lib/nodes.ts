import {
  Bot,
  Zap,
  ShoppingBag,
  GraduationCap,
  Hammer,
  Wrench,
  Recycle,
  Building2,
  Landmark,
  HeartPulse,
  type LucideIcon,
} from 'lucide-react';

/** One of the ten Ubuntu Town OS opportunity nodes. */
export interface OpportunityNode {
  slug: string;
  name: string;
  tagline: string;
  Icon: LucideIcon;
  /** CSS custom-property reference for the node accent, e.g. var(--color-ubuntu-purple). */
  accentVar: string;
}

/**
 * The canonical ten opportunity nodes. This is the single source of the node
 * taxonomy used across the public site and the app. (Ubuntu Wallet / fintech
 * product positioning was intentionally removed; Ubuntu Finance remains as an
 * access-to-tools node, not a wallet.)
 */
export const OPPORTUNITY_NODES: OpportunityNode[] = [
  { slug: 'ai-cafe', name: 'AI Café', tagline: 'Get online, get skilled, get paid.', Icon: Bot, accentVar: 'var(--color-ubuntu-purple)' },
  { slug: 'the-plug', name: 'The Plug', tagline: 'Airtime, data, electricity, bills — sorted.', Icon: Zap, accentVar: 'var(--color-ubuntu-orange)' },
  { slug: 'kasibuy', name: 'KasiBuy', tagline: 'Township commerce, delivered.', Icon: ShoppingBag, accentVar: 'var(--color-ubuntu-purple)' },
  { slug: 'ubuntu-academy', name: 'Ubuntu Academy', tagline: 'Learn by doing. Earn by proof.', Icon: GraduationCap, accentVar: 'var(--color-ubuntu-green)' },
  { slug: 'the-workshop', name: 'The Workshop', tagline: 'Make, repair, build, create.', Icon: Hammer, accentVar: 'var(--color-ubuntu-indigo)' },
  { slug: 'fixeasy24', name: 'FixEasy24', tagline: 'On-demand repairs, round the clock.', Icon: Wrench, accentVar: 'var(--color-ubuntu-orange)' },
  { slug: 'ecocycle', name: 'EcoCycle', tagline: 'Waste becomes worth.', Icon: Recycle, accentVar: 'var(--color-ubuntu-green)' },
  { slug: 'hubworks', name: 'HubWorks', tagline: 'The anchor workspace for every town.', Icon: Building2, accentVar: 'var(--color-ubuntu-purple)' },
  { slug: 'ubuntu-finance', name: 'Ubuntu Finance', tagline: 'Access to funding & financial tools.', Icon: Landmark, accentVar: 'var(--color-ubuntu-indigo)' },
  { slug: 'ubuntu-health', name: 'Ubuntu Health', tagline: 'Clinics, wellness & care access.', Icon: HeartPulse, accentVar: 'var(--color-node-health)' },
];
