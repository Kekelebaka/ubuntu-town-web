'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export const runtime = 'edge';



const PROVINCES: Record<string, { towns: string[]; spots: number }> = {
  'Free State': {
    spots: 10,
    towns: [
      'Bethlehem', 'Bloemfontein', 'Botshabelo', 'Ficksburg', 'Harrismith',
      'Kroonstad', 'Ladybrand', 'Phuthaditjhaba', 'Senekal', 'Welkom',
    ],
  },
  'KwaZulu-Natal': {
    spots: 8,
    towns: [
      'Durban', 'Greytown', 'Harding', 'Kokstad',
      'Newcastle', 'Nquthu', 'Pietermaritzburg', 'Richards Bay',
    ],
  },
  'Gauteng': {
    spots: 6,
    towns: [
      'Carletonville', 'Ekurhuleni', 'Johannesburg',
      'Kempton Park', 'Pretoria', 'Vanderbijlpark',
    ],
  },
  'Mpumalanga': {
    spots: 6,
    towns: [
      'Acornhoek', 'Bushbuckridge', 'Emalahleni',
      'Nelspruit', 'Sabie', 'Witbank',
    ],
  },
  'Eastern Cape': {
    spots: 4,
    towns: ['East London', 'Gqeberha', 'Matatiele', 'Mthatha'],
  },
  'Limpopo': {
    spots: 4,
    towns: ['Burgersfort', 'Mokopane', 'Polokwane', 'Thohoyandou'],
  },
  'Northern Cape': {
    spots: 4,
    towns: ['De Aar', 'Kimberley', 'Springbok', 'Upington'],
  },
  'North West': {
    spots: 4,
    towns: ['Brits', 'Klerksdorp', 'Mafikeng', 'Rustenburg'],
  },
  'Western Cape': {
    spots: 4,
    towns: ['Cape Town', 'George', 'Paarl', 'Stellenbosch'],
  },
};

const BENEFITS = [
  {
    icon: '🧰',
    title: '$1 000 in Cloud Credits',
    desc: 'AWS, Vercel, Supabase, Cloudflare – real infrastructure, zero upfront cost.',
  },
  {
    icon: '🧭',
    title: 'Weekly Live Mentorship',
    desc: '8 weeks of live group sessions with builders who have shipped real products.',
  },
  {
    icon: '🌍',
    title: 'Ubuntu Town Network',
    desc: 'Join 50 builders across 9 provinces. Collaborate, swap ideas, grow together.',
  },
  {
    icon: '🚀',
    title: 'Launch on Enter',
    desc: 'Your finished product gets a listing on enter.ubuntutown.co.za at cohort close.',
  },
  {
    icon: '🏆',
    title: 'Provincial Showcase',
    desc: 'Top builders in each province present to local investors and community leaders.',
  },
  {
    icon: '📜',
    title: 'Ubuntu Builder Certificate',
    desc: 'Verifiable proof that you shipped a real product solving a real local problem.',
  },
];

const STEPS = [
  { num: '01', title: 'Apply', desc: 'Fill in the form below. Tell us your town, your problem, and your idea.' },
  { num: '02', title: 'Get Shortlisted', desc: 'We review every application. One builder per town.' },
  { num: '03', title: 'Onboard', desc: 'Receive your $1K credits pack and join the cohort kick-off call.' },
  { num: '04', title: 'Build for 8 Weeks', desc: 'Weekly sessions, async Slack support, peer accountability.' },
  { num: '05', title: 'Launch & Showcase', desc: 'Demo day. Your product goes live. Ubuntu Town amplifies your story.' },
];

const VALUES = [
  'Ubuntu First', 'Shipped > Perfect', 'Local Knowledge = Power',
  'Open by Default', 'One Town, One Builder', 'Rise Together',
];

type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'non-technical';

interface FormData {
  full_name: string;
  email: string;
  whatsapp: string;
  town_slug: string;
  location: string;
  town_connection: string;
  town_challenge: string;
  build_idea: string;
  skill_level: SkillLevel | '';
  commit: boolean;
}

function townToSlug(town: string): string {
  return town.toLowerCase().replace(/\s+/g, '-');
}

