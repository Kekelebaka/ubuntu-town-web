'use client';
import { useState } from 'react';

/* ─── Types ─── */
interface Town { slug: string; name: string; region: string; district?: string; status: string; render_pct: number; opportunity_potential?: number; heritage?: boolean; coordinator_status?: string; illustrative?: boolean; route?: string; lat?: number; lng?: number; description?: string; coordinator_name?: string; }
interface ProvinceData { slug: string; name: string; default_lens?: string; hero_image?: string; description?: string; network?: { towns: number; provinces: number; coordinators: number }; aggregates?: { towns: number; live: number; building: number; unclaimed: number; opportunity_index_avg: number }; data_vintage?: string; towns: Town[]; coordinators?: { name: string; status: string; town: string }[]; featured_stories?: { title: string; content: string; author: string; town: string }[]; top_opportunities?: { title: string; type: string; source: string; town: string }[]; [key: string]: any; }
interface Props { province: ProvinceData; lens: string; }

/* ─── CSS (from Western Cape reference) ─── */
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
.hero{padding:46px 0 22px}
.herogrid{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center}
.hero h1{font-size:clamp(3rem,8vw,6rem);line-height:.9;margin:14px 0 8px}
.hero .pline{font-size:clamp(1.1rem,2.4vw,1.55rem);color:var(--muted);font-family:var(--display);font-weight:600;max-width:24ch;transition:.25s}
.heroimg{border-radius:26px;overflow:hidden;box-shadow:var(--shlg);aspect-ratio:5/4;border:1px solid var(--line)}.heroimg img{width:100%;height:100%;object-fit:cover}
.agg{display:flex;gap:24px;flex-wrap:wrap;margin:24px 0}
.agg .v{font-family:var(--display);font-weight:800;font-size:clamp(1.5rem,3.6vw,2.3rem);color:var(--acc);line-height:1;transition:.25s}
.agg .l{font-size:.64rem;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin-top:5px}
.hcta{display:flex;gap:12px;flex-wrap:wrap}
.lenswrap{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:20px}.lenswrap .lbl{font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.netnote{font-family:var(--mono);font-size:.72rem;color:var(--muted);margin-top:16px}
.section{padding:72px 0}
.section h2{font-size:clamp(1.7rem,3.4vw,2.5rem);margin:14px 0}
.section .lead{color:var(--muted);max-width:680px;font-size:1.06rem}
.filterbar{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0;align-items:center}
.fchip{font-size:.78rem;border:1px solid var(--line2);background:var(--paper);border-radius:999px;padding:.5em 1.05em;cursor:pointer;font-weight:600;color:var(--muted)}
.fchip.on{background:var(--ink);color:var(--creamhi);border-color:var(--ink)}.fchip b{font-family:var(--mono)}
.sortnote{font-size:.74rem;color:var(--muted);font-family:var(--mono)}
.const{display:grid;grid-template-columns:repeat(auto-fill,minmax(216px,1fr));gap:16px}
.tc{position:relative;border-radius:18px;overflow:hidden;border:1px solid var(--line);min-height:200px;display:flex;flex-direction:column;justify-content:flex-end;text-decoration:none;color:var(--ink);background:var(--paper);box-shadow:var(--sh);transition:transform .25s,box-shadow .3s}
.tc:hover{transform:translateY(-5px)}
.tc.live{color:var(--creamhi)}
.tc .skin{position:absolute;inset:0}
.tc.live .gloss{position:absolute;inset:0;background:linear-gradient(0deg,rgba(7,5,9,.55),rgba(7,5,9,.15))}
.tc.build .gloss{position:absolute;inset:0;background:linear-gradient(0deg,rgba(255,255,255,.84),rgba(255,255,255,.25) 65%,transparent)}
.tc.ghost{border-style:dashed;border-color:var(--line2);background:var(--cream2)}
.tc .strata{position:absolute;inset:0;background-image:repeating-linear-gradient(0deg,rgba(0,0,0,.05) 0 2px,transparent 2px 13px);opacity:.7}
.tc .sig{position:absolute;top:13px;left:15px;font-family:var(--display);font-weight:800;font-size:1.5rem;opacity:.22}
.tc .b{position:absolute;top:12px;right:12px;font-size:.56rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:.35em .7em;border-radius:999px}
.b-live{background:rgba(26,127,55,.9);color:#fff}.b-build{background:rgba(238,184,73,.95);color:#3a2a06}.b-ghost{background:var(--paper);color:var(--muted);border:1px solid var(--line2)}
.tc .c{position:relative;padding:15px}.tc .nm{font-family:var(--display);font-weight:800;font-size:1.2rem}.tc.live .nm{color:#fff}.tc .rg{font-size:.7rem;color:var(--muted);margin-top:2px}.tc.live .rg{color:#e6d8be}
.tc .pbar{height:4px;background:rgba(21,16,21,.12);border-radius:99px;overflow:hidden;margin-top:9px}.tc .pbar i{display:block;height:100%;background:linear-gradient(90deg,var(--gold-deep),var(--gold))}
.tc .meta{margin-top:9px;font-size:.66rem;color:var(--muted);font-family:var(--mono)}.tc.live .meta{color:#d8c9ac}
.tc .claim{margin-top:9px;font-size:.72rem;color:var(--gold-deep);font-weight:700}
.spot{background:var(--paper);border:1px solid var(--line);border-radius:22px;padding:26px;box-shadow:var(--sh)}
.spot .for{font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;color:var(--acc);font-weight:700;margin-bottom:12px;display:block}
.ring{--p:40;width:110px;height:110px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--acc) calc(var(--p)*1%),var(--line2) 0);flex:none}
.ring span{width:84px;height:84px;border-radius:50%;background:var(--paper);display:grid;place-items:center;flex-direction:column;font-family:var(--display)}
.ring b{font-size:1.7rem;font-weight:800;color:var(--acc);line-height:1}.ring small{font-size:.5rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.chipset{display:flex;gap:8px;flex-wrap:wrap}.chipset span{font-size:.74rem;background:var(--cream2);border:1px solid var(--line);border-radius:999px;padding:.4em .85em}
.bul{list-style:none;display:flex;flex-direction:column;gap:8px}.bul li{font-size:.92rem;color:var(--ink2)}
.loopline{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-family:var(--display);font-weight:700;color:var(--muted)}.loopline .a{color:var(--acc)}
.note{font-size:.72rem;color:var(--muted);margin-top:16px;line-height:1.6;border-top:1px solid var(--line);padding-top:14px}
footer.site{background:var(--ink);color:var(--cream);padding:54px 0 30px}
footer.site a{color:var(--gold)}
footer.site .muted{color:#A99C84;font-size:.8rem;line-height:1.7}
@media(max-width:680px){.herogrid{grid-template-columns:1fr}.const{grid-template-columns:1fr 1fr}}
@media(max-width:860px){.section{padding:52px 0}}
.ecogrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.ecocard{background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:1.25rem 1.4rem;display:flex;flex-direction:column;gap:8px;box-shadow:var(--sh);transition:transform .18s,border-color .18s}
.ecocard:hover{transform:translateY(-3px);border-color:var(--acc)}
.ecocard .ei{font-size:1.6rem}
.ecocard .en{font-family:var(--display);font-weight:800;font-size:1rem}
.ecocard .ed{font-size:.82rem;color:var(--muted);line-height:1.5}
.ecocard .eb{margin-top:auto;padding-top:6px}
.ecocard .eb a{display:inline-flex;align-items:center;gap:.4em;font-family:var(--display);font-weight:700;font-size:.82rem;color:var(--acc);text-decoration:none;transition:.15s}
.ecocard .eb a:hover{color:var(--gold-deep)}
`;

/* ─── Helpers ─── */
function hue(s: string) { let h = 17; for (const c of s) h = (h * 29 + c.charCodeAt(0)) % 360; return h; }
function sig(n: string) { return n.replace(/[^A-Za-z ]/g, '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function skin(name: string, status: string) {
  const h = hue(name);
  return status === 'live' ? `linear-gradient(160deg,hsl(${h},45%,32%),hsl(${(h+30)%360},55%,18%))`
    : `linear-gradient(160deg,hsl(${h},55%,80%),hsl(${(h+30)%360},50%,68%))`;
}
function norm(s: string) { return s === 'build' ? 'building' : s; }
const P: Record<string, { label: string; emoji: string; acc: string; line: string; sort: (a: Town, b: Town) => number }> = {
  investor:    { label: 'Investor',    emoji: '📈', acc: '#B98114', line: 'Where capital meets momentum.',                            sort: (a, b) => (b.opportunity_potential || 0) - (a.opportunity_potential || 0) },
  visitor:     { label: 'Visitor',     emoji: '🧭', acc: '#9A3FB0', line: 'Heritage and landscapes across this province.',            sort: (a, b) => ((b as any).heritage ? 1 : 0) - ((a as any).heritage ? 1 : 0) || (b.opportunity_potential || 0) - (a.opportunity_potential || 0) },
  resident:    { label: 'Resident',    emoji: '🏠', acc: '#13662C', line: 'Your town, in your hands.',                                sort: (a, b) => ({ live: 0, building: 1, build: 1, ghost: 2 }[a.status] || 3) - ({ live: 0, building: 1, build: 1, ghost: 2 }[b.status] || 3) || (b.opportunity_potential || 0) - (a.opportunity_potential || 0) },
  funder:      { label: 'Funder',      emoji: '🤝', acc: '#2C7E8C', line: 'Fund proof, not promises.',                                sort: (a, b) => (b.opportunity_potential || 0) - (a.opportunity_potential || 0) },
  coordinator: { label: 'Coordinator', emoji: '🛠️', acc: '#B5641E', line: 'Claim a town. Run the loop.',                               sort: (a, b) => ((a.status === 'ghost' ? 0 : 1) - (b.status === 'ghost' ? 0 : 1)) || ((b.opportunity_potential || 0) - (a.opportunity_potential || 0)) },
};
const NOTES: Record<string, string> = { investor: 'Sorted by opportunity potential.', funder: 'Ranked by fundable potential.', visitor: 'Heritage towns surfaced first.', resident: 'Ordered by how rendered each town is.', coordinator: 'Unclaimed towns first — pick one and start.' };

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

/* ─── Component ─── */
export default function ProvinceClient({ province, lens: initialLens }: Props) {
  const [persona, setPersona] = useState(initialLens || province.default_lens || 'investor');
  const [filter, setFilter] = useState('all');
  const p = P[persona] || P.investor;
  const ag = province.aggregates || { towns: province.towns.length, live: 0, building: 0, unclaimed: province.towns.length, opportunity_index_avg: 0 };
  const net = province.network || { towns: 50, provinces: 9, coordinators: 53 };
  const towns = province.towns || [];

  const filtered = towns.slice().sort(p.sort).filter(t => filter === 'all' || norm(t.status) === filter);
  const cnt = { all: towns.length, live: towns.filter(t => t.status === 'live').length, building: towns.filter(t => norm(t.status) === 'building').length, ghost: towns.filter(t => t.status === 'ghost').length };
  const liveTown = towns.find(t => t.status === 'live');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <style dangerouslySetInnerHTML={{ __html: `:root{--acc:${p.acc}}` }} />

      <nav className="top"><div className="wrap row">
        <div className="logo"><div className="mark">🏘️</div><div><div className="wm">Ubuntu Town</div><div className="tg">Abantu Bo Buntu</div></div></div>
        <span className="crumb" style={{ marginLeft: 8 }}>
          <a href="/enter">Ubuntu Town · National</a> › <b>{province.name}</b>
        </span>
        <div className="lens" style={{ marginLeft: 'auto' }}>
          {Object.entries(P).map(([k, v]) => (
            <button key={k} className={persona === k ? 'on' : ''} onClick={() => setPersona(k)}>{v.emoji} {v.label}</button>
          ))}
        </div>
      </div></nav>

      <header className="hero"><div className="wrap"><div className="herogrid">
        <div>
          <span className="eyebrow">Province · {province.name}</span>
          <h1>{province.name}</h1>
          {province.description && <p style={{ color: 'var(--muted)', fontSize: '1.06rem', maxWidth: 600, marginTop: 8, lineHeight: 1.6 }}>{province.description}</p>}
          <p className="pline">{p.line}</p>
          <div className="agg">
            <div><div className="v">{ag.towns}</div><div className="l">Towns</div></div>
            <div><div className="v">{ag.live}</div><div className="l">Live</div></div>
            <div><div className="v">{ag.building}</div><div className="l">Building</div></div>
            <div><div className="v">{ag.unclaimed}</div><div className="l">Unclaimed</div></div>
          </div>
          <div className="hcta"><a className="btn" href="#const">Enter a town →</a><a className="btn-ghost" href="#const">Claim a town</a></div>
          <div className="lenswrap"><span className="lbl">Viewing as</span>
            <div className="lens">
              {Object.entries(P).map(([k, v]) => (
                <button key={k} className={persona === k ? 'on' : ''} onClick={() => setPersona(k)}>{v.emoji} {v.label}</button>
              ))}
            </div>
          </div>
          <div className="netnote">Part of the Ubuntu Town network · {net.towns} towns · {net.provinces} provinces · {net.coordinators} coordinators nationally.</div>
        </div>
        <div className="heroimg">
          {province.hero_image
            ? <img src={province.hero_image} alt={province.name} />
            : <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg,hsl(${hue(province.name)},55%,75%),hsl(${(hue(province.name)+30)%360},50%,60%))` }} />}
        </div>
      </div></div></header>

      <div className="wrap">
        <section className="section" id="const" style={{ paddingTop: 14 }}>
          <span className="eyebrow">The constellation</span>
          <h2>{province.name}, town by town.</h2>
          <p className="lead">Every town is a card. Live twins are photographic; others are building or unclaimed. The lens re-orders the wall for who&apos;s looking.</p>
          <div className="filterbar">
            <span>
              {(['all', 'live', 'building', 'ghost'] as const).map(f => (
                <span key={f} className={`fchip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : f === 'live' ? 'Live' : f === 'building' ? 'Building' : 'Unclaimed'} <b>{cnt[f]}</b>
                </span>
              ))}
            </span>
            <span className="sortnote">↕ {NOTES[persona]}</span>
          </div>
          <div className="const">
            {filtered.map(t => {
              if (t.status === 'live') return (
                <a key={t.slug} className="tc live" href={t.route || `/town/${t.slug}`} style={{ boxShadow: '0 0 0 1px rgba(238,184,73,.6),0 22px 46px -18px rgba(185,129,20,.55)' }}>
                  <div className="skin" style={{ background: skin(t.name, 'live') }}></div>
                  <div className="strata"></div>
                  <div className="sig" style={{ color: '#fff' }}>{sig(t.name)}</div>
                  <div className="gloss"></div>
                  <span className="b b-live">● Live</span>
                  <div className="c"><div className="nm">{t.name}</div><div className="rg">{t.region || ''}</div>
                    <div className="meta">render 100% · twin live</div>
                    <div className="pbar"><i style={{ width: '100%' }}></i></div></div>
                </a>
              );
              if (t.status === 'building' || t.status === 'build') return (
                <a key={t.slug} className="tc build" href={t.route || `/town/${t.slug}`}>
                  <div className="skin" style={{ background: skin(t.name, 'building') }}></div>
                  <div className="strata"></div>
                  <div className="sig">{sig(t.name)}</div>
                  <div className="gloss"></div>
                  <span className="b b-build">◐ Building</span>
                  <div className="c"><div className="nm">{t.name}</div><div className="rg">{t.region || ''}</div>
                    <div className="meta">rendering · {t.render_pct || 0}%</div>
                    <div className="pbar"><i style={{ width: `${t.render_pct || 0}%` }}></i></div></div>
                </a>
              );
              return (
                <div key={t.slug} className="tc ghost">
                  <div className="strata"></div>
                  <div className="sig">{sig(t.name)}</div>
                  <span className="b b-ghost">○ Unclaimed</span>
                  <div className="c"><div className="nm">{t.name}</div><div className="rg">{t.region || ''}</div>
                    <div className="claim">+ Claim this town →</div></div>
                </div>
              );
            })}
          </div>
          <p className="note">🛰️ Card skins are generated from each town&apos;s name and state — pale when unclaimed, warming as a coordinator activates it, fully rendered once Naledi builds the twin. {liveTown ? <b>{liveTown.name}</b> : 'This province is illustrative until its first twin is built'}.</p>
        </section>

        <section className="section" style={{ paddingTop: 6 }}>
          <div className="spot">
            {persona === 'investor' || persona === 'funder' ? (
              <>
                <span className="for">{p.emoji} For {persona}s</span>
                <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="ring" style={{ '--p': Math.round(ag.opportunity_index_avg || 0) } as any}>
                    <span><b>{Math.round(ag.opportunity_index_avg || 0)}</b><small>Avg potential</small></span>
                  </div>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 1.4 }}>{ag.live} live · {ag.building} building · {ag.unclaimed} unclaimed</div>
                    <p style={{ color: 'var(--muted)', margin: '6px 0 12px', fontSize: 0.88 }}>Scored opportunities surface as each town&apos;s twin renders. {liveTown ? liveTown.name + ' is live now' : 'No live twin yet — first mover advantage'}.</p>
                    <a className="btn" href={liveTown ? `/town/${liveTown.slug}` : '#const'}>{liveTown ? `Explore ${liveTown.name} →` : 'Browse the towns ↓'}</a>
                  </div>
                </div>
              </>
            ) : persona === 'visitor' ? (
              <>
                <span className="for">{p.emoji} For visitors</span>
                <p style={{ color: 'var(--muted)', maxWidth: 680, fontSize: 1.06, marginBottom: 12 }}>Heritage, landscapes and routes across {province.name}.</p>
                <div className="chipset">
                  {towns.filter(t => (t as any).heritage).slice(0, 8).map(t => <span key={t.slug}>{t.name}</span>)}
                  {towns.filter(t => (t as any).heritage).length === 0 && <span>Towns rendering soon</span>}
                </div>
              </>
            ) : persona === 'resident' ? (
              <>
                <span className="for">{p.emoji} For residents</span>
                <p style={{ color: 'var(--muted)', maxWidth: 680, fontSize: 1.06 }}>Where a twin is live, every service is mapped — schools, clinics, shops and community. {liveTown ? liveTown.name + ' is live now; your town is next.' : 'Your town is next.'}</p>
                <div style={{ marginTop: 14 }}><a className="btn" href={liveTown ? `/town/${liveTown.slug}` : '#const'}>{liveTown ? `Explore ${liveTown.name} →` : 'Browse the towns ↓'}</a></div>
              </>
            ) : (
              <>
                <span className="for">{p.emoji} For coordinators</span>
                <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <p style={{ color: 'var(--muted)', maxWidth: 680, fontSize: 1.06 }}>{ag.unclaimed} towns in {province.name} are unclaimed. Claim one, run the loop, and watch it render.</p>
                    <div className="loopline" style={{ margin: '12px 0', color: 'var(--ink)' }}>
                      Signal<span className="a">→</span>Workpack<span className="a">→</span>Proof<span className="a">→</span>Memory<span className="a">→</span>Action
                    </div>
                  </div>
                  <a className="btn" href="https://enter.ubuntutown.co.za" target="_blank" rel="noopener noreferrer">Apply to coordinate →</a>
                </div>
              </>
            )}
          </div>
        </section>

        {/* COORDINATOR PROFILES */}
        {(province.coordinators && province.coordinators.length > 0) && (
          <section className="section" style={{ paddingTop: 8 }}>
            <span className="eyebrow">Network</span>
            <h2 style={{ fontSize: 1.5, margin: '10px 0' }}>Coordinators in {province.name}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: 14 }}>{province.coordinators.length} active coordinators across the province.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {province.coordinators.map((c, i) => (
                <div key={i} className="card" style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gold)', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: '.82rem', color: '#fff', flexShrink: 0 }}>
                    {c.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{c.name}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>Coordinator · <a href={`/town/${c.town}`} style={{ color: 'var(--gold-deep)' }}>{c.town}</a></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FEATURED STORIES */}
        {(province.featured_stories && province.featured_stories.length > 0) && (
          <section className="section" style={{ paddingTop: 8 }}>
            <span className="eyebrow">Community voices</span>
            <h2 style={{ fontSize: 1.5, margin: '10px 0' }}>Stories from {province.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {province.featured_stories.map((st, i) => (
                <div key={i} className="card" style={{ borderLeft: '3px solid var(--gold)' }}>
                  <div style={{ fontWeight: 700, fontSize: '.92rem', fontFamily: 'var(--display)' }}>{st.title}</div>
                  <p style={{ color: 'var(--muted)', fontSize: '.84rem', margin: '8px 0', lineHeight: 1.6 }}>{st.content}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.72rem', color: 'var(--muted2)', fontStyle: 'italic' }}>— {st.author}</span>
                    <a href={`/town/${st.town}`} style={{ fontSize: '.72rem', color: 'var(--gold-deep)', textDecoration: 'none' }}>{st.town} →</a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* THE ECOSYSTEM */}
        <section className="section" style={{ paddingTop: 8 }}>
          <span className="eyebrow">The Ecosystem</span>
          <h2 style={{ fontSize: 1.5, margin: '10px 0' }}>Ubuntu Town products across {province.name}</h2>
          <p style={{ color: 'var(--muted)', fontSize: 0.92, marginBottom: 18, maxWidth: 600 }}>
            Every town in {province.name} has access to these ecosystem products. Enter a town to claim an opportunity.
          </p>
          <div className="ecogrid">
            {ECOSYSTEM_PRODUCTS.map((prod) => {
              const townsWithProduct = towns.filter(t =>
                (t as any).opportunities?.some((o: any) => o.metadata?.ecosystem === prod.key || o.source === prod.name)
              );
              return (
                <div key={prod.key} className="ecocard">
                  <div className="ei">{prod.icon}</div>
                  <div className="en">{prod.name}</div>
                  <div className="ed">{prod.desc}</div>
                  <div className="eb">
                    {townsWithProduct.length > 0
                      ? <a href={`/town/${townsWithProduct[0].slug}`}>Available in {townsWithProduct.length} town{townsWithProduct.length > 1 ? 's' : ''} →</a>
                      : <a href="#const">Browse towns →</a>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="section" style={{ textAlign: 'center' }}>
          <span className="eyebrow">The model</span>
          <h2 style={{ margin: 12, fontSize: 1.6 }}>One loop runs every town.</h2>
          <div className="loopline" style={{ justifyContent: 'center', fontSize: '1.05rem', color: 'var(--ink)' }}>
            Signal<span className="a">→</span>Workpack<span className="a">→</span>Proof<span className="a">→</span>Memory<span className="a">→</span>Action
          </div>
          <p className="lead" style={{ margin: '16px auto 0' }}>As coordinators run the loop, towns render — and the province lights up.</p>
        </section>
      </div>

      <footer className="site"><div className="wrap">
        <div className="logo"><div className="mark">🏘️</div><div><div className="wm" style={{ color: 'var(--creamhi)' }}>Ubuntu Town</div><div className="tg">Abantu Bo Buntu</div></div></div>
        <p className="muted" style={{ marginTop: 12, maxWidth: 660 }}>
          {province.data_vintage ? `Illustrative ${province.name} rollout state — town names, regions and districts are real; status, render_pct and potential are demo values until each twin is built. No live twin yet (Free State is the reference build).` : 'Ubuntu Town · light CI · enter.ubuntutown.co.za'} · light CI · enter.ubuntutown.co.za
        </p>
      </div></footer>
    </>
  );
}
