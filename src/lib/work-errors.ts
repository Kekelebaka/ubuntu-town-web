/**
 * Human translation for the Ubuntu Town work/proof database contract.
 *
 * The database is the authority. When it refuses an action it does so for a
 * real reason, and the coordinator on a phone in Senekal should be told what
 * happened in plain language — never a Postgres error code.
 *
 * Two refusals matter for the Work Proof Loop:
 *
 *   42501  row-level security denied the operation. The caller tried to act
 *          outside their town scope, or on work they may not write.
 *
 *   P0001  a trigger raised. The state machine (app.tg_work_guard) rejects
 *          illegal transitions with 'illegal status transition X -> Y', and
 *          rejects approval by a caller of insufficient rank.
 */

type PgLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
} | null | undefined;

export type WorkErrorKind =
  | 'permission'
  | 'stale_state'
  | 'insufficient_rank'
  | 'proof_parent'
  | 'unknown';

export interface FriendlyError {
  kind: WorkErrorKind;
  message: string;
  /** True when the caller should re-read authoritative state before retrying. */
  refresh: boolean;
}

const ILLEGAL_TRANSITION = /illegal status transition\s+(\w+)\s*->\s*(\w+)/i;
const NEEDS_RANK = /needs rank/i;

/**
 * Map a Supabase/Postgres error onto something a human can act on.
 * `context` lets us say "evidence" instead of "row" where that reads better.
 */
export function friendlyWorkError(
  error: PgLikeError,
  context: 'work' | 'proof' | 'transition' = 'work',
): FriendlyError {
  const code = error?.code ?? '';
  const raw = error?.message ?? '';

  // --- Row level security ---------------------------------------------------
  if (code === '42501' || /row-level security/i.test(raw)) {
    if (context === 'proof') {
      return {
        kind: 'proof_parent',
        message:
          "This evidence could not be attached. You can only add evidence to work in a town you coordinate.",
        refresh: false,
      };
    }
    return {
      kind: 'permission',
      message: "You don't have permission to do that in this town.",
      refresh: false,
    };
  }

  // --- Rank: approval attempted above the caller's authority ----------------
  if (NEEDS_RANK.test(raw)) {
    return {
      kind: 'insufficient_rank',
      message:
        'This work needs a higher level of approval than your role allows. It has been left for national review.',
      refresh: true,
    };
  }

  // --- State machine --------------------------------------------------------
  const transition = ILLEGAL_TRANSITION.exec(raw);
  if (transition) {
    return {
      kind: 'stale_state',
      message:
        'This work has changed state and that action is no longer available. Refreshing…',
      refresh: true,
    };
  }

  // --- Anything else --------------------------------------------------------
  return {
    kind: 'unknown',
    message:
      context === 'proof'
        ? 'This evidence could not be attached. Please try again.'
        : 'Something went wrong. Please try again.',
    refresh: false,
  };
}

/**
 * Labels for the real work_status enum.
 *
 * NOTE ON 'approved': app.tg_work_guard() rewrites 'approved' to 'published'
 * inside the same statement, so 'approved' is NOT a durable status — it exists
 * only as an event in history. It is mapped here defensively so that if a
 * response ever surfaces it we render something sane while we re-read
 * authoritative state, but no part of the UI should route on it.
 */
export const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In review',
  published: 'Published',
  rejected: 'Needs changes',
  archived: 'Archived',
  approved: 'Publishing…',
};

export const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  draft: { bg: '#F3F4F6', fg: '#4B5563' },
  submitted: { bg: '#DBEAFE', fg: '#1D4ED8' },
  in_review: { bg: '#FEF3C7', fg: '#B45309' },
  published: { bg: '#A7F3D0', fg: '#065F46' },
  rejected: { bg: '#FEE2E2', fg: '#B91C1C' },
  archived: { bg: '#F3F4F6', fg: '#6B7280' },
  approved: { bg: '#D1FAE5', fg: '#047857' },
};

/** Statuses a reviewer can act on. */
export const REVIEWABLE_STATUSES = ['submitted', 'in_review'] as const;
