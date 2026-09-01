'use client';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Sun, MapPin, Hammer, Sprout, Compass } from 'lucide-react';
import { OfflineState } from './primitives';
export default function Shell({ children, fixture = false, townId }: { children: ReactNode; fixture?: boolean; townId?: string }) {
  const [offline, setOffline] = useState(false);
  useEffect(() => { const update = () => setOffline(!navigator.onLine); update(); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); }; }, []);
  return <div className="living-town"><a className="lt-skip" href="#today-content">Skip to your next move</a><div className="lt-preview">{fixture ? 'Design preview · Example data · No account or live activity' : 'Pre-production · Read-only preview'}</div><header className="lt-header"><img src="/assets/ubuntu-town-mark.svg" width="52" height="52" alt="Ubuntu Town crest" /><div><div className="lt-wordmark">UBUNTU TOWN</div><div className="lt-tagline">BUILD YOUR TOWN. BUILD YOURSELF.</div></div><a className="lt-help" href="#kopano">Kopano</a></header><main id="today-content" className="lt-wrap">{offline && <OfflineState />}{children}</main><nav className="lt-nav" aria-label="Living Town">{[['Today', Sun, ''], ['Town', MapPin, '#town'], ['Do', Hammer, '#do'], ['Grow', Sprout, '#grow'], ['Opportunities', Compass, '#opportunities']].map(([label, Icon, hash]) => { const NavIcon = Icon as typeof Sun; return <a key={String(label)} href={`/living-town${townId ? `?town=${encodeURIComponent(townId)}` : ''}${hash}`}><NavIcon aria-hidden="true" />{String(label)}</a>; })}</nav></div>;
}
