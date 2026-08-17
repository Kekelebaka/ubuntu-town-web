'use client';

/**
 * Registers the PWA service worker so Ubuntu Town is installable
 * ("Add to Home Screen" / "Install app"). Registration is best-effort and
 * silent — a failure never blocks the app. Mounted once from the root layout.
 */

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* installability is progressive; ignore failures */
      });
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  return null;
}
