/**
 * UBUNTU TOWN — CAPABILITY REGISTRY
 * =================================
 *
 * One app. One person. One town context. Many capabilities.
 *
 * The shell asks a single question — "what can this person do?" — instead of
 * scattering `role === 'coordinator'` checks through React. Every navigation
 * item, every entry in the universal +, and every role-adaptive surface is
 * composed from this registry.
 *
 * ---------------------------------------------------------------------------
 * THE RULE THAT KEEPS THIS HONEST
 * ---------------------------------------------------------------------------
 * A capability decides what a person is SHOWN. It never decides what a person
 * is ALLOWED to do. Authority lives in the database and only in the database:
 * row-level security, the app.* helper family, and the trigger-owned state
 * machine. This registry is a composition layer over that authority, not a
 * second copy of it.
 *
 * To make that impossible to forget, every capability must declare `enforcedBy`
 * — the database object that actually refuses the action when the UI is wrong,
 * bypassed, or called directly against the API. If a capability cannot name its
 * enforcement, it is not a capability; it is a wish, and it does not belong
 * here until the backend can refuse it.
 *
 * Proven examples of that enforcement, from the North Star gates:
 *   - creating work in another town  -> 42501 (cw_insert_scope)
 *   - attaching evidence cross-town  -> 42501 (proofs_cw_insert)
 *   - forcing draft -> published     -> illegal status transition (tg_work_guard)
 *   - forging an approval record     -> 42501 (work_approvals is trigger-written)
 *
 * ---------------------------------------------------------------------------
 * EXTENDING
 * ---------------------------------------------------------------------------
 * Initiative memberships (Ubuntu Trader, FrameSouth, KasiBuy…) do not exist as
 * canonical objects yet. `requires.membership` is defined now so that the
 * People/Initiative gates can populate it later WITHOUT reworking the shell.
 * Until then, membership-gated capabilities simply resolve to false.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Home, MapPin, Briefcase, Camera, Users, UserPlus, Boxes, Inbox, Compass,
  IdCard, Settings, ClipboardCheck, Megaphone, Sparkles, Signal, Target,
} from 'lucide-react';

/** Canonical role keys — mirrors the uto.role_key enum. Do not invent new ones. */
export type RoleKey =
  | 'admin' | 'ops' | 'coordinator' | 'deputy'
  | 'ambassador' | 'media' | 'partner' | 'sponsor' | 'viewer';

/** Initiative keys. Placeholder until initiative membership becomes canonical. */
export type InitiativeKey =
  | 'ubuntu_trader' | 'framesouth' | 'kasibuy' | 'fixeasy' | 'academy' | 'daycareos';

export type CapabilityCategory =
  | 'core' | 'work' | 'people' | 'initiative' | 'comms' | 'growth' | 'ops';

/** Where a capability may surface. Keeps navigation honest and intentional. */
export type Surface = 'nav' | 'more' | 'universal_action' | 'today' | 'contextual';

export interface Capability {
  key: string;
  name: string;
  /** Short, operational, human. Shown in menus and the universal action sheet. */
  description: string;
  category: CapabilityCategory;
  icon: LucideIcon;
  /** Destination. Omit for capabilities that open a sheet rather than navigate. */
  route?: string;
  surfaces: Surface[];
  requires: {
    /** Any one of these town-scoped roles satisfies the requirement. */
    roles?: RoleKey[];
    /** Requires national scope (role_assignments.town_id IS NULL). */
    national?: boolean;
    /** Requires membership of an initiative. Not yet canonical — see header. */
    membership?: InitiativeKey;
    /** Requires an active town context. */
    town?: boolean;
  };
  /**
   * The database object that ACTUALLY refuses this action.
   * Not documentation — the reason this registry cannot become a second
   * authorization system. Every entry must name one.
   */
  enforcedBy: string;
  /** Not yet built. Renders as "coming soon" rather than a dead link. */
  comingSoon?: boolean;
}

