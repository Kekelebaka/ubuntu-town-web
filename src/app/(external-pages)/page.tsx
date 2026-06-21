import Link from 'next/link';

const eco = [
  { icon: '🎙️', name: 'Inside.Town', desc: 'Town voice — podcasts, civic media, community storytelling.' },
  { icon: '📸', name: 'FrameSouth', desc: 'Photography, video, visual proof. The evidence layer.' },
  { icon: '🔧', name: 'FixEasy24', desc: 'Verified plumbers, electricians, handymen. Local services.' },
  { icon: '🛒', name: 'KasiBuy', desc: 'Local commerce — spaza deals, WhatsApp catalogues.' },
  { icon: '🏠', name: 'FamilyHouse', desc: 'Home-based hospitality. Verified accommodation.' },
  { icon: '🌿', name: 'EcoChar', desc: 'Charcoal production training. 5-day practical programme.' },
  { icon: '🍹', name: 'BuntuBar', desc: 'Mobile bar workshops. Event trade and hospitality.' },
  { icon: '🤖', name: 'AI Café', desc: 'CVs, tenders, business profiles. AI-enabled access.' },
  { icon: '🎓', name: 'Ubuntu Academy', desc: 'CV readiness, digital skills, tender basics workshops.' },
  { icon: '🎵', name: 'Orbit Music', desc: 'Youth AI music creation. Streams, briefs, showcases.' },
];
const towns = [
  { n: 'Johannesburg', s: 'johannesburg' },{ n: 'Cape Town', s: 'cape-town' },
  { n: 'Durban', s: 'durban' },{ n: 'Pretoria', s: 'pretoria' },
  { n: 'Polokwane', s: 'polokwane' },{ n: 'Bloemfontein', s: 'bloemfontein' },
  { n: 'Rustenburg', s: 'rustenburg' },{ n: 'East London', s: 'east-london' },
  { n: 'Kimberley', s: 'kimberley' },{ n: 'Nelspruit', s: 'nelspruit' },
  { n: 'Mafikeng', s: 'mafikeng' },{ n: 'Mthatha', s: 'mthatha' },
];
const steps = [
  { n: '1', t: 'Signal', d: 'A need or issue surfaces in the town' },
  { n: '2', t: 'Workpack', d: 'The signal becomes measurable work' },
  { n: '3', t: 'Proof', d: 'Coordinator executes and submits evidence' },
  { n: '4', t: 'Memory', d: 'Town operational intelligence grows' },
  { n: '5', t: 'Action', d: 'Better decisions, faster activation' },
];
const G = '#eeb849'; const GD = '#b98114'; const INK = '#151015';
const TM = 'rgba(31,22,32,0.6)'; const BG = '#fbf4e6';
const BD = 'rgba(93,44,147,0.16)'; const BDG = 'rgba(238,184,73,0.38)';
const SF = 'rgba(255,255,255,0.9)';
const tag = "inline-block text-[0.6rem] font-extrabold tracking-[0.12em] uppercase px-3 py-1 rounded-full mb-4";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: BG, color: 'rgba(31,22,32,0.78)' }}>
      <section className="py-20 px-6 max-w-[820px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8 text-xs font-bold uppercase tracking-widest" style={{ borderColor: BDG, background: 'rgba(238,184,73,0.08)', color: GD }}>
          <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute h-full w-full rounded-full opacity-75" style={{ background: G }} /><span className="relative rounded-full h-1.5 w-1.5" style={{ background: G }} /></span>
          Governed AI · Town Memory Runtime
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] mb-6" style={{ color: INK }}>
          Ubuntu Town OS<br />
          <span style={{ background: 'linear-gradient(135deg,#eeb849,#b98114)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Operational Intelligence</span><br />
          For Real Towns.
        </h1>
        <p className="text-base leading-relaxed max-w-[560px] mx-auto mb-10" style={{ color: TM }}>
          Ubuntu Town OS is a distributed operational coordination platform for towns, people, and ecosystem execution. Signals become workpacks. Workpacks become proof. Proof becomes memory.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/enter" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-sm transition-all hover:-translate-y-0.5" style={{ background: G, color: '#070509' }}>Enter Your Town →</Link>
          <Link href="https://t.me/Ubuntu_Town_Ops_Intake_bot" target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 rounded-xl font-bold text-sm transition-all" style={{ border: '1.5px solid ' + BDG, color: INK }}>Start on Telegram</Link>
        </div>
      </section>
      <div className="max-w-[700px] mx-auto px-6 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden" style={{ border: '1px solid ' + BD }}>
          {[{ n:'27',l:'Towns Active' },{ n:'9',l:'Provinces' },{ n:'62',l:'Opportunities' },{ n:'18',l:'Coordinators' }].map(s=>(
            <div key={s.l} className="p-6 text-center" style={{ background: SF, borderRight: '1px solid rgba(93,44,147,0.1)', borderBottom: '1px solid rgba(93,44,147,0.1)' }}>
              <div className="text-3xl font-black" style={{ color: GD }}>{s.n}</div>
              <div className="text-[0.65rem] font-semibold uppercase tracking-wider mt-1" style={{ color: TM }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <section className="max-w-[1100px] mx-auto px-6 py-20">
        <span className={tag} style={{ color: GD, background: 'rgba(238,184,73,0.1)', border: '1px solid rgba(238,184,73,0.2)' }}>How It Works</span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2" style={{ color: INK }}>The Operating Loop</h2>
        <p className="max-w-[540px] text-sm leading-relaxed" style={{ color: TM }}>Every town follows the same loop. Signals become work. Work produces proof. Proof builds memory. Memory drives action.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-10">
          {steps.map(s=>(
            <div key={s.n} className="text-center p-5">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black mx-auto mb-3" style={{ background: 'rgba(238,184,73,0.12)', border: '2px solid #eeb849', color: GD }}>{s.n}</div>
              <h4 className="text-sm font-extrabold mb-1" style={{ color: INK }}>{s.t}</h4>
              <p className="text-[0.68rem] leading-relaxed" style={{ color: TM }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="max-w-[1100px] mx-auto px-6 pb-20">
        <span className={tag} style={{ color: GD, background: 'rgba(238,184,73,0.1)', border: '1px solid rgba(238,184,73,0.2)' }}>Ecosystem</span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2" style={{ color: INK }}>10 Brands. One Town Stack.</h2>
        <p className="max-w-[540px] text-sm leading-relaxed" style={{ color: TM }}>Each town activates the brands that match its demand. Fit-weighted activation.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-10">
          {eco.map(b=>(
            <div key={b.name} className="p-5 rounded-2xl transition-all hover:-translate-y-0.5 cursor-pointer" style={{ background: SF, border: '1px solid ' + BD }}>
              <div className="text-2xl mb-2">{b.icon}</div>
              <h4 className="text-sm font-extrabold mb-1" style={{ color: INK }}>{b.name}</h4>
              <p className="text-xs leading-relaxed" style={{ color: TM }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="text-center py-16 px-6" style={{ borderTop: '1px solid ' + BD }}>
        <span className={tag} style={{ color: GD, background: 'rgba(238,184,73,0.1)', border: '1px solid rgba(238,184,73,0.2)' }}>27 Towns Live</span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2" style={{ color: INK }}>Enter Your Town</h2>
        <p className="max-w-[500px] mx-auto mb-6 text-sm leading-relaxed" style={{ color: TM }}>Select a town to see its digital twin — opportunities, businesses, services, signals, and AI support.</p>
        <Link href="/towns" className="inline-flex px-8 py-3.5 rounded-xl font-black text-sm transition-all hover:-translate-y-0.5" style={{ background: G, color: '#070509' }}>Browse All Towns →</Link>
        <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-[650px] mx-auto">
          {towns.map(t=>(<Link key={t.s} href={'/town/'+t.s} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ background: SF, border: '1px solid ' + BD, color: TM }}>{t.n}</Link>))}
          <span className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ color: GD, border: '1px solid rgba(238,184,73,0.3)' }}>+15 more</span>
        </div>
      </div>
      <section className="max-w-[700px] mx-auto px-6 pb-16">
        <div className="rounded-2xl p-10 text-center" style={{ background: SF, border: '1px solid ' + BDG }}>
          <span className={tag} style={{ color: GD, background: 'rgba(238,184,73,0.1)', border: '1px solid rgba(238,184,73,0.2)' }}>Become a Coordinator</span>
          <h3 className="text-2xl font-black mb-2" style={{ color: INK }}>Make Your Town Visible</h3>
          <p className="mb-8 leading-relaxed max-w-[450px] mx-auto text-sm" style={{ color: TM }}>Whether you&apos;re an entrepreneur, community leader, or someone mapping demand — Ubuntu Town needs people who build.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/sign-up" className="px-8 py-3.5 rounded-xl font-black text-sm" style={{ background: G, color: '#070509' }}>Apply to Become a Coordinator</Link>
            <Link href="/about" className="px-8 py-3.5 rounded-xl font-bold text-sm" style={{ border: '1.5px solid ' + BDG, color: INK }}>About Ubuntu Town</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
