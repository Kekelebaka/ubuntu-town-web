'use client';
import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { trackPersonaSwitch, trackTownShare, trackCtaClick, trackCoordinatorApply, trackOpportunityView } from '@/lib/analytics';
import { getTownPhoto } from '@/data/townPhotos';

/* ─── Types ─── */
interface Town {
  slug: string; name: string; region: string; district?: string;
  status: string; render_pct: number; opportunity_potential?: number;
  heritage?: boolean; coordinator_status?: string; illustrative?: boolean;
  route?: string; province?: string; municipality?: string;
  lat?: number; lng?: number; description?: string;
  hero_image?: string; coordinator_name?: string;
  youth_mapped?: number; active_signals?: number; open_opportunities?: number;
  population_estimate?: number; archetype?: string; cv_count?: number;
  opportunities?: { id: string; title: string; type: string; source: string; deadline_date?: string; metadata?: any }[];
  signals?: { id: string; title: string; category: string; status: string }[];
  stories?: { id: string; title: string; content: string; author_name: string }[];
  businesses?: { id: string; name: string; category: string; is_verified: boolean }[];
  events?: { id: string; title: string; description: string; event_date: string }[];
  access_points?: { id: string; name: string; category: string; is_verified: boolean }[];
  services?: { title: string; description: string; price_range: string; category: string }[];
}
interface Province { slug: string; name: string; towns: Town[]; }
interface Props { town: Town; province: Province | null; lens: string; }

