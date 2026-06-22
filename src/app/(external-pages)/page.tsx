import Link from 'next/link';
import { HomeStats, TownCount } from './HomeStats';

const ecosystemBrands = [
  { icon: '🎙️', name: 'Inside.Town', desc: 'Town voice — podcasts, civic media, community storytelling. Every town gets a local media identity.' },
  { icon: '📸', name: 'FrameSouth', desc: 'Photography, video, visual proof. Town photographers create the evidence layer.' },
  { icon: '🔧', name: 'FixEasy24', desc: 'Verified plumbers, electricians, handymen. Local repair and service provider network.' },
  { icon: '🛒', name: 'KasiBuy', desc: 'Local commerce — spaza deals, WhatsApp catalogues, community ordering. Shop local.' },
  { icon: '🏠', name: 'FamilyHouse', desc: 'Home-based hospitality. Verified accommodation for visitors, events, and travelers.' },
  { icon: '🌿', name: 'EcoChar', desc: 'Charcoal production training. 5-day practical programme from setup to distribution.' },
  { icon: '🍹', name: 'BuntuBar', desc: 'Mobile bar and beverage workshops. Event trade, compliance, and local hospitality.' },
  { icon: '🤖', name: 'AI Café', desc: 'CVs, tenders, business profiles, admin services. AI-enabled local digital access.' },
  { icon: '🎓', name: 'Ubuntu Academy', desc: 'Skills workshops — CV readiness, digital skills, tender basics, business marketing.' },
  { icon: '🎵', name: 'Orbit Music', desc: 'Youth AI music creation workshops. Create songs, learn, earn from streams and briefs.' },
];

const featuredTowns = [
  { name: 'Johannesburg', slug: 'johannesburg' },
  { name: 'Cape Town', slug: 'cape-town' },
  { name: 'Durban', slug: 'durban' },
  { name: 'Pretoria', slug: 'pretoria' },
  { name: 'Polokwane', slug: 'polokwane' },
  { name: 'Bloemfontein', slug: 'bloemfontein' },
  { name: 'Rustenburg', slug: 'rustenburg' },
  { name: 'East London', slug: 'east-london' },
  { name: 'Kimberley', slug: 'kimberley' },
  { name: 'Nelspruit', slug: 'nelspruit' },
  { name: 'Mafikeng', slug: 'mafikeng' },
  { name: 'Mthatha', slug: 'mthatha' },
];

