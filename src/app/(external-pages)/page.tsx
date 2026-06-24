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

const forgeTools = [
  { icon: '🧾', name: 'SASSA Appeal', desc: 'Appeal or apply for a social grant' },
  { icon: '📄', name: 'CV / Résumé', desc: 'Get job-ready in minutes' },
  { icon: '🏫', name: 'School Letter', desc: 'Absence, permission, fees, admission' },
  { icon: '🛒', name: 'Spaza Poster', desc: 'Price list to print & WhatsApp' },
  { icon: '🏛️', name: 'Municipal Letter', desc: 'Complaint or service request' },
  { icon: '💼', name: 'Quote / Invoice', desc: 'Look professional, get paid' },
  { icon: '🌱', name: 'Funding One-Pager', desc: 'Pitch for SEDA / NYDA / stokvel' },
  { icon: '💬', name: 'WhatsApp Reply', desc: 'Clear messages in seconds' },
];

const osFeatures = [
  { icon: '🏘️', title: '50 Town Digital Twins', desc: 'Every town has a live page — opportunities, businesses, services, coordinators, and signals. Real data. Real time.' },
  { icon: '📡', title: 'Signal → Workpack Loop', desc: 'Community issues become structured work. Coordinators execute. Proof is submitted. The town\'s memory grows.' },
  { icon: '👤', title: 'Coordinator Dashboard', desc: 'Auth-gated hub for town coordinators — manage signals, track earnings, submit proof, activate ecosystem brands.' },
  { icon: '📄', title: 'CV Builder', desc: '1 Million CVs. AI-assisted, professional, township-ready. A CV that actually gets you hired.' },
  { icon: '✨', title: 'Kopano AI', desc: 'Town-aware AI assistant. Asks about Senekal, it knows Senekal. Powered by Ubuntu Town\'s live data layer.' },
  { icon: '🏗️', title: 'Build Fellowship', desc: '50 towns. 50 builders. $1,000 in AI credits. 8-week programme — build for Ubuntu Town, then build your own product.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text">

      {/* ─── HERO ─── */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 900px 500px at 50% 40%, rgba(238,184,73,0.09), transparent), radial-gradient(ellipse 600px 400px at 30% 60%, rgba(185,129,20,0.05), transparent)',
          }}
        />
        <div className="relative z-10 text-center max-w-[860px] px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-ubuntu-gold/25 bg-ubuntu-gold/[0.08] text-ubuntu-gold-dark text-[0.7rem] font-semibold uppercase tracking-widest mb-8">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute h-full w-full rounded-full bg-ubuntu-gold opacity-75" />
              <span className="relative rounded-full h-1.5 w-1.5 bg-ubuntu-gold-dark" />
            </span>
            50 Towns Live · South Africa
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-5">
            <span className="text-ubuntu-gold-dark">Operational Intelligence</span>
            <br />For Real Towns.
          </h1>
          <p className="text-ubuntu-text-muted text-lg leading-relaxed max-w-[620px] mx-auto mb-10">
            Ubuntu Town is a distributed coordination platform for South African towns. Enter your town OS — or use Kopano Forge to build what you need today, free on your phone.
          </p>

          {/* ─── TWO PLATFORM CARDS ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[640px] mx-auto mb-8">
            {/* Ubuntu Town OS Card */}
            <Link
              href="/enter"
              className="group flex flex-col items-start p-5 rounded-2xl text-left transition-all hover:-translate-y-1 border-2"
              style={{ background: '#eeb849', borderColor: '#d4a030', color: '#070509' }}
            >
              <div className="text-2xl mb-2">🏘️</div>
              <div className="font-black text-base leading-tight mb-1">Ubuntu Town OS</div>
              <div className="text-[0.72rem] font-semibold opacity-75 mb-3 leading-snug">
                50 towns · coordinators · signals · CV builder · Kopano AI
              </div>
              <div
                className="text-xs font-black uppercase tracking-wider flex items-center gap-1 mt-auto"
                style={{ color: '#070509' }}
              >
                Enter Your Town <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </Link>

            {/* Kopano Forge Card */}
            <a
              href="https://forge.ubuntutown.co.za"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-start p-5 rounded-2xl text-left transition-all hover:-translate-y-1 border-2"
              style={{
                background: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(238,184,73,0.35)',
                color: '#151015',
              }}
            >
              <div className="text-2xl mb-2">🔨</div>
              <div className="font-black text-base leading-tight mb-1 text-ubuntu-gold-dark">Kopano Forge</div>
              <div
                className="text-[0.72rem] font-semibold mb-3 leading-snug"
                style={{ color: 'rgba(31,22,32,0.6)' }}
              >
                CVs · SASSA appeals · letters · spaza posters · works without airtime
              </div>
              <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1 mt-auto text-ubuntu-gold-dark">
                Open Forge <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </a>
          </div>

          {/* ─── FELLOWSHIP BANNER ─── */}
          <Link
            href="/fellowship"
            className="group inline-flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all hover:-translate-y-0.5 mb-5 max-w-[640px] w-full"
            style={{ background: '#070509', borderColor: 'rgba(238,184,73,0.18)' }}
          >
            <span className="text-lg shrink-0">🏗️</span>
            <div className="flex-1 text-left min-w-0">
              <span className="text-[0.7rem] font-black uppercase tracking-wider" style={{ color: '#eeb849' }}>
                Ubuntu Build Fellowship
              </span>
              <span className="mx-2 text-[0.65rem]" style={{ color: 'rgba(255,248,231,0.25)' }}>·</span>
              <span className="text-[0.7rem] font-semibold" style={{ color: 'rgba(255,248,231,0.5)' }}>
                50 spots · $1,000 AI credits · Closes 30 June
              </span>
            </div>
            <span
              className="text-[0.7rem] font-black uppercase tracking-wider shrink-0 group-hover:translate-x-1 transition-transform"
              style={{ color: '#eeb849' }}
            >
              Apply →
            </span>
          </Link>

          <p className="text-[0.72rem] font-semibold" style={{ color: 'rgba(31,22,32,0.38)' }}>
            Free · No sign-up required for Forge · Governed AI · Abantu Bo Buntu NPC
          </p>
        </div>
      </section>

      {/* ─── LIVE STATS ─── */}
      <HomeStats />

      {/* ─── UBUNTU TOWN OS PLATFORM ─── */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <span className="inline-block text-[0.65rem] font-bold tracking-[0.1em] uppercase text-ubuntu-gold-dark bg-ubuntu-gold/[0.1] border border-ubuntu-gold/20 px-3 py-1 rounded-full mb-4">
          Platform 1
        </span>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Ubuntu Town OS
            </h2>
            <p className="text-ubuntu-text-muted max-w-[560px] leading-relaxed">
              A distributed operational coordination platform. Each of South Africa&apos;s 50 live towns gets a digital twin — real data, real coordinators, real opportunities. Signals become workpacks. Proof becomes town memory.
            </p>
          </div>
          <Link
            href="/enter"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all hover:-translate-y-0.5 whitespace-nowrap"
            style={{ background: '#eeb849', color: '#070509' }}
          >
            Enter Your Town →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {osFeatures.map((f) => (
            <div
              key={f.title}
              className="bg-ubuntu-card border border-ubuntu-border rounded-2xl p-6 hover:border-ubuntu-gold/50 transition-all"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h4 className="text-sm font-black mb-2">{f.title}</h4>
              <p className="text-[0.78rem] text-ubuntu-text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── KOPANO FORGE PLATFORM ─── */}
      <section
        className="py-20"
        style={{ background: 'linear-gradient(180deg, rgba(238,184,73,0.05) 0%, rgba(238,184,73,0.02) 100%)' }}
      >
        <div className="max-w-[1200px] mx-auto px-6">
          <span className="inline-block text-[0.65rem] font-bold tracking-[0.1em] uppercase text-ubuntu-gold-dark bg-ubuntu-gold/[0.1] border border-ubuntu-gold/20 px-3 py-1 rounded-full mb-4">
            Platform 2
          </span>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                🔨 Kopano Forge
              </h2>
              <p className="text-ubuntu-text-muted max-w-[560px] leading-relaxed">
                Make it on your phone. No airtime. No cost. No sign-up. Forge is a phone-first document creation tool for anyone in any South African town — SASSA appeals, CVs, letters, spaza posters, and more. Say it or type it. Export to PDF, Word, WhatsApp, or read it aloud.
              </p>
            </div>
            <a
              href="https://forge.ubuntutown.co.za"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all hover:-translate-y-0.5 whitespace-nowrap border-2"
              style={{ borderColor: '#eeb849', color: '#b98114', background: 'rgba(238,184,73,0.08)' }}
            >
              Open Forge →
            </a>
          </div>

          {/* Forge Tool Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {forgeTools.map((tool) => (
              <a
                key={tool.name}
                href="https://forge.ubuntutown.co.za"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-4 hover:border-ubuntu-gold/50 transition-all hover:-translate-y-0.5 text-center cursor-pointer"
              >
                <div className="text-xl mb-2">{tool.icon}</div>
                <div className="text-xs font-black mb-1">{tool.name}</div>
                <div className="text-[0.68rem] text-ubuntu-text-muted leading-snug">{tool.desc}</div>
              </a>
            ))}
          </div>

          {/* Forge feature pills */}
          <div className="flex flex-wrap gap-2">
            {[
              '📲 Works on any phone',
              '✈️ No airtime needed',
              '🔒 R0.00 cost',
              '📄 Export to PDF',
              '💬 Send via WhatsApp',
              '🔊 Read aloud',
              '📝 Word format',
              '🛡️ Cost Shield tracker',
              '🏘️ Community device mode',
            ].map((pill) => (
              <span
                key={pill}
                className="px-3 py-1.5 rounded-full text-[0.7rem] font-semibold border"
                style={{
                  borderColor: 'rgba(238,184,73,0.3)',
                  color: 'rgba(31,22,32,0.6)',
                  background: 'rgba(238,184,73,0.06)',
                }}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THE OPERATING LOOP ─── */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <span className="inline-block text-[0.65rem] font-bold tracking-[0.1em] uppercase text-ubuntu-gold-dark bg-ubuntu-gold/[0.1] border border-ubuntu-gold/20 px-3 py-1 rounded-full mb-4">
          How It Works
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          The Operating Loop
        </h2>
        <p className="text-ubuntu-text-muted max-w-[600px] leading-relaxed">
          Every town follows the same loop. Signals from the ground become structured work. Work produces proof. Proof builds town memory. Memory drives the next action.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-12">
          {flowSteps.map((step) => (
            <div key={step.num} className="text-center p-4 md:p-6">
              <div className="w-10 h-10 rounded-full bg-ubuntu-gold/10 border-2 border-ubuntu-gold flex items-center justify-center text-sm font-extrabold text-ubuntu-gold-dark mx-auto mb-4">
                {step.num}
              </div>
              <h4 className="text-sm font-bold mb-1">{step.title}</h4>
              <p className="text-[0.7rem] text-ubuntu-text-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BUILD FELLOWSHIP ─── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20">
        <div
          className="rounded-3xl p-10 md:p-14 relative overflow-hidden"
          style={{ background: '#070509', color: '#fff8e7' }}
        >
          {/* subtle glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 600px 300px at 60% 50%, rgba(238,184,73,0.08), transparent)',
            }}
          />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-[500px]">
              <span
                className="inline-block text-[0.65rem] font-bold tracking-[0.1em] uppercase px-3 py-1 rounded-full mb-4"
                style={{ background: 'rgba(238,184,73,0.15)', color: '#eeb849' }}
              >
                Ubuntu Build Fellowship · Cohort 1
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
                50 Towns. 50 Builders.
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,248,231,0.65)' }}>
                Join the Ubuntu Build Fellowship. Spend 4 weeks building on Ubuntu Town, then 4 weeks building your own AI product for your town.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                {[
                  '💰 $1,000 AI Credits',
                  '🧑‍💻 Expert Network',
                  '🤝 Co-Builds',
                  '🚀 Live Platform Access',
                  '📦 Distribution — 50 Towns',
                ].map((b) => (
                  <span
                    key={b}
                    className="text-[0.7rem] font-semibold px-3 py-1 rounded-full"
                    style={{ background: 'rgba(238,184,73,0.12)', color: '#eeb849' }}
                  >
                    {b}
                  </span>
                ))}
              </div>
              <p className="text-[0.72rem]" style={{ color: 'rgba(255,248,231,0.4)' }}>
                Fully funded · Free · Applications close 30 June · One builder per town
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Link
                href="/fellowship"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-black transition-all hover:-translate-y-0.5"
                style={{ background: '#eeb849', color: '#070509' }}
              >
                Apply Now →
              </Link>
              <a
                href="https://enter.ubuntutown.co.za/fellowship"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-[0.7rem] font-semibold"
                style={{ color: 'rgba(255,248,231,0.4)' }}
              >
                enter.ubuntutown.co.za/fellowship
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10 BRANDS ─── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20">
        <span className="inline-block text-[0.65rem] font-bold tracking-[0.1em] uppercase text-ubuntu-gold-dark bg-ubuntu-gold/[0.1] border border-ubuntu-gold/20 px-3 py-1 rounded-full mb-4">
          Ecosystem
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          10 Brands. One Town Stack.
        </h2>
        <p className="text-ubuntu-text-muted max-w-[600px] leading-relaxed">
          Each town activates the brands that match its demand. Not every brand in every town — fit-weighted activation based on coordinator strength and local opportunity.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
          {ecosystemBrands.map((brand) => (
            <div
              key={brand.name}
              className="bg-ubuntu-card border border-ubuntu-border rounded-2xl p-6 hover:border-ubuntu-gold/50 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="text-2xl mb-3">{brand.icon}</div>
              <h4 className="text-sm font-bold mb-1">{brand.name}</h4>
              <p className="text-[0.78rem] text-ubuntu-text-muted leading-relaxed">{brand.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TOWNS GRID ─── */}
      <div className="text-center py-20 border-t border-ubuntu-border">
        <span className="inline-block text-[0.65rem] font-bold tracking-[0.1em] uppercase text-ubuntu-gold-dark bg-ubuntu-gold/[0.1] border border-ubuntu-gold/20 px-3 py-1 rounded-full mb-4">
          <TownCount />
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          Enter Your Town
        </h2>
        <p className="text-ubuntu-text-muted max-w-[500px] mx-auto mb-8 leading-relaxed px-6">
          Select a town to see its digital twin — opportunities, businesses, services, signals, coordinators, and AI support.
        </p>
        <Link
          href="/towns"
          className="inline-block bg-ubuntu-gold hover:bg-ubuntu-gold-dark text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
        >
          Browse All Towns →
        </Link>
        <div className="flex flex-wrap gap-2 justify-center mt-8 max-w-[700px] mx-auto px-6">
          {featuredTowns.map((town) => (
            <Link
              key={town.slug}
              href={`/town/${town.slug}`}
              className="bg-ubuntu-card border border-ubuntu-border px-4 py-1.5 rounded-full text-xs text-ubuntu-text-muted hover:border-ubuntu-gold hover:text-ubuntu-gold-dark transition-all"
            >
              {town.name}
            </Link>
          ))}
          <span className="px-4 py-1.5 rounded-full text-xs text-ubuntu-gold-dark border border-ubuntu-gold/30">
            +38 more
          </span>
        </div>
      </div>

      {/* ─── COORDINATOR CTA ─── */}
      <section className="max-w-[800px] mx-auto px-6 pb-20">
        <div className="bg-ubuntu-card border border-ubuntu-border rounded-2xl p-12 text-center">
          <span className="inline-block text-[0.65rem] font-bold tracking-[0.1em] uppercase text-ubuntu-gold-dark bg-ubuntu-gold/[0.1] border border-ubuntu-gold/20 px-3 py-1 rounded-full mb-4">
            Become a Coordinator
          </span>
          <h3 className="text-2xl font-extrabold mb-3">Make Your Town Visible</h3>
          <p className="text-ubuntu-text-muted mb-8 leading-relaxed max-w-[500px] mx-auto">
            Whether you&apos;re an entrepreneur, community leader, or someone mapping demand — Ubuntu Town needs people who build.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/apply"
              className="bg-ubuntu-gold hover:bg-ubuntu-gold-dark text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all"
            >
              Apply to Become a Coordinator
            </Link>
            <Link
              href="/about"
              className="border border-ubuntu-border hover:border-ubuntu-gold text-ubuntu-text-muted hover:text-ubuntu-gold-dark px-8 py-3.5 rounded-xl font-semibold text-sm transition-all"
            >
              About Ubuntu Town
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
