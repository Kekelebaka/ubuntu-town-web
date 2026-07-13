/**
 * Lightweight analytics event tracking for Ubuntu Town.
 *
 * - Pushes events to `window.dataLayer` when available (Plausible / GA compat).
 * - Logs to console in development.
 * - No external dependencies. Fails silently.
 */

/* eslint-disable no-console */

type EventProps = Record<string, string | number | boolean>;

const isDev =
  typeof process !== 'undefined' &&
  process.env?.NODE_ENV === 'development';

/**
 * Track a custom event.
 *
 * @param event  – event name (snake_case recommended)
 * @param props  – arbitrary key/value metadata
 *
 * @example
 * trackEvent('persona_switch', { from: 'investor', to: 'resident', town: 'Bethlehem' })
 */
export function trackEvent(event: string, props: EventProps = {}): void {
  try {
    // Push to dataLayer for GA / Plausible / any tag manager
    if (typeof window !== 'undefined' && Array.isArray((window as any).dataLayer)) {
      (window as any).dataLayer.push({ event, ...props });
    }

    // Dev-mode console log
    if (isDev) {
      console.log(`[analytics] ${event}`, props);
    }
  } catch {
    // Silently swallow – analytics must never break the UI
  }
}

/* ─── Named helpers for common events ─── */

export function trackPersonaSwitch(from: string, to: string, town: string) {
  trackEvent('persona_switch', { from, to, town });
}

export function trackOpportunityView(town: string, title: string) {
  trackEvent('opportunity_view', { town, title });
}

export function trackTownShare(town: string, method: 'native' | 'clipboard') {
  trackEvent('town_share', { town, method });
}

export function trackCoordinatorApply(town: string) {
  trackEvent('coordinator_apply', { town });
}

export function trackCtaClick(section: string, label: string) {
  trackEvent('cta_click', { section, label });
}
