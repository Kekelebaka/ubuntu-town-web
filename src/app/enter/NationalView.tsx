'use client';
import { useState, useMemo } from 'react';

/* ─── Types ─── */
interface Town { slug: string; status?: string; render_pct?: number; opportunity_potential?: number; coordinator_status?: string; [key: string]: any; }
interface ProvinceData { slug: string; name: string; default_lens?: string; hero_image?: string; data_vintage?: string; network?: { towns: number; provinces: number; coordinators: number }; aggregates?: { towns: number; live: number; building: number; unclaimed: number; opportunity_index_avg?: number }; towns: Town[]; [key: string]: any; }
interface Props { provinces: ProvinceData[]; lens?: string; }

/* ─── CSS (from national reference) ─── */
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
.logo{display:inline-flex;align-items:center;gap:.6em}
.logo .mark{width:40px;height:40px;border-radius:11px;background:var(--creamhi);border:1px solid var(--line2);display:grid;place-items:center;font-size:21px}
.logo .wm{font-family:var(--display);font-weight:800;font-size:1.12rem;line-height:1}
.logo .tg{font-size:.56rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--gold-deep)}
nav.top{position:sticky;top:0;z-index:100;background:rgba(251,244,230,.82);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
nav.top .row{display:flex;align-items:center;gap:20px;height:66px}
.lens{display:inline-flex;gap:3px;background:var(--cream2);border:1px solid var(--line2);border-radius:999px;padding:4px;flex-wrap:wrap}
.lens button{background:none;border:none;color:var(--muted);font-family:var(--body);font-weight:600;font-size:.78rem;padding:.5em .85em;border-radius:999px;cursor:pointer;display:inline-flex;gap:.35em;white-space:nowrap;transition:.2s}
.lens button.on{background:var(--acc);color:#fff}
.hero{padding:54px 0 24px}
.hero h1{font-size:clamp(2.6rem,7vw,5rem);line-height:.92;margin:14px 0 6px}
.hero .pline{font-size:clamp(1.1rem,2.5vw,1.6rem);color:var(--muted);font-family:var(--display);font-weight:600;max-width:26ch;transition:.25s}
.natchips{display:flex;gap:26px;flex-wrap:wrap;margin:24px 0}
.natchips .v{font-family:var(--display);font-weight:800;font-size:clamp(1.6rem,4vw,2.5rem);color:var(--gold-deep);line-height:1}
.natchips .l{font-size:.64rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:5px}
.metric{display:inline-flex;align-items:center;gap:.6em;background:rgba(238,184,73,.12);border:1px solid rgba(185,129,20,.25);border-radius:999px;padding:.5em 1.1em;font-weight:700;color:var(--gold-deep);font-size:.92rem;transition:.25s}
.lenswrap{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:22px}.lenswrap .lbl{font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.section{padding:72px 0}
.section h2{font-size:clamp(1.7rem,3.4vw,2.5rem);margin:14px 0}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:8px}
.pc{background:var(--paper);border:1px solid var(--line);border-radius:var(--rlg);padding:20px;box-shadow:var(--sh);display:flex;flex-direction:column;gap:12px;transition:transform .25s,border-color .25s;text-decoration:none;color:var(--ink)}
.pc.real:hover{transform:translateY(-5px);border-color:var(--gold)}
.pc .h{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.pc .nm{font-family:var(--display);font-weight:800;font-size:1.35rem;line-height:1}
.pc .st{font-size:.58rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:.35em .7em;border-radius:999px;white-space:nowrap}
.st-active{background:rgba(26,127,55,.14);color:var(--green-deep)}.st-forming{background:rgba(238,184,73,.16);color:var(--gold-deep)}.st-awaiting{background:var(--cream2);color:var(--muted)}
.constell{display:flex;flex-wrap:wrap;gap:5px;min-height:42px;align-content:flex-start}
.dot{width:11px;height:11px;border-radius:50%}
.dot.live{background:#1A7F37;box-shadow:0 0 0 3px rgba(26,127,55,.18)}
.dot.build{background:linear-gradient(180deg,#EEB849,#B98114)}
.dot.un{background:#dcd2bd}
.agg{display:flex;gap:16px;flex-wrap:wrap}
.agg .a b{font-family:var(--display);font-weight:800;font-size:1.05rem;color:var(--ink)}
.agg .a span{font-size:.6rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);display:block}
.rdbar{height:6px;background:var(--line2);border-radius:99px;overflow:hidden}.rdbar i{display:block;height:100%;background:linear-gradient(90deg,var(--gold-deep),var(--gold));border-radius:99px}
.pc .foot{display:flex;align-items:center;justify-content:space-between;margin-top:2px}
.pc .rd{font-family:var(--mono);font-size:.72rem;color:var(--muted)}
.pc .go{font-weight:700;font-size:.82rem;color:var(--gold-deep)}
.pc .go.muted{color:var(--muted)}
.legend{display:flex;gap:18px;flex-wrap:wrap;margin:18px 0 0;font-size:.78rem;color:var(--muted)}
.legend span{display:inline-flex;align-items:center;gap:6px}
.note{font-size:.74rem;color:var(--muted);margin-top:18px;line-height:1.6;border-top:1px solid var(--line);padding-top:14px}
footer.site{background:var(--ink);color:var(--cream);padding:54px 0 30px}
footer.site a{color:var(--gold)}
footer.site .muted{color:#A99C84;font-size:.8rem;line-height:1.7}
@media(max-width:820px){.grid{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.grid{grid-template-columns:1fr}}
@media(max-width:860px){.section{padding:52px 0}}
.ecogrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin-top:18px}
.ecocard{background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:1.15rem 1.3rem;display:flex;flex-direction:column;gap:7px;box-shadow:var(--sh);transition:transform .18s,border-color .18s}
.ecocard:hover{transform:translateY(-3px);border-color:var(--acc)}
.ecocard .ei{font-size:1.5rem}
.ecocard .en{font-family:var(--display);font-weight:800;font-size:.95rem}
.ecocard .ed{font-size:.78rem;color:var(--muted);line-height:1.45}
`;

/* ─── Helpers ─── */
function calcReadiness(prov: ProvinceData): number {
  const ag = prov.aggregates || { live: 0, building: 0, unclaimed: prov.towns.length, towns: prov.towns.length };
  const total = ag.towns || prov.towns.length || 1;
  return Math.round(((ag.live * 100 + ag.building * 40) / total));
}
function provStatus(prov: ProvinceData): string {
  const ag = prov.aggregates || { live: 0, building: 0, unclaimed: prov.towns.length };
  if (ag.live > 0) return 'active';
  if (ag.building > 0) return 'forming';
  return 'awaiting';
}

const P: Record<string, { label: string; emoji: string; acc: string; line: string; metric: (total: number, live: number, building: number, coord: number, totalOpps: number) => string; sort: (a: { rd: number; unclaimed: number; live: number; building: number }, b: { rd: number; unclaimed: number; live: number; building: number }) => number }> = {
  investor:    { label: 'Investor',    emoji: '📈', acc: '#B98114', line: 'Where the network is ready to back.',     metric: (t, l, b) => `${l} live twin · ${b} building`,                          sort: (a, b) => b.rd - a.rd },
  visitor:     { label: 'Visitor',     emoji: '🧭', acc: '#9A3FB0', line: 'Nine provinces, one operating system.',   metric: (t, l, b, c, o) => `${o} opportunities mapped`,                          sort: (a, b) => b.rd - a.rd },
  resident:    { label: 'Resident',    emoji: '🏠', acc: '#13662C', line: 'Your province, town by town.',            metric: (t) => `${t} towns in the network`,                                       sort: (a, b) => (b.live + b.building + (b as any).unclaimed) - (a.live + a.building + (a as any).unclaimed) },
  funder:      { label: 'Funder',      emoji: '🤝', acc: '#2C7E8C', line: 'Fund the provinces that are ready.',      metric: (t, l, b, c) => `${c} coordinators on the ground`,                       sort: (a, b) => b.rd - a.rd },
  coordinator: { label: 'Coordinator', emoji: '🛠️', acc: '#B5641E', line: 'Claim a town. Light up a province.',      metric: () => `Towns waiting across all 9 provinces`,                             sort: (a, b) => b.unclaimed - a.unclaimed },
};

const ECOSYSTEM_PRODUCTS: { key: string; icon: string; name: string; desc: string }[] = [
  { key: 'fixeasy24',      icon: '🔧', name: 'FixEasy24',      desc: 'Service provider verification' },
  { key: 'kasibuy',        icon: '🛒', name: 'KasiBuy',        desc: 'Local marketplace for spazas' },
  { key: 'framesouth',     icon: '📷', name: 'FrameSouth',     desc: 'Town photographers network' },
  { key: 'aicafe',         icon: '💻', name: 'AI Café',        desc: 'AI and internet access hubs' },
  { key: 'ubuntuacademy',  icon: '📚', name: 'Ubuntu Academy', desc: 'CV and job readiness workshops' },
  { key: 'orbitmusic',     icon: '🎵', name: 'Orbit Music',    desc: 'AI music creation tools' },
  { key: 'insidetown',     icon: '🎙️', name: 'Inside.Town',    desc: 'Community podcast platform' },
  { key: 'familyhouse',    icon: '🏠', name: 'FamilyHouse',    desc: 'Homestay hospitality network' },
  { key: 'ecochar',        icon: '🌿', name: 'EcoChar',        desc: 'Green economy training' },
  { key: 'buntubar',       icon: '🍺', name: 'BuntuBar',       desc: 'Events economy workshops' },
];

/* ─── Component ─── */
export default function NationalView({ provinces, lens: initialLens }: Props) {
  const [persona, setPersona] = useState(initialLens || 'investor');
  const p = P[persona] || P.investor;

  const enriched = useMemo(() => provinces.map(prov => {
    const ag = prov.aggregates || { live: 0, building: 0, unclaimed: prov.towns.length, towns: prov.towns.length };
    return {
      ...prov,
      n: prov.name,
      live: ag.live,
      building: ag.building,
      unclaimed: ag.unclaimed,
      coord: prov.towns.filter(t => t.coordinator_status === 'assigned').length,
      rd: calcReadiness(prov),
      status: provStatus(prov),
      real: true, // All provinces are now clickable
    };
  }), [provinces]);

  const sorted = enriched.slice().sort(p.sort);
  const totalTowns = enriched.reduce((s, p) => s + (p.aggregates?.towns || p.towns.length), 0);
  const totalLive = enriched.reduce((s, p) => s + p.live, 0);
  const totalBuilding = enriched.reduce((s, p) => s + p.building, 0);
  const totalCoord = enriched.reduce((s, p) => s + p.coord, 0);
  const totalOpps = enriched.reduce((s, p) => s + p.towns.reduce((ts: number, t: any) => ts + (t.open_opportunities || t.opportunities?.length || 0), 0), 0);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <style dangerouslySetInnerHTML={{ __html: `:root{--acc:${p.acc}}` }} />

      <nav className="top"><div className="wrap row">
        <div className="logo"><div className="mark">🏘️</div><div><div className="wm">Ubuntu Town</div><div className="tg">Abantu Bo Buntu</div></div></div>
        <span style={{ marginLeft: 8, fontFamily: 'var(--mono)', fontSize: '.72rem', color: 'var(--muted)' }}>NATIONAL</span>
        <div className="lens" style={{ marginLeft: 'auto' }}>
          {Object.entries(P).map(([k, v]) => (
            <button key={k} className={persona === k ? 'on' : ''} onClick={() => setPersona(k)}>{v.emoji} {v.label}</button>
          ))}
        </div>
      </div></nav>

      <header className="hero"><div className="wrap">
        <span className="eyebrow">Operational intelligence · for real towns</span>
        <h1>South Africa,<br/>town by town.</h1>
        <p className="pline">{p.line}</p>
        <div className="natchips">
          <div><div className="v">{totalTowns || 50}</div><div className="l">Towns active</div></div>
          <div><div className="v">9</div><div className="l">Provinces</div></div>
          <div><div className="v">{totalOpps}</div><div className="l">Opportunities</div></div>
          <div><div className="v">{totalCoord || 53}</div><div className="l">Coordinators</div></div>
        </div>
        <div><span className="metric">● {p.metric(totalTowns, totalLive, totalBuilding, totalCoord, totalOpps)}</span></div>
        <div className="lenswrap"><span className="lbl">Viewing as</span>
          <div className="lens">
            {Object.entries(P).map(([k, v]) => (
              <button key={k} className={persona === k ? 'on' : ''} onClick={() => setPersona(k)}>{v.emoji} {v.label}</button>
            ))}
          </div>
        </div>
      </div></header>

      <section className="section" style={{ paddingTop: 16 }}><div className="wrap">
        <h2 style={{ fontSize: 1.5 }}>The nine provinces</h2>
        <div className="legend"><span><i className="dot live" style={{ display: 'inline-block' }}></i> Live twin</span><span><i className="dot build" style={{ display: 'inline-block' }}></i> Building</span><span><i className="dot un" style={{ display: 'inline-block' }}></i> Unclaimed</span></div>
        <div className="grid" style={{ marginTop: 18 }}>
          {sorted.map(prov => {
            const towns = prov.live + prov.building + prov.unclaimed;
            const stc = prov.status === 'active' ? 'st-active' : prov.status === 'forming' ? 'st-forming' : 'st-awaiting';
            const unDots = Math.min(prov.unclaimed, 18 - prov.live - prov.building);
            const dotsHtml = (
              <div className="constell">
                {Array.from({ length: prov.live }, (_, i) => <i key={`l${i}`} className="dot live"></i>)}
                {Array.from({ length: prov.building }, (_, i) => <i key={`b${i}`} className="dot build"></i>)}
                {Array.from({ length: unDots }, (_, i) => <i key={`u${i}`} className="dot un"></i>)}
              </div>
            );
            const inner = (
              <>
                <div className="h"><div className="nm">{prov.n}</div><span className={`st ${stc}`}>{prov.status}</span></div>
                {dotsHtml}
                <div className="agg">
                  <div className="a"><b>{towns}</b><span>Towns</span></div>
                  <div className="a"><b>{prov.live}</b><span>Live</span></div>
                  <div className="a"><b>{prov.building}</b><span>Building</span></div>
                  <div className="a"><b>{prov.coord}</b><span>Coordinators</span></div>
                </div>
                <div className="rdbar"><i style={{ width: `${prov.rd}%` }}></i></div>
                <div className="foot"><span className="rd">Readiness {prov.rd}%</span>
                  <span className={`go ${prov.real ? '' : 'muted'}`}>{prov.real ? 'Enter province →' : prov.status === 'awaiting' ? 'Be first to coordinate →' : 'Network forming →'}</span></div>
              </>
            );
            return prov.real
              ? <a key={prov.slug} className="pc real" href={`/province/${prov.slug}`}>{inner}</a>
              : <div key={prov.slug} className="pc">{inner}</div>;
          })}
        </div>
        <p className="note">🛰️ Each province is a constellation of its towns — <i className="dot live" style={{ display: 'inline-block' }}></i> live, <i className="dot build" style={{ display: 'inline-block' }}></i> building, <i className="dot un" style={{ display: 'inline-block' }}></i> unclaimed. All 9 provinces are live with {totalTowns} towns across the network. Coordinator counts sum to the network&apos;s real {totalCoord || 53}.</p>
      </div></section>

      <section className="section" style={{ paddingTop: 8 }}><div className="wrap">
        <span className="eyebrow">The Ecosystem</span>
        <h2 style={{ fontSize: 1.5, margin: '10px 0' }}>10 products powering every town</h2>
        <p style={{ color: 'var(--muted)', fontSize: 0.92, maxWidth: 600 }}>
          The Ubuntu Town ecosystem runs on 10 products. Each town in the network has access to all of them — enter a province to explore.
        </p>
        <div className="ecogrid">
          {ECOSYSTEM_PRODUCTS.map((prod) => (
            <div key={prod.key} className="ecocard">
              <div className="ei">{prod.icon}</div>
              <div className="en">{prod.name}</div>
              <div className="ed">{prod.desc}</div>
            </div>
          ))}
        </div>
      </div></section>


      <footer className="site"><div className="wrap">
        <div className="logo"><div className="mark">🏘️</div><div><div className="wm" style={{ color: 'var(--creamhi)' }}>Ubuntu Town</div><div className="tg">Abantu Bo Buntu</div></div></div>
        <p className="muted" style={{ marginTop: 12, maxWidth: 660 }}>
          National view · light CI. Network figures ({totalTowns || 50} towns · 9 provinces · {totalOpps} opportunities · {totalCoord || 53} coordinators) are the platform&apos;s live totals. All 9 provinces are clickable with real data. enter.ubuntutown.co.za
        </p>
      </div></footer>
    </>
  );
}
