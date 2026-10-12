(()=>{var a={};a.id=6662,a.ids=[6662],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},26713:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/is-bot")},27910:a=>{"use strict";a.exports=require("stream")},28354:a=>{"use strict";a.exports=require("util")},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:a=>{"use strict";a.exports=require("path")},36377:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>l});var d=c(42140),e=c(14373),f=c(6e4);let g={"Free State":{spots:10,towns:["Bethlehem","Bloemfontein","Botshabelo","Ficksburg","Harrismith","Kroonstad","Ladybrand","Phuthaditjhaba","Senekal","Welkom"]},"KwaZulu-Natal":{spots:8,towns:["Durban","Greytown","Harding","Kokstad","Newcastle","Nquthu","Pietermaritzburg","Richards Bay"]},Gauteng:{spots:6,towns:["Carletonville","Ekurhuleni","Johannesburg","Kempton Park","Pretoria","Vanderbijlpark"]},Mpumalanga:{spots:6,towns:["Acornhoek","Bushbuckridge","Emalahleni","Nelspruit","Sabie","Witbank"]},"Eastern Cape":{spots:4,towns:["East London","Gqeberha","Matatiele","Mthatha"]},Limpopo:{spots:4,towns:["Burgersfort","Mokopane","Polokwane","Thohoyandou"]},"Northern Cape":{spots:4,towns:["De Aar","Kimberley","Springbok","Upington"]},"North West":{spots:4,towns:["Brits","Klerksdorp","Mafikeng","Rustenburg"]},"Western Cape":{spots:4,towns:["Cape Town","George","Paarl","Stellenbosch"]}},h=[{icon:"\uD83E\uDDF0",title:"$1 000 in Cloud Credits",desc:"AWS, Vercel, Supabase, Cloudflare – real infrastructure, zero upfront cost."},{icon:"\uD83E\uDDED",title:"Weekly Live Mentorship",desc:"8 weeks of live group sessions with builders who have shipped real products."},{icon:"\uD83C\uDF0D",title:"Ubuntu Town Network",desc:"Join 50 builders across 9 provinces. Collaborate, swap ideas, grow together."},{icon:"\uD83D\uDE80",title:"Launch on Enter",desc:"Your finished product gets a listing on enter.ubuntutown.co.za at cohort close."},{icon:"\uD83C\uDFC6",title:"Provincial Showcase",desc:"Top builders in each province present to local investors and community leaders."},{icon:"\uD83D\uDCDC",title:"Ubuntu Builder Certificate",desc:"Verifiable proof that you shipped a real product solving a real local problem."}],i=[{num:"01",title:"Apply",desc:"Fill in the form below. Tell us your town, your problem, and your idea."},{num:"02",title:"Get Shortlisted",desc:"We review every application. One builder per town."},{num:"03",title:"Onboard",desc:"Receive your $1K credits pack and join the cohort kick-off call."},{num:"04",title:"Build for 8 Weeks",desc:"Weekly sessions, async Slack support, peer accountability."},{num:"05",title:"Launch & Showcase",desc:"Demo day. Your product goes live. Ubuntu Town amplifies your story."}],j=["Ubuntu First","Shipped > Perfect","Local Knowledge = Power","Open by Default","One Town, One Builder","Rise Together"];function k(a){return a.toLowerCase().replace(/\s+/g,"-")}function l(){let[a,b]=(0,e.useState)({full_name:"",email:"",whatsapp:"",town_slug:"",location:"",town_connection:"",town_challenge:"",build_idea:"",skill_level:"",commit:!1}),[c,l]=(0,e.useState)(!1),[m,n]=(0,e.useState)(!1),[o,p]=(0,e.useState)("");async function q(b){if(b.preventDefault(),p(""),!a.skill_level)return void p("Please select your skill level.");if(!a.commit)return void p("Please confirm your commitment.");l(!0);let{error:c}=await f.N.from("builder_applications").insert({full_name:a.full_name,email:a.email,whatsapp:a.whatsapp||null,town_slug:a.town_slug,location:a.location,town_connection:a.town_connection,town_challenge:a.town_challenge,build_idea:a.build_idea,skill_level:a.skill_level,status:"pending"});l(!1),c?p(c.message):n(!0)}return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("style",{children:`
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
      `}),(0,d.jsxs)("nav",{className:"nav",children:[(0,d.jsxs)("a",{href:"https://enter.ubuntutown.co.za",className:"nav-brand",children:[(0,d.jsx)("img",{src:"https://pub.hyperagent.com/api/published/pbf01KVWAG70R_DRE74TATERK2M2WA/2d51851a-429c-4abb-af4f-4f00b80b4942.png",alt:"Ubuntu Town",className:"nav-logo"}),(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{className:"nav-title",children:"Ubuntu Town"}),(0,d.jsx)("div",{className:"nav-subtitle",children:"Build Fellowship"})]})]}),(0,d.jsx)("a",{href:"#apply",className:"nav-cta",children:"Apply Now"})]}),(0,d.jsxs)("section",{className:"hero",children:[(0,d.jsx)("div",{className:"hero-bg"}),(0,d.jsx)("div",{className:"hero-overlay"}),(0,d.jsxs)("div",{className:"hero-content",children:[(0,d.jsx)("div",{className:"hero-badge",children:"Cohort 1 — Now Open"}),(0,d.jsxs)("h1",{className:"hero-h1",children:[(0,d.jsx)("span",{children:"50"})," TOWNS.",(0,d.jsx)("br",{}),(0,d.jsx)("span",{children:"50"})," BUILDERS."]}),(0,d.jsx)("p",{className:"hero-h2",children:"Ubuntu Build Fellowship"}),(0,d.jsxs)("ul",{className:"hero-bullets",children:[(0,d.jsx)("li",{children:"One builder selected per town, across all 9 provinces"}),(0,d.jsx)("li",{children:"$1 000 in cloud credits — AWS, Vercel, Supabase, Cloudflare"}),(0,d.jsx)("li",{children:"8 weeks of live mentorship and peer accountability"}),(0,d.jsx)("li",{children:"Build something real for your community"}),(0,d.jsx)("li",{children:"No experience required — just hunger and a real problem"})]}),(0,d.jsx)("div",{className:"hero-callout",children:"You in. We rise."}),(0,d.jsxs)("div",{className:"hero-actions",children:[(0,d.jsx)("a",{href:"#apply",className:"btn-primary",children:"Apply for Your Town"}),(0,d.jsx)("a",{href:"#how-it-works",className:"btn-secondary",children:"How It Works"})]})]})]}),(0,d.jsx)("div",{className:"stats-strip",children:[{num:"50",label:"Towns"},{num:"9",label:"Provinces"},{num:"$1K",label:"Credits Each"},{num:"8",label:"Weeks"},{num:"Free",label:"To Apply"}].map(a=>(0,d.jsxs)("div",{className:"stat-item",children:[(0,d.jsx)("div",{className:"stat-num",children:a.num}),(0,d.jsx)("div",{className:"stat-label",children:a.label})]},a.label))}),(0,d.jsx)("hr",{className:"divider"}),(0,d.jsxs)("div",{className:"section",children:[(0,d.jsxs)("h2",{className:"section-title",children:["9 Provinces. ",(0,d.jsx)("span",{children:"50 Spots."})]}),(0,d.jsx)("p",{className:"section-sub",children:"One builder per town. Is yours still available?"}),(0,d.jsx)("div",{className:"province-grid",children:Object.entries(g).map(([a,b])=>(0,d.jsxs)("div",{className:"province-card",children:[(0,d.jsxs)("div",{className:"province-card-header",children:[(0,d.jsx)("span",{className:"province-name",children:a}),(0,d.jsxs)("span",{className:"province-spots",children:[b.spots," spots"]})]}),(0,d.jsx)("div",{className:"province-towns",children:b.towns.map(a=>(0,d.jsx)("span",{className:"town-tag",children:a},a))})]},a))})]}),(0,d.jsx)("hr",{className:"divider"}),(0,d.jsxs)("div",{className:"section",children:[(0,d.jsxs)("h2",{className:"section-title",children:["What You ",(0,d.jsx)("span",{children:"Get"})]}),(0,d.jsx)("p",{className:"section-sub",children:"Real resources. Real mentorship. Real community."}),(0,d.jsx)("div",{className:"benefits-grid",children:h.map(a=>(0,d.jsxs)("div",{className:"benefit-card",children:[(0,d.jsx)("div",{className:"benefit-icon",children:a.icon}),(0,d.jsx)("div",{className:"benefit-title",children:a.title}),(0,d.jsx)("div",{className:"benefit-desc",children:a.desc})]},a.title))})]}),(0,d.jsx)("hr",{className:"divider"}),(0,d.jsxs)("div",{id:"how-it-works",className:"section",children:[(0,d.jsxs)("h2",{className:"section-title",children:["The ",(0,d.jsx)("span",{children:"Journey"})]}),(0,d.jsx)("p",{className:"section-sub",children:"From application to launch in 5 steps."}),(0,d.jsx)("div",{className:"steps-list",children:i.map(a=>(0,d.jsxs)("div",{className:"step-row",children:[(0,d.jsx)("div",{className:"step-num",children:a.num}),(0,d.jsxs)("div",{className:"step-body",children:[(0,d.jsx)("div",{className:"step-title",children:a.title}),(0,d.jsx)("div",{className:"step-desc",children:a.desc})]})]},a.num))})]}),(0,d.jsx)("hr",{className:"divider"}),(0,d.jsxs)("div",{className:"section",children:[(0,d.jsxs)("h2",{className:"section-title",children:["The ",(0,d.jsx)("span",{children:"50/50"})," Structure"]}),(0,d.jsx)("p",{className:"section-sub",children:"We invest in you. You invest in your town."}),(0,d.jsxs)("div",{className:"split-grid",children:[(0,d.jsxs)("div",{className:"split-col",children:[(0,d.jsx)("div",{className:"split-col-title",children:"We Bring"}),(0,d.jsxs)("ul",{className:"split-list",children:[(0,d.jsx)("li",{children:"$1 000 in verified cloud credits"}),(0,d.jsx)("li",{children:"Weekly group mentorship calls"}),(0,d.jsx)("li",{children:"Ubuntu Town builder network access"}),(0,d.jsx)("li",{children:"Product listing on enter.ubuntutown.co.za"}),(0,d.jsx)("li",{children:"Provincial showcase opportunity"}),(0,d.jsx)("li",{children:"Ubuntu Builder Certificate on completion"})]})]}),(0,d.jsxs)("div",{className:"split-col",children:[(0,d.jsx)("div",{className:"split-col-title",children:"You Bring"}),(0,d.jsxs)("ul",{className:"split-list",children:[(0,d.jsx)("li",{children:"A real problem from your town"}),(0,d.jsx)("li",{children:"8 weeks of consistent commitment"}),(0,d.jsx)("li",{children:"Weekly check-ins and progress updates"}),(0,d.jsx)("li",{children:"Openness to feedback and iteration"}),(0,d.jsx)("li",{children:"A willingness to share learnings publicly"}),(0,d.jsx)("li",{children:"Ubuntu spirit — rise by lifting others"})]})]})]})]}),(0,d.jsx)("hr",{className:"divider"}),(0,d.jsxs)("div",{id:"apply",className:"section",children:[(0,d.jsxs)("h2",{className:"section-title",style:{textAlign:"center"},children:["Apply for ",(0,d.jsx)("span",{children:"Your Town"})]}),(0,d.jsx)("p",{className:"section-sub",style:{textAlign:"center"},children:"One builder per town. Applications close when a town is filled."}),m?(0,d.jsx)("div",{className:"form-wrapper",children:(0,d.jsxs)("div",{className:"success-box",children:[(0,d.jsx)("div",{className:"success-icon",children:"\uD83C\uDF0D"}),(0,d.jsx)("div",{className:"success-title",children:"Application Received!"}),(0,d.jsxs)("p",{className:"success-sub",children:["Thank you, ",a.full_name,". We received your application for ",a.location,". We review every submission and will be in touch within 7 days. Ubuntu: I am because we are."]})]})}):(0,d.jsxs)("div",{className:"form-wrapper",children:[(0,d.jsx)("div",{className:"form-title",children:"Your Application"}),(0,d.jsx)("p",{className:"form-sub",children:"All fields required unless marked optional."}),(0,d.jsx)("form",{onSubmit:q,children:(0,d.jsxs)("div",{className:"form-grid",children:[(0,d.jsxs)("div",{className:"form-group",children:[(0,d.jsx)("label",{className:"form-label",htmlFor:"full_name",children:"Full Name"}),(0,d.jsx)("input",{id:"full_name",className:"form-input",type:"text",required:!0,placeholder:"Your full name",value:a.full_name,onChange:a=>b(b=>({...b,full_name:a.target.value}))})]}),(0,d.jsxs)("div",{className:"form-group",children:[(0,d.jsx)("label",{className:"form-label",htmlFor:"email",children:"Email"}),(0,d.jsx)("input",{id:"email",className:"form-input",type:"email",required:!0,placeholder:"you@email.com",value:a.email,onChange:a=>b(b=>({...b,email:a.target.value}))})]}),(0,d.jsxs)("div",{className:"form-group",children:[(0,d.jsx)("label",{className:"form-label",htmlFor:"whatsapp",children:"WhatsApp (optional)"}),(0,d.jsx)("input",{id:"whatsapp",className:"form-input",type:"tel",placeholder:"+27 XX XXX XXXX",value:a.whatsapp,onChange:a=>b(b=>({...b,whatsapp:a.target.value}))})]}),(0,d.jsxs)("div",{className:"form-group",children:[(0,d.jsx)("label",{className:"form-label",htmlFor:"town_slug",children:"Your Town"}),(0,d.jsxs)("select",{id:"town_slug",className:"form-select",required:!0,value:a.town_slug,onChange:function(a){let c=a.target.value,d="";for(let a of Object.values(g)){for(let b of a.towns)if(k(b)===c){d=b;break}if(d)break}b(a=>({...a,town_slug:c,location:d}))},children:[(0,d.jsx)("option",{value:"",children:"— Select a town —"}),Object.entries(g).map(([a,b])=>(0,d.jsx)("optgroup",{label:`${a} (${b.spots} spots)`,children:b.towns.map(a=>(0,d.jsx)("option",{value:k(a),children:a},a))},a))]})]}),(0,d.jsxs)("div",{className:"form-group full",children:[(0,d.jsx)("label",{className:"form-label",htmlFor:"town_connection",children:"How are you connected to this town?"}),(0,d.jsx)("input",{id:"town_connection",className:"form-input",type:"text",required:!0,placeholder:"e.g. Born and raised there, currently living there, family roots...",value:a.town_connection,onChange:a=>b(b=>({...b,town_connection:a.target.value}))})]}),(0,d.jsxs)("div",{className:"form-group full",children:[(0,d.jsx)("label",{className:"form-label",htmlFor:"town_challenge",children:"Biggest challenge facing your town"}),(0,d.jsx)("textarea",{id:"town_challenge",className:"form-textarea",required:!0,placeholder:"Describe the problem in your town that you want to solve...",value:a.town_challenge,onChange:a=>b(b=>({...b,town_challenge:a.target.value}))})]}),(0,d.jsxs)("div",{className:"form-group full",children:[(0,d.jsx)("label",{className:"form-label",htmlFor:"build_idea",children:"What do you want to build?"}),(0,d.jsx)("textarea",{id:"build_idea",className:"form-textarea",required:!0,placeholder:"Describe the product, tool, or service you want to create during the fellowship...",value:a.build_idea,onChange:a=>b(b=>({...b,build_idea:a.target.value}))})]}),(0,d.jsxs)("div",{className:"form-group full",children:[(0,d.jsx)("label",{className:"form-label",children:"Skill Level"}),(0,d.jsx)("div",{className:"skill-toggles",children:["beginner","intermediate","advanced","non-technical"].map(c=>(0,d.jsx)("button",{type:"button",className:`skill-btn${a.skill_level===c?" active":""}`,onClick:()=>b(a=>({...a,skill_level:c})),children:c.charAt(0).toUpperCase()+c.slice(1)},c))})]}),(0,d.jsx)("div",{className:"form-group full",children:(0,d.jsxs)("div",{className:"commit-row",children:[(0,d.jsx)("input",{id:"commit",className:"commit-cb",type:"checkbox",checked:a.commit,onChange:a=>b(b=>({...b,commit:a.target.checked}))}),(0,d.jsx)("label",{htmlFor:"commit",className:"commit-label",children:"I commit to attending at least 6 of 8 weekly sessions, shipping a working product, and representing my town with Ubuntu spirit."})]})}),o&&(0,d.jsx)("div",{className:"form-group full",children:(0,d.jsx)("div",{className:"form-error",children:o})}),(0,d.jsx)("div",{className:"form-group full",children:(0,d.jsx)("button",{type:"submit",className:"form-submit",disabled:c,children:c?"Submitting...":"Submit My Application →"})})]})})]})]}),(0,d.jsx)("div",{className:"values-bar",children:j.map((a,b)=>(0,d.jsxs)("span",{children:[(0,d.jsx)("span",{className:"value-item",children:a}),b<j.length-1&&(0,d.jsx)("span",{className:"value-sep",children:" \xb7 "})]},a))}),(0,d.jsxs)("footer",{className:"footer",children:[(0,d.jsxs)("div",{className:"footer-logo",children:[(0,d.jsx)("img",{src:"https://pub.hyperagent.com/api/published/pbf01KVWAG70R_DRE74TATERK2M2WA/2d51851a-429c-4abb-af4f-4f00b80b4942.png",alt:"Ubuntu Town"}),(0,d.jsx)("span",{className:"footer-brand",children:"Ubuntu Town"})]}),(0,d.jsx)("p",{className:"footer-tagline",children:'"Ubuntu: I am because we are."'}),(0,d.jsxs)("div",{className:"footer-links",children:[(0,d.jsx)("a",{href:"https://enter.ubuntutown.co.za",children:"Enter"}),(0,d.jsx)("a",{href:"/fellowship",children:"Fellowship"}),(0,d.jsx)("a",{href:"/about",children:"About"})]}),(0,d.jsxs)("p",{className:"footer-copy",children:["\xa9 ",new Date().getFullYear()," Ubuntu Town. Built with Ubuntu spirit."]})]})]})}},41025:a=>{"use strict";a.exports=require("next/dist/server/app-render/dynamic-access-async-storage.external.js")},52668:(a,b,c)=>{Promise.resolve().then(c.bind(c,36377))},55511:a=>{"use strict";a.exports=require("crypto")},56967:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>d});let d=(0,c(44062).registerClientReference)(function(){throw Error("Attempted to call the default export of \"/home/ubuntu/ut-os-wave1/ubuntu-town-web/src/app/fellowship/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/ubuntu/ut-os-wave1/ubuntu-town-web/src/app/fellowship/page.tsx","default")},57283:(a,b,c)=>{"use strict";c.r(b),c.d(b,{GlobalError:()=>F.a,__next_app__:()=>L,handler:()=>N,pages:()=>K,routeModule:()=>M,tree:()=>J});var d=c(1619),e=c(12446),f=c(87945),g=c(23423),h=c(25632),i=c(13378),j=c(41436),k=c(16443),l=c(10744),m=c(31982),n=c(24044),o=c(14866),p=c(47262),q=c(14081),r=c(56617),s=c(27898),t=c(261),u=c(72281),v=c(42438),w=c(26713),x=c(90704),y=c(99505),z=c(42245),A=c(77730),B=c(75982),C=c(36090),D=c(86439),E=c(15958),F=c.n(E),G=c(48094),H=c(52711),I={};for(let a in G)0>["default","tree","pages","GlobalError","__next_app__","routeModule","handler"].indexOf(a)&&(I[a]=()=>G[a]);c.d(b,I);let J={children:["",{children:["fellowship",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(c.bind(c,56967)),"/home/ubuntu/ut-os-wave1/ubuntu-town-web/src/app/fellowship/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(c.bind(c,28696)),"/home/ubuntu/ut-os-wave1/ubuntu-town-web/src/app/layout.tsx"],"global-error":[()=>Promise.resolve().then(c.t.bind(c,15958,23)),"next/dist/client/components/builtin/global-error.js"],"not-found":[()=>Promise.resolve().then(c.t.bind(c,93808,23)),"next/dist/client/components/builtin/not-found.js"],forbidden:[()=>Promise.resolve().then(c.t.bind(c,76737,23)),"next/dist/client/components/builtin/forbidden.js"],unauthorized:[()=>Promise.resolve().then(c.t.bind(c,51668,23)),"next/dist/client/components/builtin/unauthorized.js"]}]}.children,K=["/home/ubuntu/ut-os-wave1/ubuntu-town-web/src/app/fellowship/page.tsx"],L={require:c,loadChunk:()=>Promise.resolve()},M=new e.AppPageRouteModule({definition:{kind:f.RouteKind.APP_PAGE,page:"/fellowship/page",pathname:"/fellowship",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:J},distDir:".next",relativeProjectDir:""});async function N(a,b,e){var E;let I="/fellowship/page";"/index"===I&&(I="/");let O=(0,i.getRequestMeta)(a,"postponed"),P=(0,i.getRequestMeta)(a,"minimalMode"),Q=await M.prepare(a,b,{srcPage:I,multiZoneDraftMode:!1});if(!Q)return b.statusCode=400,b.end("Bad Request"),null==e.waitUntil||e.waitUntil.call(e,Promise.resolve()),null;let{buildId:R,query:S,params:T,parsedUrl:U,pageIsDynamic:V,buildManifest:W,nextFontManifest:X,reactLoadableManifest:Y,serverActionsManifest:Z,clientReferenceManifest:$,subresourceIntegrityManifest:_,prerenderManifest:aa,isDraftMode:ab,resolvedPathname:ac,revalidateOnlyGenerated:ad,routerServerContext:ae,nextConfig:af,interceptionRoutePatterns:ag}=Q,ah=U.pathname||"/",ai=(0,t.normalizeAppPath)(I),{isOnDemandRevalidate:aj}=Q,ak=M.match(ah,aa),al=!!aa.routes[ac]&&(M.isDev||(0,d.isRouteCacheOwner)(ac,M.cacheOwner,aa.routes[ac])),am=!!(ak||al||aa.routes[ai]),an=a.headers["user-agent"]||"",ao=(0,w.getBotType)(an),ap=(0,r.isHtmlBotRequest)(a),aq=(0,i.getRequestMeta)(a,"isPrefetchRSCRequest")??"1"===a.headers[v.NEXT_ROUTER_PREFETCH_HEADER],ar=(0,i.getRequestMeta)(a,"isRSCRequest")??(0,o.f)(a.headers[v.RSC_HEADER]),as=(0,u.getIsPossibleServerAction)(a),at=(0,n.checkIsAppPPREnabled)(af.experimental.ppr)&&(null==(E=aa.routes[ai]??aa.dynamicRoutes[ai])?void 0:E.renderingMode)==="PARTIALLY_STATIC",au=!1,av=!1,aw=at?O:void 0,ax=at&&ar&&!aq,ay=(0,i.getRequestMeta)(a,"segmentPrefetchRSCRequest"),az=!an||(0,r.shouldServeStreamingMetadata)(an,af.htmlLimitedBots);ap&&at&&(am=!1,az=!1);let aA=!0===M.isDev||!am||"string"==typeof O||ax,aB=ap&&at,aC=null;ab||!am||aA||as||aw||ax||(aC=ac);let aD=aC;!aD&&M.isDev&&(aD=ac),M.isDev||ab||!am||!ar||ax||(0,l.d)(a.headers);let aE={...G,tree:J,pages:K,GlobalError:F(),handler:N,routeModule:M,__next_app__:L};Z&&$&&(0,q.setReferenceManifestsSingleton)({page:I,clientReferenceManifest:$,serverActionsManifest:Z,serverModuleMap:(0,s.createServerModuleMap)({serverActionsManifest:Z})});let aF=a.method||"GET",aG=(0,h.getTracer)(),aH=aG.getActiveScopeSpan();try{let d=M.getVaryHeader(ac,ag);b.setHeader("Vary",d);let g=async(c,d)=>{let e=new m.NodeNextRequest(a),f=new m.NodeNextResponse(b);return M.render(e,f,d).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=aG.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==j.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${aF} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${aF} ${a.url}`)})},l=async({span:d,postponed:f,fallbackRouteParams:h})=>{let j={query:S,params:T,page:ai,sharedContext:{buildId:R},serverComponentsHmrCache:(0,i.getRequestMeta)(a,"serverComponentsHmrCache"),fallbackRouteParams:h,renderOpts:{App:()=>null,Document:()=>null,pageConfig:{},ComponentMod:aE,Component:(0,k.T)(aE),params:T,routeModule:M,page:I,postponed:f,shouldWaitOnAllReady:aB,serveStreamingMetadata:az,supportsDynamicResponse:"string"==typeof f||aA,buildManifest:W,nextFontManifest:X,reactLoadableManifest:Y,subresourceIntegrityManifest:_,serverActionsManifest:Z,clientReferenceManifest:$,setIsrStatus:null==ae?void 0:ae.setIsrStatus,dir:c(33873).join(process.cwd(),M.relativeProjectDir),isDraftMode:ab,isRevalidate:am&&!f&&!ax,botType:ao,isOnDemandRevalidate:aj,isPossibleServerAction:as,assetPrefix:af.assetPrefix,nextConfigOutput:af.output,crossOrigin:af.crossOrigin,trailingSlash:af.trailingSlash,previewProps:aa.preview,deploymentId:af.deploymentId,enableTainting:af.experimental.taint,htmlLimitedBots:af.htmlLimitedBots,devtoolSegmentExplorer:af.experimental.devtoolSegmentExplorer,reactMaxHeadersLength:af.reactMaxHeadersLength,multiZoneDraftMode:!1,incrementalCache:(0,i.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:af.experimental.cacheLife,basePath:af.basePath,serverActions:af.experimental.serverActions,...au?{nextExport:!0,supportsDynamicResponse:!1,isStaticGeneration:!0,isRevalidate:!0,isDebugDynamicAccesses:au}:{},experimental:{isRoutePPREnabled:at,expireTime:af.expireTime,staleTimes:af.experimental.staleTimes,cacheComponents:!!af.experimental.cacheComponents,clientSegmentCache:!!af.experimental.clientSegmentCache,clientParamParsing:!!af.experimental.clientParamParsing,dynamicOnHover:!!af.experimental.dynamicOnHover,inlineCss:!!af.experimental.inlineCss,authInterrupts:!!af.experimental.authInterrupts,clientTraceMetadata:af.experimental.clientTraceMetadata||[]},waitUntil:e.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:()=>{},onInstrumentationRequestError:(b,c,d)=>M.onRequestError(a,b,d,ae),err:(0,i.getRequestMeta)(a,"invokeError"),dev:M.isDev}},l=await g(d,j),{metadata:m}=l,{cacheControl:n,headers:o={},fetchTags:p}=m;if(p&&(o[A.NEXT_CACHE_TAGS_HEADER]=p),a.fetchMetrics=m.fetchMetrics,am&&(null==n?void 0:n.revalidate)===0&&!M.isDev&&!at){let a=m.staticBailoutInfo,b=Object.defineProperty(Error(`Page changed from static to dynamic at runtime ${ac}${(null==a?void 0:a.description)?`, reason: ${a.description}`:""}
see more here https://nextjs.org/docs/messages/app-static-to-dynamic-error`),"__NEXT_ERROR_CODE",{value:"E132",enumerable:!1,configurable:!0});if(null==a?void 0:a.stack){let c=a.stack;b.stack=b.message+c.substring(c.indexOf("\n"))}throw b}return{value:{kind:x.CachedRouteKind.APP_PAGE,html:l,headers:o,rscData:m.flightData,postponed:m.postponed,status:m.statusCode,segmentData:m.segmentData},cacheControl:n}},n=async({hasResolved:c,previousCacheEntry:d,isRevalidating:g,span:h})=>{let j,k=!1===M.isDev,m=c||b.writableEnded;if(aj&&ad&&!d&&!P)return(null==ae?void 0:ae.render404)?await ae.render404(a,b):(b.statusCode=404,b.end("This page could not be found")),null;if(ak&&(j=(0,y.parseFallbackField)(ak.fallback)),j===y.FallbackMode.PRERENDER&&(0,w.isBot)(an)&&(!at||ap)&&(j=y.FallbackMode.BLOCKING_STATIC_RENDER),(null==d?void 0:d.isStale)===-1&&(aj=!0),aj&&(j!==y.FallbackMode.NOT_FOUND||d)&&(j=y.FallbackMode.BLOCKING_STATIC_RENDER),!P&&j!==y.FallbackMode.BLOCKING_STATIC_RENDER&&aD&&!m&&!ab&&V&&(k||!al)){let b;if((k||ak)&&j===y.FallbackMode.NOT_FOUND)throw new D.NoFallbackError;if(at&&!ar){let c="string"==typeof(null==ak?void 0:ak.fallback)?ak.fallback:k?ai:null;if(b=await M.handleResponse({cacheKey:c,req:a,nextConfig:af,routeKind:f.RouteKind.APP_PAGE,isFallback:!0,prerenderManifest:aa,isRoutePPREnabled:at,responseGenerator:async()=>l({span:h,postponed:void 0,fallbackRouteParams:k||av?(0,p.u)(ai):null}),waitUntil:e.waitUntil}),null===b)return null;if(b)return delete b.cacheControl,b}}let n=aj||g||!aw?void 0:aw;if(au&&void 0!==n)return{cacheControl:{revalidate:1,expire:void 0},value:{kind:x.CachedRouteKind.PAGES,html:z.default.EMPTY,pageData:{},headers:void 0,status:void 0}};let o=V&&at&&((0,i.getRequestMeta)(a,"renderFallbackShell")||av)?(0,p.u)(ah):null;return l({span:h,postponed:n,fallbackRouteParams:o})},o=async c=>{var d,g,h,j,k;let m,o=await M.handleResponse({cacheKey:aC,responseGenerator:a=>n({span:c,...a}),routeKind:f.RouteKind.APP_PAGE,isOnDemandRevalidate:aj,isRoutePPREnabled:at,req:a,nextConfig:af,prerenderManifest:aa,waitUntil:e.waitUntil});if(ab&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate"),M.isDev&&b.setHeader("Cache-Control","no-store, must-revalidate"),!o){if(aC)throw Object.defineProperty(Error("invariant: cache entry required but not generated"),"__NEXT_ERROR_CODE",{value:"E62",enumerable:!1,configurable:!0});return null}if((null==(d=o.value)?void 0:d.kind)!==x.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant app-page handler received invalid cache entry ${null==(h=o.value)?void 0:h.kind}`),"__NEXT_ERROR_CODE",{value:"E707",enumerable:!1,configurable:!0});let p="string"==typeof o.value.postponed;am&&!ax&&(!p||aq)&&(P||b.setHeader("x-nextjs-cache",aj?"REVALIDATED":o.isMiss?"MISS":o.isStale?"STALE":"HIT"),b.setHeader(v.NEXT_IS_PRERENDER_HEADER,"1"));let{value:q}=o;if(aw)m={revalidate:0,expire:void 0};else if(P&&ar&&!aq&&at)m={revalidate:0,expire:void 0};else if(!M.isDev)if(ab)m={revalidate:0,expire:void 0};else if(am){if(o.cacheControl)if("number"==typeof o.cacheControl.revalidate){if(o.cacheControl.revalidate<1)throw Object.defineProperty(Error(`Invalid revalidate configuration provided: ${o.cacheControl.revalidate} < 1`),"__NEXT_ERROR_CODE",{value:"E22",enumerable:!1,configurable:!0});m={revalidate:o.cacheControl.revalidate,expire:(null==(j=o.cacheControl)?void 0:j.expire)??af.expireTime}}else m={revalidate:A.CACHE_ONE_YEAR,expire:void 0}}else b.getHeader("Cache-Control")||(m={revalidate:0,expire:void 0});if(o.cacheControl=m,"string"==typeof ay&&(null==q?void 0:q.kind)===x.CachedRouteKind.APP_PAGE&&q.segmentData){b.setHeader(v.NEXT_DID_POSTPONE_HEADER,"2");let c=null==(k=q.headers)?void 0:k[A.NEXT_CACHE_TAGS_HEADER];P&&am&&c&&"string"==typeof c&&b.setHeader(A.NEXT_CACHE_TAGS_HEADER,c);let d=q.segmentData.get(ay);return void 0!==d?(0,C.sendRenderResult)({req:a,res:b,generateEtags:af.generateEtags,poweredByHeader:af.poweredByHeader,result:z.default.fromStatic(d,v.RSC_CONTENT_TYPE_HEADER),cacheControl:o.cacheControl}):(b.statusCode=204,(0,C.sendRenderResult)({req:a,res:b,generateEtags:af.generateEtags,poweredByHeader:af.poweredByHeader,result:z.default.EMPTY,cacheControl:o.cacheControl}))}let r=(0,i.getRequestMeta)(a,"onCacheEntry");if(r&&await r({...o,value:{...o.value,kind:"PAGE"}},{url:(0,i.getRequestMeta)(a,"initURL")}))return null;if(p&&aw)throw Object.defineProperty(Error("Invariant: postponed state should not be present on a resume request"),"__NEXT_ERROR_CODE",{value:"E396",enumerable:!1,configurable:!0});if(q.headers){let a={...q.headers};for(let[c,d]of(P&&am||delete a[A.NEXT_CACHE_TAGS_HEADER],Object.entries(a)))if(void 0!==d)if(Array.isArray(d))for(let a of d)b.appendHeader(c,a);else"number"==typeof d&&(d=d.toString()),b.appendHeader(c,d)}let s=null==(g=q.headers)?void 0:g[A.NEXT_CACHE_TAGS_HEADER];if(P&&am&&s&&"string"==typeof s&&b.setHeader(A.NEXT_CACHE_TAGS_HEADER,s),!q.status||ar&&at||(b.statusCode=q.status),!P&&q.status&&H.RedirectStatusCode[q.status]&&ar&&(b.statusCode=200),p&&b.setHeader(v.NEXT_DID_POSTPONE_HEADER,"1"),ar&&!ab){if(void 0===q.rscData){if(q.postponed)throw Object.defineProperty(Error("Invariant: Expected postponed to be undefined"),"__NEXT_ERROR_CODE",{value:"E372",enumerable:!1,configurable:!0});return(0,C.sendRenderResult)({req:a,res:b,generateEtags:af.generateEtags,poweredByHeader:af.poweredByHeader,result:q.html,cacheControl:ax?{revalidate:0,expire:void 0}:o.cacheControl})}return(0,C.sendRenderResult)({req:a,res:b,generateEtags:af.generateEtags,poweredByHeader:af.poweredByHeader,result:z.default.fromStatic(q.rscData,v.RSC_CONTENT_TYPE_HEADER),cacheControl:o.cacheControl})}let t=q.html;if(!p||P||ar)return(0,C.sendRenderResult)({req:a,res:b,generateEtags:af.generateEtags,poweredByHeader:af.poweredByHeader,result:t,cacheControl:o.cacheControl});if(au)return t.push(new ReadableStream({start(a){a.enqueue(B.ENCODED_TAGS.CLOSED.BODY_AND_HTML),a.close()}})),(0,C.sendRenderResult)({req:a,res:b,generateEtags:af.generateEtags,poweredByHeader:af.poweredByHeader,result:t,cacheControl:{revalidate:0,expire:void 0}});let u=new TransformStream;return t.push(u.readable),l({span:c,postponed:q.postponed,fallbackRouteParams:null}).then(async a=>{var b,c;if(!a)throw Object.defineProperty(Error("Invariant: expected a result to be returned"),"__NEXT_ERROR_CODE",{value:"E463",enumerable:!1,configurable:!0});if((null==(b=a.value)?void 0:b.kind)!==x.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant: expected a page response, got ${null==(c=a.value)?void 0:c.kind}`),"__NEXT_ERROR_CODE",{value:"E305",enumerable:!1,configurable:!0});await a.value.html.pipeTo(u.writable)}).catch(a=>{u.writable.abort(a).catch(a=>{console.error("couldn't abort transformer",a)})}),(0,C.sendRenderResult)({req:a,res:b,generateEtags:af.generateEtags,poweredByHeader:af.poweredByHeader,result:t,cacheControl:{revalidate:0,expire:void 0}})};if(!aH)return await aG.withPropagatedContext(a.headers,()=>aG.trace(j.BaseServerSpan.handleRequest,{spanName:`${aF} ${a.url}`,kind:h.SpanKind.SERVER,attributes:{"http.method":aF,"http.target":a.url}},o));await o(aH)}catch(b){throw b instanceof D.NoFallbackError||await M.onRequestError(a,b,{routerKind:"App Router",routePath:I,routeType:"render",revalidateReason:(0,g.c)({isRevalidate:am,isOnDemandRevalidate:aj})},ae),b}}},59292:(a,b,c)=>{Promise.resolve().then(c.bind(c,56967))},6e4:(a,b,c)=>{"use strict";c.d(b,{N:()=>g});var d=c(14797);let e="https://placeholder.supabase.co",f="placeholder";e&&f&&1?console.log("Ubuntu Town: Supabase connected to",e.replace(/\/$/,"").split("/").slice(-1)[0]):console.log("Ubuntu Town: Using mock data (no Supabase credentials configured)");let g=(0,d.k)(e||"https://placeholder.supabase.co",f||"placeholder-key",{db:{schema:"uto"}})},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},74075:a=>{"use strict";a.exports=require("zlib")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")}};var b=require("../../webpack-runtime.js");b.C(a);var c=b.X(0,[857,5663,4797,2950],()=>b(b.s=57283));module.exports=c})();