export const CAPABILITIES: Capability[] = [
  // ---------------------------------------------------------------- core ---
  {
    key: 'today.view',
    name: 'Today',
    description: 'What needs you today',
    category: 'core',
    icon: Home,
    route: '/workspace',
    surfaces: ['nav'],
    requires: {},
    enforcedBy: 'RLS on every underlying read; the page composes only what the caller may see',
  },
  {
    key: 'town.view',
    name: 'Town',
    description: 'Your town at a glance',
    category: 'core',
    icon: MapPin,
    route: '/workspace',
    surfaces: ['nav'],
    requires: { town: true },
    enforcedBy: 'uto.towns read policies',
  },

  // ---------------------------------------------------------------- work ---
  {
    key: 'work.view',
    name: 'Work',
    description: 'Community work in your town',
    category: 'work',
    icon: Briefcase,
    route: '/workspace',
    surfaces: ['nav'],
    requires: {},
    enforcedBy: 'cw_read_scope / cw_read_owner / cw_read_public',
  },
  {
    key: 'work.create',
    name: 'Record work',
    description: 'Capture a new piece of community work',
    category: 'work',
    icon: Briefcase,
    route: '/workspace/new',
    surfaces: ['universal_action'],
    requires: { roles: ['coordinator', 'deputy', 'ops', 'admin'], town: true },
    enforcedBy: 'cw_insert_scope — created_by = auth.uid() AND app.has_town_scope(town_id)',
  },
  {
    key: 'work.evidence.add',
    name: 'Add evidence',
    description: 'Attach proof to work you can write',
    category: 'work',
    icon: Camera,
    surfaces: ['universal_action', 'contextual'],
    requires: { roles: ['coordinator', 'deputy', 'ops', 'admin'] },
    enforcedBy: 'proofs_cw_insert + proofs_parent_integrity — app.can_write_work(community_work_id)',
  },
  {
    key: 'work.review',
    name: 'Review queue',
    description: 'Submitted work waiting on a decision',
    category: 'work',
    icon: ClipboardCheck,
    route: '/workspace/review',
    surfaces: ['more', 'today'],
    requires: { roles: ['coordinator', 'deputy', 'ops', 'admin'] },
    enforcedBy: 'cw_read_scope defines the queue; app.rank_for_town vs app.required_rank decides approval',
  },
  {
    key: 'signal.capture',
    name: 'Capture signal',
    description: 'Log something you noticed in the town',
    category: 'work',
    icon: Signal,
    route: '/submit-signal',
    surfaces: ['universal_action'],
    requires: { town: true },
    enforcedBy: 'uto.signals insert policies',
  },

  // -------------------------------------------------------------- people ---
  {
    key: 'people.view',
    name: 'People',
    description: 'The people you work with',
    category: 'people',
    icon: Users,
    route: '/workspace/people',
    surfaces: ['more'],
    requires: { roles: ['coordinator', 'deputy', 'ops', 'admin'] },
    enforcedBy: 'town_read_coordinators + town_read_roles — app.has_town_scope(town_id)',
  },
  {
    key: 'people.invite',
    name: 'Invite person',
    description: 'Bring someone into an initiative in your town',
    category: 'people',
    icon: UserPlus,
    surfaces: ['universal_action'],
    requires: { roles: ['coordinator', 'deputy', 'ops', 'admin'], town: true },
    enforcedBy: 'PENDING — invitation model is not canonical yet (Gate 3)',
    comingSoon: true,
  },

  // ---------------------------------------------------------- initiative ---
  {
    key: 'initiatives.view',
    name: 'Initiatives',
    description: 'Trader, FrameSouth, KasiBuy and more',
    category: 'initiative',
    icon: Boxes,
    route: '/workspace/initiatives',
    surfaces: ['more'],
    requires: {},
    enforcedBy: 'PENDING — initiative membership is not canonical yet (Gate 4)',
    comingSoon: true,
  },
  {
    key: 'framesouth.assignments',
    name: 'My shoots',
    description: 'FrameSouth assignments and briefs',
    category: 'initiative',
    icon: Camera,
    route: '/workspace/initiatives/framesouth',
    surfaces: ['more'],
    requires: { membership: 'framesouth' },
    enforcedBy: 'PENDING — initiative membership is not canonical yet (Gate 4)',
    comingSoon: true,
  },

  // --------------------------------------------------------------- comms ---
  {
    key: 'inbox.view',
    name: 'Inbox',
    description: 'One inbox for everything that needs a reply',
    category: 'comms',
    icon: Inbox,
    route: '/workspace/inbox',
    surfaces: ['more'],
    requires: {},
    enforcedBy: 'PENDING — canonical inbox model is not built yet (Gate 5)',
    comingSoon: true,
  },
  {
    key: 'town.announce',
    name: 'Send update',
    description: 'Announce something to your town',
    category: 'comms',
    icon: Megaphone,
    surfaces: ['universal_action'],
    requires: { roles: ['coordinator', 'deputy', 'ops', 'admin'], town: true },
    enforcedBy: 'uto.announcements insert policies',
  },

  // -------------------------------------------------------------- growth ---
  {
    key: 'opportunity.view',
    name: 'Opportunities',
    description: 'Work, grants, training and tenders',
    category: 'growth',
    icon: Target,
    route: '/workspace/opportunities',
    surfaces: ['more'],
    requires: {},
    enforcedBy: 'public.opportunities read policies',
    comingSoon: true,
  },
  {
    key: 'passport.view',
    name: 'Ubuntu Passport',
    description: 'Your journey, evidence and next edge',
    category: 'growth',
    icon: IdCard,
    route: '/workspace/passport',
    surfaces: ['more'],
    requires: {},
    enforcedBy: 'PENDING — HumanOS objects are not canonical yet (Gate 6). Consent-gated by design.',
    comingSoon: true,
  },
  {
    key: 'discover.view',
    name: 'Discover',
    description: 'Earn, learn, trade, care, create',
    category: 'growth',
    icon: Compass,
    route: '/workspace/discover',
    surfaces: ['more'],
    requires: {},
    enforcedBy: 'Public surfaces only',
    comingSoon: true,
  },

  // ------------------------------------------------------------------ ops ---
  {
    key: 'kopano.ask',
    name: 'Ask Kopano',
    description: 'What should I focus on today?',
    category: 'ops',
    icon: Sparkles,
    surfaces: ['more'],
    requires: {},
    enforcedBy: 'PENDING — Kopano tools must run scoped to the caller (Gate 7). Read-only first.',
    comingSoon: true,
  },
  {
    key: 'settings.view',
    name: 'Settings',
    description: 'Account, town, theme and privacy',
    category: 'ops',
    icon: Settings,
    route: '/profile',
    surfaces: ['more'],
    requires: {},
    enforcedBy: 'Supabase auth session',
  },
];

export const CAPABILITY_BY_KEY: Record<string, Capability> = Object.fromEntries(
  CAPABILITIES.map(c => [c.key, c]),
);