/* ─── CSS (extracted from reference) ─── */
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--cream:#FBF4E6;--cream2:#F6EDDB;--creamhi:#FFF8E7;--paper:#FFFFFF;--ink:#151015;--ink2:#2A2230;--muted:#6E665A;--muted2:#8C8475;--gold:#EEB849;--gold-deep:#B98114;--green:#1A7F37;--green-deep:#13662C;--line:rgba(21,16,21,.10);--line2:#ECE3D2;--r:18px;--rlg:26px;--pill:999px;--sh:0 1px 2px rgba(21,16,21,.04),0 8px 30px rgba(21,16,21,.06);--shlg:0 30px 80px -22px rgba(21,16,21,.28);--display:'Plus Jakarta Sans',system-ui,sans-serif;--body:'Inter',system-ui,sans-serif;--mono:'IBM Plex Mono',monospace}
html{scroll-behavior:smooth}
body{font-family:var(--body);color:var(--ink);background:var(--cream);-webkit-font-smoothing:antialiased;line-height:1.65}
h1,h2,h3,h4{font-family:var(--display);font-weight:800;letter-spacing:-.025em;line-height:1.05;color:var(--ink)}
a{color:inherit}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
.eyebrow{display:inline-flex;align-items:center;gap:.55em;font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-deep);background:rgba(238,184,73,.14);border:1px solid rgba(185,129,20,.25);padding:.45em 1em;border-radius:var(--pill)}
.eyebrow::before{content:"";width:.5em;height:.5em;border-radius:50%;background:var(--gold)}
.btn{display:inline-flex;align-items:center;gap:.5em;font-weight:700;font-family:var(--display);font-size:.92rem;background:linear-gradient(180deg,#F2C45E,#E0A52E);color:#1B1206;border:none;padding:.8em 1.5em;border-radius:var(--pill);text-decoration:none;box-shadow:0 10px 24px -8px rgba(185,129,20,.6);cursor:pointer;transition:transform .15s}
.btn:hover{transform:translateY(-2px)}
.btn-ghost{display:inline-flex;align-items:center;gap:.5em;font-weight:700;font-family:var(--display);font-size:.92rem;background:var(--paper);color:var(--ink);border:1px solid var(--line2);padding:.8em 1.5em;border-radius:var(--pill);text-decoration:none;transition:.15s}
.btn-ghost:hover{border-color:var(--gold);color:var(--gold-deep)}
.card{background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:1.5rem;box-shadow:var(--sh)}
.logo{display:inline-flex;align-items:center;gap:.6em}
.logo .mark{width:40px;height:40px;border-radius:11px;background:var(--creamhi);border:1px solid var(--line2);display:grid;place-items:center;font-size:21px}
.logo .wm{font-family:var(--display);font-weight:800;font-size:1.12rem;line-height:1}
.logo .tg{font-size:.56rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--gold-deep)}
nav.top{position:sticky;top:0;z-index:100;background:rgba(251,244,230,.82);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
nav.top .row{display:flex;align-items:center;gap:20px;height:66px}
.crumb{font-family:var(--mono);font-size:.74rem;color:var(--muted)}.crumb a{text-decoration:none}.crumb a:hover{color:var(--gold-deep)}
.lens{display:inline-flex;gap:3px;background:var(--cream2);border:1px solid var(--line2);border-radius:999px;padding:4px;flex-wrap:wrap}
.lens button{background:none;border:none;color:var(--muted);font-family:var(--body);font-weight:600;font-size:.78rem;padding:.5em .85em;border-radius:999px;cursor:pointer;display:inline-flex;gap:.35em;white-space:nowrap;transition:.2s}
.lens button.on{background:var(--acc);color:#fff}
.hero{padding:42px 0 24px}
.herogrid{display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center}
.hero h1{font-size:clamp(2.8rem,7vw,5rem);line-height:.92;margin:12px 0 6px}
.hero .sub{font-size:clamp(1.05rem,2.2vw,1.3rem);color:var(--muted);max-width:34ch;transition:.25s}
.meter{display:inline-flex;align-items:center;gap:.6em;font-family:var(--mono);font-size:.68rem;padding:.4em .9em;border-radius:999px;border:1px solid}
.meter .d{width:7px;height:7px;border-radius:50%}
.progress{height:6px;background:var(--line2);border-radius:99px;overflow:hidden;margin:16px 0 0;max-width:340px}
.progress i{display:block;height:100%;background:linear-gradient(90deg,var(--gold-deep),var(--gold));border-radius:99px;transition:width .8s}
.heroimg{border-radius:26px;overflow:hidden;box-shadow:var(--shlg);aspect-ratio:4/3;border:1px solid var(--line);position:relative}
.heroimg img{width:100%;height:100%;object-fit:cover;transition:filter .6s}
.heroctas{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}
.lenswrap{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:20px}.lenswrap .lbl{font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.section{padding:72px 0}
.section h2{font-size:clamp(1.7rem,3.4vw,2.5rem);margin:14px 0}
.section .lead{color:var(--muted);max-width:680px;font-size:1.06rem}
.spot{background:var(--paper);border:1px solid var(--line);border-radius:22px;padding:26px;box-shadow:var(--sh)}
.spot .for{font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;color:var(--acc);font-weight:700;margin-bottom:12px;display:block}
.spotgrid{display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:center}
.ring{--p:80;width:118px;height:118px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--acc) calc(var(--p)*1%),var(--line2) 0);flex:none}
.ring span{width:90px;height:90px;border-radius:50%;background:var(--paper);display:grid;place-items:center;flex-direction:column;font-family:var(--display)}
.ring b{font-size:2rem;font-weight:800;color:var(--acc);line-height:1}.ring small{font-size:.54rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.oprow{display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);font-size:.9rem}.oprow .sc{margin-left:auto;font-family:var(--display);font-weight:800;color:var(--acc)}
.bul{list-style:none;display:flex;flex-direction:column;gap:9px}.bul li{font-size:.94rem;color:var(--ink2)}
.minis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.mini{background:var(--cream2);border:1px solid var(--line);border-radius:12px;padding:12px;text-align:center}
.mini .v{font-family:var(--display);font-weight:800;font-size:1.4rem;color:var(--acc)}.mini .l{font-size:.58rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.loopline{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-family:var(--display);font-weight:700;color:var(--muted)}.loopline .a{color:var(--acc)}
.split{display:grid;grid-template-columns:330px 1fr;gap:24px;align-items:start}
.tcwrap{perspective:1500px;width:100%;max-width:330px;height:430px}
.flip{position:relative;width:100%;height:100%;transition:transform .8s cubic-bezier(.2,.7,.2,1);transform-style:preserve-3d;cursor:pointer}
.tcwrap.flipped .flip{transform:rotateY(180deg)}
.face{position:absolute;inset:0;backface-visibility:hidden;border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:var(--sh)}
.fr{display:flex;flex-direction:column;justify-content:flex-end}.fr .img{position:absolute;inset:0;background-size:cover;background-position:center}.fr .sc{position:absolute;inset:0;background:linear-gradient(0deg,rgba(7,5,9,.92),transparent 58%)}
.fr .top{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;padding:15px}
.badge{font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.4em .8em;border-radius:999px;display:inline-flex;align-items:center;gap:.4em}
.fr .c{position:relative;padding:17px;color:var(--creamhi)}.fr .pl{font-family:var(--mono);font-size:.64rem;color:var(--gold)}.fr h3{font-size:1.9rem;margin:2px 0;color:#fff}
.fr .st{display:flex;gap:16px;margin-top:11px}.fr .st .v{font-family:var(--display);font-weight:800;font-size:1.15rem;color:var(--gold)}.fr .st .l{font-size:.54rem;text-transform:uppercase;color:#d8c9ac;letter-spacing:.06em}
.bk{transform:rotateY(180deg);background:var(--paper);padding:20px;display:flex;flex-direction:column}
.bk h4{color:var(--gold-deep);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px}
#tmap{height:430px;border-radius:18px;overflow:hidden;border:1px solid var(--line)}
.leaflet-container{background:#eee;font-family:var(--body)}
.rail{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.rl{display:flex;flex-direction:column;gap:5px;background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:15px;text-decoration:none;box-shadow:var(--sh);transition:.2s}
.rl.live:hover{border-color:var(--acc);transform:translateY(-3px)}
.rl.ready{opacity:.92}.rl.locked{opacity:.5}
.rl .e{font-size:1.4rem}.rl .t{font-weight:700;font-size:.88rem}.rl .s{font-size:.6rem;font-family:var(--mono);text-transform:uppercase;letter-spacing:.04em}
.rl .s.live{color:var(--green-deep)}.rl .s.ready{color:var(--gold-deep)}.rl .s.locked{color:var(--muted)}
.dir{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-height:420px;overflow-y:auto}
.di{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:11px 13px}.di b{font-size:.86rem}.di span{display:block;font-size:.72rem;color:var(--muted);margin-top:2px}
.share{background:var(--paper);border:1px solid var(--line2);color:var(--ink);border-radius:999px;padding:.6em 1.1em;font-weight:600;font-size:.8rem;cursor:pointer;font-family:var(--body)}
footer.site{background:var(--ink);color:var(--cream);padding:54px 0 30px}
footer.site a{color:var(--gold)}
footer.site .muted{color:#A99C84;font-size:.8rem;line-height:1.7}
@media(max-width:820px){.herogrid,.spotgrid,.split{grid-template-columns:1fr}.rail{grid-template-columns:1fr 1fr}.dir{grid-template-columns:1fr 1fr}.tcwrap{margin:0 auto}}
@media(max-width:860px){.rail{grid-template-columns:1fr 1fr}.section{padding:52px 0}}
.ecogrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.ecocard{background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:1.25rem 1.4rem;display:flex;flex-direction:column;gap:8px;box-shadow:var(--sh);transition:transform .18s,border-color .18s}
.ecocard:hover{transform:translateY(-3px);border-color:var(--acc)}
.ecocard .ei{font-size:1.6rem}
.ecocard .en{font-family:var(--display);font-weight:800;font-size:1rem}
.ecocard .ed{font-size:.82rem;color:var(--muted);line-height:1.5}
.ecocard .eb{margin-top:auto;padding-top:6px}
.ecocard .eb button{background:none;border:1px solid var(--acc);color:var(--acc);font-family:var(--display);font-weight:700;font-size:.82rem;padding:.55em 1.1em;border-radius:var(--pill);cursor:pointer;transition:.15s}
.ecocard .eb button:hover{background:var(--acc);color:#fff}
.proofgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-top:18px}
.proofitem{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px;text-align:center}
.proofitem .pv{font-family:var(--display);font-weight:800;font-size:1.8rem;color:var(--acc);line-height:1}
.proofitem .pl{font-size:.62rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-top:4px}
`;

/* ─── Helpers ─── */
function hue(s: string) { let h = 17; for (const c of s) h = (h * 29 + c.charCodeAt(0)) % 360; return h; }
function sig(n: string) { return n.replace(/[^A-Za-z ]/g, '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function skin(name: string, status: string) {
  const h = hue(name);
  return status === 'live'
    ? `linear-gradient(160deg,hsl(${h},45%,32%),hsl(${(h+30)%360},55%,18%))`
    : `linear-gradient(160deg,hsl(${h},55%,80%),hsl(${(h+30)%360},50%,68%))`;
}
const LENS: Record<string, { label: string; emoji: string; acc: string; line: string; spotTitle: string; spotDesc: string; ctaLabel: string }> = {
  investor:    { label: 'Investor',    emoji: '📈', acc: '#B98114', line: 'Where capital meets momentum.',        spotTitle: 'Funded opportunities',  spotDesc: 'Opportunities scored and ready for investment.', ctaLabel: 'View opportunities ↓' },
  visitor:     { label: 'Visitor',     emoji: '🧭', acc: '#9A3FB0', line: 'Discover heritage and landscapes.',    spotTitle: 'Heritage & nature',     spotDesc: 'Routes, landmarks and natural beauty.',          ctaLabel: 'Explore tourism ↓' },
  resident:    { label: 'Resident',    emoji: '🏠', acc: '#13662C', line: 'Your town, in your hands.',             spotTitle: 'Local services',        spotDesc: 'Schools, clinics, shops and community.',         ctaLabel: 'See your services ↓' },
  funder:      { label: 'Funder',      emoji: '🤝', acc: '#2C7E8C', line: 'Fund proof, not promises.',             spotTitle: 'Fundable projects',     spotDesc: 'Verified needs with impact scores.',             ctaLabel: 'View projects ↓' },
  coordinator: { label: 'Coordinator', emoji: '🛠️', acc: '#B5641E', line: 'Claim this town. Run the loop.',       spotTitle: 'Run the loop',          spotDesc: 'Signal → Workpack → Proof → Memory → Action.',   ctaLabel: 'Apply to coordinate →' },
};
const MODULES = [
  { key: 'map',          emoji: '🗺️',  title: 'GIS Map',       gate: '≥40 points across ≥4 layers' },
  { key: 'dashboard',    emoji: '📊',  title: 'Dashboard',     gate: 'Demographics + economy' },
  { key: 'prospectus',   emoji: '📋',  title: 'Prospectus',    gate: '≥6 scored opportunities' },
  { key: 'intel',        emoji: '🔬',  title: 'Intelligence',  gate: 'All core stats + sources' },
  { key: 'tourism',      emoji: '🧭',  title: 'Tourism',       gate: '≥2 attractions' },
  { key: 'factsheet',    emoji: '📄',  title: 'Factsheet',     gate: 'Data present' },
  { key: 'deck',         emoji: '🎯',  title: 'Deck',          gate: 'Prospectus + Dashboard' },
  { key: 'workspace',    emoji: '🛠️',  title: 'Workspace',     gate: 'Coordinator assigned' },
];

const ECOSYSTEM_PRODUCTS: { key: string; icon: string; name: string; desc: string }[] = [
  { key: 'fixeasy24',      icon: '🔧', name: 'FixEasy24',      desc: 'Get verified as a service provider — plumber, electrician, handyman' },
  { key: 'kasibuy',        icon: '🛒', name: 'KasiBuy',        desc: 'List your spaza or shop on the local marketplace' },
  { key: 'framesouth',     icon: '📷', name: 'FrameSouth',     desc: "Become the town's photographer — document, prove, earn" },
  { key: 'aicafe',         icon: '💻', name: 'AI Café',        desc: 'Partner to bring AI and internet access to your community' },
  { key: 'ubuntuacademy',  icon: '📚', name: 'Ubuntu Academy', desc: 'Free CV and job readiness workshops' },
  { key: 'orbitmusic',     icon: '🎵', name: 'Orbit Music',    desc: 'Create music with AI — workshops and tools' },
  { key: 'insidetown',     icon: '🎙️', name: 'Inside.Town',    desc: "Host a podcast — tell your town's story" },
  { key: 'familyhouse',    icon: '🏠', name: 'FamilyHouse',    desc: 'Host visitors in your home — earn from hospitality' },
  { key: 'ecochar',        icon: '🌿', name: 'EcoChar',        desc: '5-day charcoal production training — green economy skills' },
  { key: 'buntubar',       icon: '🍺', name: 'BuntuBar',       desc: 'Mobile bar and beverage workshop — events economy' },
];

function getModuleStatus(town: Town, key: string): 'live' | 'ready' | 'locked' {
  if (key === 'workspace') return town.coordinator_status === 'assigned' ? 'live' : 'locked';
  if (key === 'dashboard') return town.render_pct >= 15 ? 'ready' : 'locked';
  if (key === 'factsheet') return town.render_pct >= 10 ? 'ready' : 'locked';
  if (key === 'directory' || key === 'map') return town.render_pct >= 20 ? 'ready' : 'locked';
  if (key === 'prospectus') return town.render_pct >= 30 ? 'ready' : 'locked';
  if (key === 'tourism') return town.heritage ? 'ready' : 'locked';
  if (key === 'intel') return town.render_pct >= 25 ? 'ready' : 'locked';
  if (key === 'deck') return town.render_pct >= 35 ? 'ready' : 'locked';
  return 'locked';
}

/* ─── Component ─── */
export default function TownClient({ town, province, lens: initialLens }: Props) {
  const [persona, setPersona] = useState(initialLens || 'investor');
  const [flipped, setFlipped] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const p = LENS[persona] || LENS.investor;
  const renderPct = town.render_pct || 0;
  const statusColor = town.status === 'live' ? 'var(--green-deep)' : town.status === 'building' ? 'var(--gold-deep)' : 'var(--muted)';
  const statusBg = town.status === 'live' ? 'rgba(26,127,55,.12)' : town.status === 'building' ? 'rgba(238,184,73,.14)' : 'var(--cream2)';
  const statusLabel = town.status === 'live' ? '● Live' : town.status === 'building' ? '◐ Building' : '○ Unclaimed';
  const heroSkin = skin(town.name, town.status);

  /* Leaflet map — uses real GPS coordinates from enriched data */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const L = (window as any).L;
    if (!L) { setMapReady(false); return; }
    const lat = town.lat || -29.0;
    const lng = town.lng || 27.5;
    const zoom = (town.population_estimate || 0) > 500000 ? 11 : (town.population_estimate || 0) > 50000 ? 12 : 13;
    const map = L.map('tmap', { scrollWheelZoom: false }).setView([lat, lng], zoom);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19 }).addTo(map);
    const pin = L.circleMarker([lat, lng], { radius: 8, fillColor: p.acc, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85 }).addTo(map);
    pin.bindPopup(`<b>${town.name}</b><br>${town.region || town.archetype || ''}`);
    setMapReady(true);
    return () => { map.remove(); }
  }, [persona, town.slug, town.lat, town.lng]);

  /* Use real opportunity count from town data */
  const realOppCount = town.open_opportunities || 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <style dangerouslySetInnerHTML={{ __html: `:root{--acc:${p.acc}}` }} />

      {/* NAV */}
      <nav className="top"><div className="wrap row">
        <div className="logo"><div className="mark">🏘️</div><div><div className="wm">Ubuntu Town</div><div className="tg">Abantu Bo Buntu</div></div></div>
        <span className="crumb" style={{ marginLeft: 8 }}>
          <a href={province ? `/province/${province.slug}` : '/enter'}>{province?.name || 'Ubuntu Town'}</a> › <b>{town.name}</b>
        </span>
        <div className="lens" style={{ marginLeft: 'auto' }}>
          {Object.entries(LENS).map(([k, v]) => (
            <button key={k} className={persona === k ? 'on' : ''} onClick={() => { trackPersonaSwitch(persona, k, town.name); setPersona(k); }}>{v.emoji} {v.label}</button>
          ))}
        </div>
      </div></nav>

      {/* HERO */}
      <header className="hero"><div className="wrap"><div className="herogrid">
        <div>
          <span className="meter" style={{ borderColor: statusColor, color: statusColor, background: statusBg }}>
            <span className="d" style={{ background: statusColor }}></span>
            <span>{town.status === 'building' ? `rendering · ${renderPct}%` : town.status}</span>
          </span>
          <div className="progress"><i style={{ width: `${renderPct}%` }}></i></div>
          <div style={{ marginTop: 14 }}><span className="eyebrow">{town.district || town.region || 'Ubuntu Town'}</span></div>
          <h1>{town.name}</h1>
          <p className="sub">{town.description || p.line}</p>
          <div className="heroctas">
            <a className="btn" href="#spot" onClick={() => trackCtaClick('hero', p.ctaLabel)}>{p.ctaLabel}</a>
            <a className="btn-ghost" href="#tmap" onClick={() => trackCtaClick('hero', 'View on the map')}>View on the map ↓</a>
          </div>
          <div className="lenswrap"><span className="lbl">Viewing as</span>
            <div className="lens">
              {Object.entries(LENS).map(([k, v]) => (
                <button key={k} className={persona === k ? 'on' : ''} onClick={() => { trackPersonaSwitch(persona, k, town.name); setPersona(k); }}>{v.emoji} {v.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="heroimg">
          {(() => { const photo = getTownPhoto(town.slug); return photo.url ? (
            <img src={photo.url} alt={`${town.name} — ${photo.query}`} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          ) : null; })()}
          <div style={{ width: '100%', height: '100%', background: heroSkin, position: 'absolute', inset: 0, opacity: 0.15 }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: '4rem', opacity: 0.18, color: town.status === 'live' ? '#fff' : 'var(--ink)' }}>{sig(town.name)}</span>
          </div>
        </div>
      </div></div></header>

      <div className="wrap">
        {/* PROOF DASHBOARD */}
        <ErrorBoundary section="Proof Dashboard">
        <section className="section" style={{ paddingTop: 32, paddingBottom: 16 }}>
          <span className="eyebrow">Proof</span>
          <h2 style={{ fontSize: 1.4, margin: '10px 0' }}>What&apos;s been built in {town.name}</h2>
          <div className="proofgrid">
            <div className="proofitem">
              <div className="pv">{town.active_signals || 0}</div>
              <div className="pl">Signals logged</div>
            </div>
            <div className="proofitem">
              <div className="pv">{town.businesses?.length || 0}</div>
              <div className="pl">Businesses mapped</div>
            </div>
            <div className="proofitem">
              <div className="pv">{town.cv_count || 0}</div>
              <div className="pl">Youth CVs</div>
            </div>
            <div className="proofitem">
              <div className="pv">{town.coordinator_status === 'assigned' ? '✓' : '—'}</div>
              <div className="pl">{town.coordinator_name || 'Coordinator'}</div>
            </div>
            <div className="proofitem">
              <div className="pv">{renderPct}%</div>
              <div className="pl">Rendered</div>
            </div>
            <div className="proofitem">
              <div className="pv">{town.open_opportunities || 0}</div>
              <div className="pl">Ecosystem opps</div>
            </div>
          </div>
        </section>
        </ErrorBoundary>

        {/* SPOTLIGHT */}
        <ErrorBoundary section="Spotlight">
        <section className="section" style={{ paddingTop: 16 }}>
          <div className="spot" id="spot">
            <span className="for">{p.emoji} For {persona === 'coordinator' ? 'coordinators' : persona + 's'}</span>
            <div className="spotgrid">
              <div>
                {persona === 'investor' || persona === 'funder' ? (
                  <>
                    <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div className="ring" style={{ '--p': town.opportunity_potential || 40 } as any}>
                        <span><b>{town.opportunity_potential || 40}</b><small>Opportunity index</small></span>
                      </div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 1.3 }}>Ecosystem investment</div>
                        <p style={{ color: 'var(--muted)', margin: '6px 0', fontSize: 0.88 }}>
                          {ECOSYSTEM_PRODUCTS.length} products live — FixEasy24, KasiBuy, FrameSouth and more are generating economic activity in {town.name}.
                        </p>
                        {town.coordinator_status === 'assigned' && <span className="tag" style={{ marginTop: 8 }}>Coordinator active</span>}
                      </div>
                    </div>
                  </>
                ) : persona === 'visitor' ? (
                  <>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 1.3 }}>Discover {town.name}</div>
                    <p style={{ color: 'var(--muted)', margin: '6px 0 12px', fontSize: 0.88 }}>
                      FamilyHouse hosts visitors, Inside.Town podcasts tell local stories, FrameSouth captures the landscape.
                    </p>
                    {town.heritage && <span className="tag">Heritage town</span>}
                  </>
                ) : persona === 'resident' ? (
                  <>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 1.3 }}>Your town, your ecosystem</div>
                    <p style={{ color: 'var(--muted)', margin: '6px 0 12px', fontSize: 0.88 }}>
                      FixEasy24 for services, KasiBuy for your shop, Ubuntu Academy for job readiness — all available in {town.name}.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="loopline" style={{ margin: '12px 0', fontSize: '1rem', color: 'var(--ink)' }}>
                      Signal<span className="a">→</span>Workpack<span className="a">→</span>Proof<span className="a">→</span>Memory<span className="a">→</span>Action
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: 0.88 }}>Run the loop to render this town. Coordinate ecosystem products to build proof.</p>
                  </>
                )}
              </div>
              <div>
                <div className="minis">
                  <div className="mini"><div className="v">{renderPct}%</div><div className="l">Rendered</div></div>
                  <div className="mini"><div className="v">{town.opportunity_potential || 0}</div><div className="l">Index</div></div>
                  <div className="mini"><div className="v">{realOppCount}</div><div className="l">Opps</div></div>
                  <div className="mini"><div className="v">{town.coordinator_status === 'assigned' ? (town.coordinator_name || '✓') : '—'}</div><div className="l">Coordinator</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        </ErrorBoundary>

        {/* TOWN CARD + MAP */}
          <ErrorBoundary section="Town Card">
          <section className="section" style={{ paddingTop: 8 }}>
            <div className="split">
              <div>
                <span className="eyebrow">Shareable</span>
                <h2 style={{ fontSize: 1.4, margin: '10px 0' }}>The Town Card</h2>
                <p style={{ color: 'var(--muted)', fontSize: 0.86, marginBottom: 14 }}>Tap to flip — the atomic unit for Telegram &amp; WhatsApp.</p>
                <div className={`tcwrap ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
                  <div className="flip">
                    {/* FRONT */}
                    <div className="face fr">
                      <div className="img" style={{ background: heroSkin }}></div>
                      <div className="sc"></div>
                      <div className="top">
                        <span className="badge" style={{
                          background: town.status === 'live' ? 'rgba(26,127,55,.9)' : town.status === 'building' ? 'rgba(238,184,73,.95)' : 'rgba(255,255,255,.85)',
                          color: town.status === 'ghost' ? 'var(--muted)' : '#fff'
                        }}>{statusLabel}</span>
                      </div>
                      <div className="c">
                        <div className="pl">{town.district || town.region || 'South Africa'}</div>
                        <h3>{town.name}</h3>
                        <div className="st">
                          <div><div className="v">{town.render_pct || 0}%</div><div className="l">Rendered</div></div>
                          <div><div className="v">{town.opportunity_potential || 0}</div><div className="l">Index</div></div>
                          <div><div className="v">{realOppCount}</div><div className="l">Opps</div></div>
                        </div>
                      </div>
                    </div>
                    {/* BACK */}
                    <div className="face bk">
                      <h4>Ecosystem Products</h4>
                      {ECOSYSTEM_PRODUCTS.slice(0, 5).map((prod) => (
                        <div key={prod.key} className="oprow">
                          <span>{prod.icon} {prod.name}</span>
                          <span className="sc">→</span>
                        </div>
                      ))}
                      <div className="oprow"><span style={{ color: 'var(--muted)', fontSize: '.78rem' }}>+{ECOSYSTEM_PRODUCTS.length - 5} more products</span><span className="sc">…</span></div>
                      <div className="loopline" style={{ margin: '12px 0', fontSize: 0.66 }}>
                        Signal<span className="a">→</span>Workpack<span className="a">→</span>Proof<span className="a">→</span>Memory<span className="a">→</span>Action
                      </div>
                      <div style={{ fontSize: 0.78, color: 'var(--muted)' }}>
                        {town.coordinator_status === 'assigned'
                          ? 'Coordinator active — twin is building.'
                          : 'Claim this town to start rendering.'}
                      </div>
                    </div>
                  </div>
                </div>
                <button className="share" style={{ marginTop: 14 }} onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: `${town.name} — Ubuntu Town`, url: window.location.href });
                    trackTownShare(town.name, 'native');
                  } else {
                    navigator.clipboard?.writeText(window.location.href);
                    trackTownShare(town.name, 'clipboard');
                  }
                }}>↗ Share this town</button>
              </div>
              <div>
                <span className="eyebrow">Live GIS</span>
                <h2 id="mapTitle" style={{ fontSize: 1.4, margin: '10px 0' }}>{town.name} — mapped</h2>
                <div id="tmap"></div>
                <p style={{ color: 'var(--muted)', fontSize: 0.78, marginTop: 10 }}>
                  {town.illustrative
                    ? 'Illustrative network state — real locations will appear once a coordinator claims this town.'
                    : `Locations sourced from public data. Render ${renderPct}% — ${town.coordinator_status === 'assigned' ? 'coordinator active' : 'coordinator recruiting'}.`}
                </p>
              </div>
            </div>
          </section>
          </ErrorBoundary>

        {/* DIRECTORY — real businesses from Supabase */}
        {(town.businesses && town.businesses.length > 0) && (
                  <ErrorBoundary section="Directory">
<section className="section" style={{ paddingTop: 8 }}>
            <span className="eyebrow">Business ecosystem</span>
            <h2 style={{ fontSize: 1.4, margin: '10px 0' }}>The directory</h2>
            <div className="dir">
              {town.businesses.map((b) => (
                <div key={b.id} className="di">
                  <b>{b.name}</b>
                  <span>{b.category}{b.is_verified ? ' · ✓ verified' : ' · pending'}</span>
                </div>
              ))}
            </div>
          </section>
        </ErrorBoundary>
        )}

        {/* THE ECOSYSTEM */}
        <ErrorBoundary section="Ecosystem">
        <section className="section" style={{ paddingTop: 8 }}>
          <span className="eyebrow">The Ecosystem</span>
          <h2 style={{ fontSize: 1.4, margin: '10px 0' }}>Ubuntu Town products in {town.name}</h2>
          <p style={{ color: 'var(--muted)', fontSize: 0.92, marginBottom: 18, maxWidth: 600 }}>
            Every town in the Ubuntu Town network has access to these ecosystem products. Claim an opportunity to get started.
          </p>
          <div className="ecogrid">
            {ECOSYSTEM_PRODUCTS.map((prod) => {
              const townOpp = town.opportunities?.find(
                (o) => o.metadata?.ecosystem === prod.key || o.source === prod.name || o.title?.toLowerCase().includes(prod.key)
              );
              return (
                <div key={prod.key} className="ecocard">
                  <div className="ei">{prod.icon}</div>
                  <div className="en">{prod.name}</div>
                  <div className="ed">{prod.desc}</div>
                  <div className="eb">
                    <button onClick={() => trackOpportunityView(town.name, prod.name)}>
                      {townOpp ? 'Claim this opportunity →' : 'Learn more →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        </ErrorBoundary>

        {/* STORIES — community voices */}
        {(town.stories && town.stories.length > 0) && (
                  <ErrorBoundary section="Stories">
<section className="section" style={{ paddingTop: 8 }}>
            <span className="eyebrow">Community voices</span>
            <h2 style={{ fontSize: 1.4, margin: '10px 0' }}>Stories from {town.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {town.stories.map((st) => (
                <div key={st.id} className="card" style={{ borderLeft: '3px solid var(--gold)' }}>
                  <div style={{ fontWeight: 700, fontSize: '.92rem', fontFamily: 'var(--display)' }}>{st.title}</div>
                  <p style={{ color: 'var(--muted)', fontSize: '.84rem', margin: '8px 0', lineHeight: 1.6 }}>{st.content}</p>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted2)', fontStyle: 'italic' }}>— {st.author_name}</div>
                </div>
              ))}
            </div>
          </section>
        </ErrorBoundary>
        )}

        {/* EVENTS — upcoming */}
        {(town.events && town.events.length > 0) && (
                  <ErrorBoundary section="Events">
<section className="section" style={{ paddingTop: 8 }}>
            <span className="eyebrow">Events</span>
            <h2 style={{ fontSize: 1.4, margin: '10px 0' }}>Upcoming in {town.name}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {town.events.map((ev) => (
                <div key={ev.id} className="card" style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '12px 18px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: 'var(--gold-deep)', minWidth: 90, textAlign: 'center' }}>
                    {ev.event_date}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.92rem' }}>{ev.title}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{ev.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ErrorBoundary>
        )}

        {/* SIGNALS — community signals */}
        {(town.signals && town.signals.length > 0) && (
                  <ErrorBoundary section="Signals">
<section className="section" style={{ paddingTop: 8 }}>
            <span className="eyebrow">Signals</span>
            <h2 style={{ fontSize: 1.4, margin: '10px 0' }}>Community signals</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {town.signals.map((sig) => (
                <div key={sig.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{sig.title}</span>
                    <span style={{ marginLeft: 8, fontSize: '.72rem', color: 'var(--muted2)', background: 'var(--cream2)', padding: '2px 8px', borderRadius: 999 }}>{sig.category}</span>
                  </div>
                  <span style={{ fontSize: '.72rem', fontFamily: 'var(--mono)', color: sig.status === 'resolved' ? 'var(--green)' : 'var(--gold-deep)' }}>
                    {sig.status === 'resolved' ? '✓ resolved' : '⏳ pending'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </ErrorBoundary>
        )}

        {/* ACCESS POINTS — resident lens */}
        {(town.access_points && town.access_points.length > 0) && persona === 'resident' && (
                  <ErrorBoundary section="Access Points">
<section className="section" style={{ paddingTop: 8 }}>
            <span className="eyebrow">Access points</span>
            <h2 style={{ fontSize: 1.4, margin: '10px 0' }}>Community access</h2>
            <div className="dir">
              {town.access_points.map((ap) => (
                <div key={ap.id} className="di">
                  <b>{ap.name}</b>
                  <span>{ap.category.replace(/_/g, ' ')}{ap.is_verified ? ' · ✓' : ''}</span>
                </div>
              ))}
            </div>
          </section>
        </ErrorBoundary>
        )}

        {/* SERVICES — resident lens */}
        {(town.services && town.services.length > 0) && persona === 'resident' && (
                  <ErrorBoundary section="Services">
<section className="section" style={{ paddingTop: 8 }}>
            <span className="eyebrow">Services</span>
            <h2 style={{ fontSize: 1.4, margin: '10px 0' }}>Local services in {town.name}</h2>
            <div className="dir">
              {town.services.map((sv, i) => (
                <div key={i} className="di" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <b>{sv.title}</b>
                    <span style={{ fontSize: '.72rem', color: 'var(--gold-deep)', fontFamily: 'var(--mono)' }}>{sv.price_range}</span>
                  </div>
                  <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{sv.description}</span>
                </div>
              ))}
            </div>
          </section>
        </ErrorBoundary>
        )}

        {/* CV PROFILES — resident lens */}
        {(town.cv_count && town.cv_count > 0) && persona === 'resident' && (
                  <ErrorBoundary section="CV Profiles">
<section className="section" style={{ paddingTop: 8 }}>
            <span className="eyebrow">Youth CVs</span>
            <h2 style={{ fontSize: 1.4, margin: '10px 0' }}>Youth in {town.name}</h2>
            <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '18px 24px' }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: '2.5rem', color: 'var(--gold-deep)', lineHeight: 1 }}>
                {town.cv_count}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>youth have created CVs</div>
                <div style={{ color: 'var(--muted)', fontSize: '.84rem', marginTop: 4 }}>
                  Through Ubuntu Town&apos;s CV engine — ready for opportunities.
                </div>
                <a href="/cv" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: '.82rem', color: 'var(--gold-deep)', fontWeight: 700, textDecoration: 'none' }}>
                  Create yours →
                </a>
              </div>
            </div>
          </section>
        </ErrorBoundary>
        )}

        {/* MODULES */}
        <ErrorBoundary section="Modules">
        <section className="section" style={{ paddingTop: 8 }}>
          <span className="eyebrow">The twin</span>
          <h2 style={{ fontSize: 1.5, margin: '10px 0' }}>Modules &amp; render state</h2>
          <p style={{ color: 'var(--muted)', fontSize: 0.88, marginBottom: 14 }}>
            Modules light up as the coordinator banks proof.{' '}
            <b style={{ color: 'var(--green-deep)' }}>Live</b> = published ·{' '}
            <b style={{ color: 'var(--gold-deep)' }}>Ready</b> = data present ·{' '}
            <b style={{ color: 'var(--muted)' }}>Locked</b> = gate not met.
          </p>
          <div className="rail">
            {MODULES.map(m => {
              const st = getModuleStatus(town, m.key);
              return (
                <div key={m.key} className={`rl ${st}`}>
                  <div className="e">{m.emoji}</div>
                  <div className="t">{m.title}</div>
                  <div className={`s ${st}`}>{st === 'live' ? '● LIVE' : st === 'ready' ? '◐ READY' : '○ LOCKED'}</div>
                </div>
              );
            })}
          </div>
        </section>
        </ErrorBoundary>

        {/* THE MODEL */}
        <section className="section" style={{ textAlign: 'center', paddingTop: 8 }}>
          <span className="eyebrow">The model</span>
          <h2 style={{ margin: 12, fontSize: 1.5 }}>Signals become memory. Memory drives action.</h2>
          <div className="loopline" style={{ justifyContent: 'center', fontSize: '1.05rem', color: 'var(--ink)' }}>
            Signal<span className="a">→</span>Workpack<span className="a">→</span>Proof<span className="a">→</span>Memory<span className="a">→</span>Action
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="site"><div className="wrap">
        <div className="logo"><div className="mark">🏘️</div><div><div className="wm" style={{ color: 'var(--creamhi)' }}>Ubuntu Town</div><div className="tg">Abantu Bo Buntu</div></div></div>
        <p className="muted" style={{ marginTop: 12, maxWidth: 660 }}>
          {town.illustrative
            ? `${town.name} — illustrative network state. Light CI · enter.ubuntutown.co.za`
            : `${town.name} — render ${renderPct}%. ${town.coordinator_status === 'assigned' ? 'Coordinator active.' : 'Coordinator recruiting.'} ${town.district ? town.district + '.' : ''} Light CI · enter.ubuntutown.co.za`}
        </p>
      </div></footer>
    </>
  );
}