const flowSteps = [
  { num: '1', title: 'Signal', desc: 'A need, opportunity, or issue surfaces in the town' },
  { num: '2', title: 'Workpack', desc: 'The signal becomes a measurable unit of work' },
  { num: '3', title: 'Proof', desc: 'The coordinator executes and submits evidence' },
  { num: '4', title: 'Memory', desc: "The town's operational intelligence grows" },
  { num: '5', title: 'Action', desc: 'Better decisions, faster activation, real impact' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text">
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 900px 500px at 50% 40%, rgba(238,184,73,0.08), transparent), radial-gradient(ellipse 600px 400px at 30% 60%, rgba(185,129,20,0.04), transparent)' }} />
        <div className="relative z-10 text-center max-w-[800px] px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-ubuntu-gold/25 bg-ubuntu-gold/[0.08] text-ubuntu-gold-dark text-[0.7rem] font-semibold uppercase tracking-widest mb-8">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute h-full w-full rounded-full bg-ubuntu-gold opacity-75" />
              <span className="relative rounded-full h-1.5 w-1.5 bg-ubuntu-gold-dark" />
            </span>
            Governed AI · Town Memory Runtime
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-5">
            <span className="text-ubuntu-gold-dark">Operational Intelligence</span><br />For Real Towns.
          </h1>
          <p className="text-ubuntu-text-muted text-lg leading-relaxed max-w-[600px] mx-auto mb-10">
            Ubuntu Town OS is a distributed operational coordination platform for towns, people, and ecosystem execution. Signals become workpacks. Workpacks become proof. Proof becomes memory.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/enter" className="bg-ubuntu-gold hover:bg-ubuntu-gold-dark text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5">Enter Your Town →</Link>
            <Link href="https://t.me/UIE_Kopano_bot" target="_blank" rel="noopener noreferrer" className="border border-ubuntu-border hover:border-ubuntu-gold text-ubuntu-text-muted hover:text-ubuntu-gold-dark px-8 py-3.5 rounded-xl font-semibold text-sm transition-all">Start on Telegram</Link>
          </div>
        </div>
      </section>

      <HomeStats />

      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <span className="inline-block text-[0.65rem] font-bold tracking-[0.1em] uppercase text-ubuntu-gold-dark bg-ubuntu-gold/[0.1] border border-ubuntu-gold/20 px-3 py-1 rounded-full mb-4">How It Works</span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">The Operating Loop</h2>
        <p className="text-ubuntu-text-muted max-w-[600px] leading-relaxed">Every town follows the same loop. Signals from the ground become structured work. Work produces proof. Proof builds town memory. Memory drives the next action.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-12">
          {flowSteps.map((step) => (
            <div key={step.num} className="text-center p-4 md:p-6">
              <div className="w-10 h-10 rounded-full bg-ubuntu-gold/10 border-2 border-ubuntu-gold flex items-center justify-center text-sm font-extrabold text-ubuntu-gold-dark mx-auto mb-4">{step.num}</div>
              <h4 className="text-sm font-bold mb-1">{step.title}</h4>
              <p className="text-[0.7rem] text-ubuntu-text-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 pb-20">
        <span className="inline-block text-[0.65rem] font-bold tracking-[0.1em] uppercase text-ubuntu-gold-dark bg-ubuntu-gold/[0.1] border border-ubuntu-gold/20 px-3 py-1 rounded-full mb-4">Ecosystem</span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">10 Brands. One Town Stack.</h2>
        <p className="text-ubuntu-text-muted max-w-[600px] leading-relaxed">Each town activates the brands that match its demand. Not every brand in every town — fit-weighted activation based on coordinator strength and local opportunity.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
          {ecosystemBrands.map((brand) => (
            <div key={brand.name} className="bg-ubuntu-card border border-ubuntu-border rounded-2xl p-6 hover:border-ubuntu-gold/50 transition-all hover:-translate-y-0.5 cursor-pointer">
              <div className="text-2xl mb-3">{brand.icon}</div>
              <h4 className="text-sm font-bold mb-1">{brand.name}</h4>
              <p className="text-[0.78rem] text-ubuntu-text-muted leading-relaxed">{brand.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="text-center py-20 border-t border-ubuntu-border">
        <span className="inline-block text-[0.65rem] font-bold tracking-[0.1em] uppercase text-ubuntu-gold-dark bg-ubuntu-gold/[0.1] border border-ubuntu-gold/20 px-3 py-1 rounded-full mb-4"><TownCount /></span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Enter Your Town</h2>
        <p className="text-ubuntu-text-muted max-w-[500px] mx-auto mb-8 leading-relaxed px-6">Select a town to see its digital twin — opportunities, businesses, services, signals, coordinators, and AI support.</p>
        <Link href="/towns" className="inline-block bg-ubuntu-gold hover:bg-ubuntu-gold-dark text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5">Browse All Towns →</Link>
        <div className="flex flex-wrap gap-2 justify-center mt-8 max-w-[700px] mx-auto px-6">
          {featuredTowns.map((town) => (
            <Link key={town.slug} href={`/town/${town.slug}`} className="bg-ubuntu-card border border-ubuntu-border px-4 py-1.5 rounded-full text-xs text-ubuntu-text-muted hover:border-ubuntu-gold hover:text-ubuntu-gold-dark transition-all">{town.name}</Link>
          ))}
          <span className="px-4 py-1.5 rounded-full text-xs text-ubuntu-gold-dark border border-ubuntu-gold/30">+38 more</span>
        </div>
      </div>

      <section className="max-w-[800px] mx-auto px-6 pb-20">
        <div className="bg-ubuntu-card border border-ubuntu-border rounded-2xl p-12 text-center">
          <span className="inline-block text-[0.65rem] font-bold tracking-[0.1em] uppercase text-ubuntu-gold-dark bg-ubuntu-gold/[0.1] border border-ubuntu-gold/20 px-3 py-1 rounded-full mb-4">Become a Coordinator</span>
          <h3 className="text-2xl font-extrabold mb-3">Make Your Town Visible</h3>
          <p className="text-ubuntu-text-muted mb-8 leading-relaxed max-w-[500px] mx-auto">Whether you&apos;re an entrepreneur, community leader, or someone mapping demand — Ubuntu Town needs people who build.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/sign-up" className="bg-ubuntu-gold hover:bg-ubuntu-gold-dark text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all">Apply to Become a Coordinator</Link>
            <Link href="/about" className="border border-ubuntu-border hover:border-ubuntu-gold text-ubuntu-text-muted hover:text-ubuntu-gold-dark px-8 py-3.5 rounded-xl font-semibold text-sm transition-all">About Ubuntu Town</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