export default function FellowshipPage() {
  const [form, setForm] = useState<FormData>({
    full_name: '',
    email: '',
    whatsapp: '',
    town_slug: '',
    location: '',
    town_connection: '',
    town_challenge: '',
    build_idea: '',
    skill_level: '',
    commit: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function handleTownChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    // val is slug, find display name
    let displayName = '';
    for (const province of Object.values(PROVINCES)) {
      for (const town of province.towns) {
        if (townToSlug(town) === val) {
          displayName = town;
          break;
        }
      }
      if (displayName) break;
    }
    setForm(f => ({ ...f, town_slug: val, location: displayName }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.skill_level) { setError('Please select your skill level.'); return; }
    if (!form.commit) { setError('Please confirm your commitment.'); return; }
    setSubmitting(true);
    const { error: dbError } = await supabase.from('builder_applications').insert({
      full_name: form.full_name,
      email: form.email,
      whatsapp: form.whatsapp || null,
      town_slug: form.town_slug,
      location: form.location,
      town_connection: form.town_connection,
      town_challenge: form.town_challenge,
      build_idea: form.build_idea,
      skill_level: form.skill_level,
      status: 'pending',
    });
    setSubmitting(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      setSubmitted(true);
    }
  }

  return (
    <>
      <style>{`
        :root {
          --dark: #070509;
          --purple: #7649bc;
          --gold: #eeb849;
          --orange: #f5a340;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--dark); color: #e8e0f5; font-family: 'Inter', system-ui, sans-serif; }

        /* NAV */
        .nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(7,5,9,0.92); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(118,73,188,0.25);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.75rem 2rem; gap: 1rem;
        }
        .nav-brand { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
        .nav-logo { width: 40px; height: 40px; border-radius: 8px; object-fit: contain; }
        .nav-title { font-weight: 700; font-size: 1rem; color: #fff; line-height: 1.2; }
        .nav-subtitle { font-size: 0.7rem; color: var(--gold); letter-spacing: 0.08em; text-transform: uppercase; }
        .nav-cta {
          background: var(--purple); color: #fff;
          border: none; border-radius: 8px;
          padding: 0.55rem 1.25rem; font-weight: 700; font-size: 0.875rem;
          cursor: pointer; text-decoration: none; white-space: nowrap;
          transition: background 0.2s;
        }
        .nav-cta:hover { background: #8f5ed4; }

        /* HERO */
        .hero {
          position: relative; min-height: 90vh;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0;
          background-image: url('https://hyperagent.com/api/files/usergenerated/threads/cmqrs5lxy023c07ad4y7rgbsc/images/45ad8932-0716-4092-b067-10a962c72195.png');
          background-size: cover; background-position: center;
        }
        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(7,5,9,0.88) 0%, rgba(118,73,188,0.35) 60%, rgba(7,5,9,0.92) 100%);
        }
        .hero-content {
          position: relative; z-index: 1;
          max-width: 820px; margin: 0 auto;
          padding: 5rem 2rem; text-align: center;
        }
        .hero-badge {
          display: inline-block;
          background: rgba(118,73,188,0.3); border: 1px solid var(--purple);
          color: var(--gold); font-size: 0.75rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 0.35rem 1rem; border-radius: 99px; margin-bottom: 1.5rem;
        }
        .hero-h1 {
          font-size: clamp(2.5rem, 8vw, 5.5rem);
          font-weight: 900; letter-spacing: -0.02em; line-height: 1;
          color: #fff; margin-bottom: 0.5rem;
        }
        .hero-h1 span { color: var(--gold); }
        .hero-h2 {
          font-size: clamp(1.1rem, 3vw, 1.6rem);
          font-weight: 600; color: var(--purple);
          letter-spacing: 0.05em; margin-bottom: 2rem;
        }
        .hero-bullets {
          list-style: none; display: flex; flex-direction: column; gap: 0.6rem;
          align-items: flex-start; max-width: 480px; margin: 0 auto 2.5rem;
          text-align: left;
        }
        .hero-bullets li { display: flex; align-items: center; gap: 0.6rem; font-size: 1rem; color: #d4c8ee; }
        .hero-bullets li::before { content: '✦'; color: var(--gold); font-size: 0.7rem; flex-shrink: 0; }
        .hero-callout {
          display: inline-block;
          background: var(--purple); color: #fff;
          font-size: 1.3rem; font-weight: 800; letter-spacing: 0.04em;
          padding: 0.7rem 2rem; border-radius: 12px; margin-bottom: 2.5rem;
        }
        .hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .btn-primary {
          background: var(--gold); color: var(--dark);
          border: none; border-radius: 10px;
          padding: 0.85rem 2.2rem; font-weight: 800; font-size: 1rem;
          cursor: pointer; text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .btn-primary:hover { background: #f5c96a; transform: translateY(-1px); }
        .btn-secondary {
          background: transparent; color: #fff;
          border: 2px solid rgba(255,255,255,0.3); border-radius: 10px;
          padding: 0.85rem 2.2rem; font-weight: 700; font-size: 1rem;
          cursor: pointer; text-decoration: none;
          transition: border-color 0.2s;
        }
        .btn-secondary:hover { border-color: var(--purple); }

        /* STATS STRIP */
        .stats-strip {
          background: var(--purple);
          display: flex; flex-wrap: wrap; justify-content: center; gap: 0;
        }
        .stat-item {
          flex: 1; min-width: 120px; max-width: 220px;
          padding: 1.5rem 1rem; text-align: center;
          border-right: 1px solid rgba(255,255,255,0.15);
        }
        .stat-item:last-child { border-right: none; }
        .stat-num { font-size: 2.2rem; font-weight: 900; color: var(--gold); line-height: 1; }
        .stat-label { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.8); letter-spacing: 0.06em; text-transform: uppercase; margin-top: 0.25rem; }

        /* SECTIONS */
        .section { padding: 5rem 2rem; max-width: 1100px; margin: 0 auto; }
        .section-sm { padding: 3rem 2rem; max-width: 1100px; margin: 0 auto; }
        .section-title {
          font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 800;
          color: #fff; margin-bottom: 0.5rem;
        }
        .section-title span { color: var(--gold); }
        .section-sub { color: #a898cc; font-size: 1rem; margin-bottom: 2.5rem; }
        .divider { border: none; border-top: 1px solid rgba(118,73,188,0.25); margin: 0; }

        /* PROVINCE GRID */
        .province-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.25rem;
        }
        .province-card {
          background: rgba(118,73,188,0.1); border: 1px solid rgba(118,73,188,0.25);
          border-radius: 14px; padding: 1.25rem;
          transition: border-color 0.2s, background 0.2s;
        }
        .province-card:hover { border-color: var(--purple); background: rgba(118,73,188,0.18); }
        .province-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .province-name { font-weight: 700; color: #fff; font-size: 0.95rem; }
        .province-spots {
          background: var(--gold); color: var(--dark);
          font-size: 0.7rem; font-weight: 800; letter-spacing: 0.06em;
          padding: 0.2rem 0.5rem; border-radius: 6px;
        }
        .province-towns { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .town-tag {
          background: rgba(255,255,255,0.07); color: #c4b8e0;
          font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 6px;
        }

        /* BENEFITS GRID */
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .benefit-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(118,73,188,0.2);
          border-radius: 16px; padding: 1.75rem;
          transition: border-color 0.2s, transform 0.2s;
        }
        .benefit-card:hover { border-color: var(--purple); transform: translateY(-2px); }
        .benefit-icon { font-size: 2rem; margin-bottom: 0.75rem; }
        .benefit-title { font-weight: 700; color: #fff; margin-bottom: 0.4rem; }
        .benefit-desc { color: #a898cc; font-size: 0.9rem; line-height: 1.55; }

        /* JOURNEY STEPS */
        .steps-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .step-row { display: flex; gap: 1.25rem; align-items: flex-start; }
        .step-num {
          flex-shrink: 0; width: 48px; height: 48px;
          background: var(--purple); border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 1rem; color: #fff;
        }
        .step-body {}
        .step-title { font-weight: 700; color: #fff; margin-bottom: 0.2rem; }
        .step-desc { color: #a898cc; font-size: 0.9rem; line-height: 1.5; }

        /* 50/50 STRUCTURE */
        .split-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;
        }
        @media (max-width: 640px) { .split-grid { grid-template-columns: 1fr; } }
        .split-col {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(118,73,188,0.2);
          border-radius: 16px; padding: 1.75rem;
        }
        .split-col-title { font-size: 1.1rem; font-weight: 800; color: var(--gold); margin-bottom: 1rem; }
        .split-list { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; }
        .split-list li { display: flex; gap: 0.5rem; color: #c4b8e0; font-size: 0.9rem; line-height: 1.5; }
        .split-list li::before { content: '→'; color: var(--purple); flex-shrink: 0; }

        /* FORM */
        .form-wrapper {
          background: rgba(118,73,188,0.08); border: 1px solid rgba(118,73,188,0.3);
          border-radius: 20px; padding: 2.5rem;
          max-width: 680px; margin: 0 auto;
        }
        .form-title { font-size: 1.6rem; font-weight: 800; color: #fff; margin-bottom: 0.4rem; }
        .form-sub { color: #a898cc; font-size: 0.9rem; margin-bottom: 2rem; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        @media (max-width: 560px) { .form-grid { grid-template-columns: 1fr; } }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-group.full { grid-column: 1 / -1; }
        .form-label { font-size: 0.82rem; font-weight: 600; color: #c4b8e0; letter-spacing: 0.04em; text-transform: uppercase; }
        .form-input, .form-select, .form-textarea {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(118,73,188,0.4);
          border-radius: 10px; color: #fff; font-size: 0.95rem; padding: 0.7rem 0.9rem;
          outline: none; transition: border-color 0.2s;
          font-family: inherit;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--purple); }
        .form-textarea { resize: vertical; min-height: 90px; }
        .form-select option { background: #1a1030; }
        .form-select optgroup { background: #1a1030; font-weight: 700; color: var(--gold); }
        .skill-toggles { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .skill-btn {
          padding: 0.45rem 1rem; border-radius: 8px; border: 1px solid rgba(118,73,188,0.4);
          background: transparent; color: #c4b8e0; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
          font-family: inherit;
        }
        .skill-btn.active { background: var(--purple); border-color: var(--purple); color: #fff; }
        .commit-row { display: flex; gap: 0.7rem; align-items: flex-start; }
        .commit-cb { width: 18px; height: 18px; margin-top: 2px; accent-color: var(--purple); flex-shrink: 0; cursor: pointer; }
        .commit-label { color: #c4b8e0; font-size: 0.88rem; line-height: 1.5; }
        .form-error { color: #f87171; font-size: 0.85rem; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); border-radius: 8px; padding: 0.6rem 0.9rem; }
        .form-submit {
          width: 100%; padding: 0.9rem; font-size: 1rem; font-weight: 800;
          background: var(--gold); color: var(--dark); border: none; border-radius: 12px;
          cursor: pointer; transition: background 0.2s, transform 0.15s;
          font-family: inherit;
        }
        .form-submit:hover:not(:disabled) { background: #f5c96a; transform: translateY(-1px); }
        .form-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .success-box {
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.4);
          border-radius: 16px; padding: 2.5rem; text-align: center;
        }
        .success-icon { font-size: 3rem; margin-bottom: 1rem; }
        .success-title { font-size: 1.5rem; font-weight: 800; color: #4ade80; margin-bottom: 0.5rem; }
        .success-sub { color: #a898cc; font-size: 0.95rem; }

        /* VALUES BAR */
        .values-bar {
          background: rgba(118,73,188,0.12); border-top: 1px solid rgba(118,73,188,0.2);
          border-bottom: 1px solid rgba(118,73,188,0.2);
          padding: 1.25rem 2rem;
          display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem 2rem;
        }
        .value-item { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); }
        .value-sep { color: var(--purple); }

        /* FOOTER */
        .footer {
          padding: 3rem 2rem; text-align: center;
          border-top: 1px solid rgba(118,73,188,0.2);
        }
        .footer-logo { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 1rem; }
        .footer-logo img { width: 36px; height: 36px; border-radius: 8px; }
        .footer-brand { font-weight: 700; color: #fff; }
        .footer-tagline { color: var(--purple); font-style: italic; font-size: 0.95rem; margin-bottom: 0.75rem; }
        .footer-links { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; }
        .footer-links a { color: #a898cc; text-decoration: none; font-size: 0.85rem; }
        .footer-links a:hover { color: var(--gold); }
        .footer-copy { color: #4a3d6b; font-size: 0.78rem; margin-top: 1.25rem; }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <a href="https://enter.ubuntutown.co.za" className="nav-brand">
          <img
            src="https://pub.hyperagent.com/api/published/pbf01KVWAG70R_DRE74TATERK2M2WA/2d51851a-429c-4abb-af4f-4f00b80b4942.png"
            alt="Ubuntu Town"
            className="nav-logo"
          />
          <div>
            <div className="nav-title">Ubuntu Town</div>
            <div className="nav-subtitle">Build Fellowship</div>
          </div>
        </a>
        <a href="#apply" className="nav-cta">Apply Now</a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badge">Cohort 1 — Now Open</div>
          <h1 className="hero-h1">
            <span>50</span> TOWNS.<br /><span>50</span> BUILDERS.
          </h1>
          <p className="hero-h2">Ubuntu Build Fellowship</p>
          <ul className="hero-bullets">
            <li>One builder selected per town, across all 9 provinces</li>
            <li>$1 000 in cloud credits — AWS, Vercel, Supabase, Cloudflare</li>
            <li>8 weeks of live mentorship and peer accountability</li>
            <li>Build something real for your community</li>
            <li>No experience required — just hunger and a real problem</li>
          </ul>
          <div className="hero-callout">You in. We rise.</div>
          <div className="hero-actions">
            <a href="#apply" className="btn-primary">Apply for Your Town</a>
            <a href="#how-it-works" className="btn-secondary">How It Works</a>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <div className="stats-strip">
        {[
          { num: '50', label: 'Towns' },
          { num: '9', label: 'Provinces' },
          { num: '$1K', label: 'Credits Each' },
          { num: '8', label: 'Weeks' },
          { num: 'Free', label: 'To Apply' },
        ].map(s => (
          <div className="stat-item" key={s.label}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <hr className="divider" />

      {/* PROVINCE GRID */}
      <div className="section">
        <h2 className="section-title">
          9 Provinces. <span>50 Spots.</span>
        </h2>
        <p className="section-sub">One builder per town. Is yours still available?</p>
        <div className="province-grid">
          {Object.entries(PROVINCES).map(([province, data]) => (
            <div className="province-card" key={province}>
              <div className="province-card-header">
                <span className="province-name">{province}</span>
                <span className="province-spots">{data.spots} spots</span>
              </div>
              <div className="province-towns">
                {data.towns.map(town => (
                  <span className="town-tag" key={town}>{town}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="divider" />

      {/* BENEFITS */}
      <div className="section">
        <h2 className="section-title">
          What You <span>Get</span>
        </h2>
        <p className="section-sub">Real resources. Real mentorship. Real community.</p>
        <div className="benefits-grid">
          {BENEFITS.map(b => (
            <div className="benefit-card" key={b.title}>
              <div className="benefit-icon">{b.icon}</div>
              <div className="benefit-title">{b.title}</div>
              <div className="benefit-desc">{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <hr className="divider" />

      {/* JOURNEY */}
      <div id="how-it-works" className="section">
        <h2 className="section-title">
          The <span>Journey</span>
        </h2>
        <p className="section-sub">From application to launch in 5 steps.</p>
        <div className="steps-list">
          {STEPS.map(s => (
            <div className="step-row" key={s.num}>
              <div className="step-num">{s.num}</div>
              <div className="step-body">
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="divider" />

      {/* 50/50 STRUCTURE */}
      <div className="section">
        <h2 className="section-title">
          The <span>50/50</span> Structure
        </h2>
        <p className="section-sub">We invest in you. You invest in your town.</p>
        <div className="split-grid">
          <div className="split-col">
            <div className="split-col-title">We Bring</div>
            <ul className="split-list">
              <li>$1 000 in verified cloud credits</li>
              <li>Weekly group mentorship calls</li>
              <li>Ubuntu Town builder network access</li>
              <li>Product listing on enter.ubuntutown.co.za</li>
              <li>Provincial showcase opportunity</li>
              <li>Ubuntu Builder Certificate on completion</li>
            </ul>
          </div>
          <div className="split-col">
            <div className="split-col-title">You Bring</div>
            <ul className="split-list">
              <li>A real problem from your town</li>
              <li>8 weeks of consistent commitment</li>
              <li>Weekly check-ins and progress updates</li>
              <li>Openness to feedback and iteration</li>
              <li>A willingness to share learnings publicly</li>
              <li>Ubuntu spirit — rise by lifting others</li>
            </ul>
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* APPLICATION FORM */}
      <div id="apply" className="section">
        <h2 className="section-title" style={{ textAlign: 'center' }}>
          Apply for <span>Your Town</span>
        </h2>
        <p className="section-sub" style={{ textAlign: 'center' }}>
          One builder per town. Applications close when a town is filled.
        </p>

        {submitted ? (
          <div className="form-wrapper">
            <div className="success-box">
              <div className="success-icon">🌍</div>
              <div className="success-title">Application Received!</div>
              <p className="success-sub">
                Thank you, {form.full_name}. We received your application for {form.location}.
                We review every submission and will be in touch within 7 days.
                Ubuntu: I am because we are.
              </p>
            </div>
          </div>
        ) : (
          <div className="form-wrapper">
            <div className="form-title">Your Application</div>
            <p className="form-sub">All fields required unless marked optional.</p>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Full name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="full_name">Full Name</label>
                  <input
                    id="full_name"
                    className="form-input"
                    type="text"
                    required
                    placeholder="Your full name"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    className="form-input"
                    type="email"
                    required
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>

                {/* WhatsApp */}
                <div className="form-group">
                  <label className="form-label" htmlFor="whatsapp">WhatsApp (optional)</label>
                  <input
                    id="whatsapp"
                    className="form-input"
                    type="tel"
                    placeholder="+27 XX XXX XXXX"
                    value={form.whatsapp}
                    onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                  />
                </div>

                {/* Town */}
                <div className="form-group">
                  <label className="form-label" htmlFor="town_slug">Your Town</label>
                  <select
                    id="town_slug"
                    className="form-select"
                    required
                    value={form.town_slug}
                    onChange={handleTownChange}
                  >
                    <option value="">— Select a town —</option>
                    {Object.entries(PROVINCES).map(([province, data]) => (
                      <optgroup key={province} label={`${province} (${data.spots} spots)`}>
                        {data.towns.map(town => (
                          <option key={town} value={townToSlug(town)}>{town}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Town connection */}
                <div className="form-group full">
                  <label className="form-label" htmlFor="town_connection">How are you connected to this town?</label>
                  <input
                    id="town_connection"
                    className="form-input"
                    type="text"
                    required
                    placeholder="e.g. Born and raised there, currently living there, family roots..."
                    value={form.town_connection}
                    onChange={e => setForm(f => ({ ...f, town_connection: e.target.value }))}
                  />
                </div>

                {/* Town challenge */}
                <div className="form-group full">
                  <label className="form-label" htmlFor="town_challenge">Biggest challenge facing your town</label>
                  <textarea
                    id="town_challenge"
                    className="form-textarea"
                    required
                    placeholder="Describe the problem in your town that you want to solve..."
                    value={form.town_challenge}
                    onChange={e => setForm(f => ({ ...f, town_challenge: e.target.value }))}
                  />
                </div>

                {/* Build idea */}
                <div className="form-group full">
                  <label className="form-label" htmlFor="build_idea">What do you want to build?</label>
                  <textarea
                    id="build_idea"
                    className="form-textarea"
                    required
                    placeholder="Describe the product, tool, or service you want to create during the fellowship..."
                    value={form.build_idea}
                    onChange={e => setForm(f => ({ ...f, build_idea: e.target.value }))}
                  />
                </div>

                {/* Skill level */}
                <div className="form-group full">
                  <label className="form-label">Skill Level</label>
                  <div className="skill-toggles">
                    {(['beginner', 'intermediate', 'advanced', 'non-technical'] as SkillLevel[]).map(level => (
                      <button
                        type="button"
                        key={level}
                        className={`skill-btn${form.skill_level === level ? ' active' : ''}`}
                        onClick={() => setForm(f => ({ ...f, skill_level: level }))}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commitment */}
                <div className="form-group full">
                  <div className="commit-row">
                    <input
                      id="commit"
                      className="commit-cb"
                      type="checkbox"
                      checked={form.commit}
                      onChange={e => setForm(f => ({ ...f, commit: e.target.checked }))}
                    />
                    <label htmlFor="commit" className="commit-label">
                      I commit to attending at least 6 of 8 weekly sessions, shipping a working product,
                      and representing my town with Ubuntu spirit.
                    </label>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="form-group full">
                    <div className="form-error">{error}</div>
                  </div>
                )}

                {/* Submit */}
                <div className="form-group full">
                  <button type="submit" className="form-submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit My Application →'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* VALUES BAR */}
      <div className="values-bar">
        {VALUES.map((v, i) => (
          <span key={v}>
            <span className="value-item">{v}</span>
            {i < VALUES.length - 1 && <span className="value-sep"> · </span>}
          </span>
        ))}
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">
          <img
            src="https://pub.hyperagent.com/api/published/pbf01KVWAG70R_DRE74TATERK2M2WA/2d51851a-429c-4abb-af4f-4f00b80b4942.png"
            alt="Ubuntu Town"
          />
          <span className="footer-brand">Ubuntu Town</span>
        </div>
        <p className="footer-tagline">"Ubuntu: I am because we are."</p>
        <div className="footer-links">
          <a href="https://enter.ubuntutown.co.za">Enter</a>
          <a href="/fellowship">Fellowship</a>
          <a href="/about">About</a>
        </div>
        <p className="footer-copy">
          © {new Date().getFullYear()} Ubuntu Town. Built with Ubuntu spirit.
        </p>
      </footer>
    </>
  );
}
