// src/lib/experience/universe.ts — EXPERIENCE 001 SYNTHETIC OPERATING UNIVERSE.
// ⚠ SYNTHETIC DEMO DATA — every row here is invented for demonstration. Nothing in this
// file is real production data. No real people, no real outcomes. (Experience 002 swaps
// this for real Supabase read interfaces.)
//
// Shape mirrors the canonical uto row types (src/lib/pulse/types.ts) so the EXISTING
// Pulse engine (computeHierarchy / computeView / projectMode / proposeAction) computes
// over this universe unchanged — one derived engine, synthetic input.
//
// Navigation model: 50 Blueprint towns / 9 provinces (per directive). The production
// roster question (81 rows, cohort A/B) is UNRESOLVED and stays out of this product
// surface (G4). Town names below follow the founding-fifty display set as demo content.

export type WorkStatus = 'draft' | 'submitted' | 'approved' | 'published' | 'rejected';
export type ProofState = 'captured' | 'verified' | 'disputed';
export type OpportunityStatus = 'open' | 'matched' | 'closed';

export interface SynWork { id: string; title: string; town: string; initiative: string; owner: string; status: WorkStatus; created_at: string; updated_at: string; }
export interface SynSignal { id: string; title: string; town: string; created_by: string; created_at: string; status: 'open' | 'triaged' | 'closed'; }
export interface SynProof { id: string; work_id: string; town: string; state: ProofState; created_at: string; note: string; }
export interface SynLearning { id: string; source_proof_id: string | null; town: string; text: string; created_at: string; }
export interface SynOpportunity { id: string; title: string; town: string; status: OpportunityStatus; created_at: string; summary: string; evidenceHint: string[]; }
export interface SynPerson {
  id: string; name: string; town: string; roles: string[];
  contribution: string; reliability: number; capability: string[]; collaboration: string; initiative: string;
  scope: string; roleNow: string; evidence: string[]; nextCapability: string; opportunity: string; recommendation: string;
}
export interface SynInitiative {
  id: string; name: string; town: string; headline: string;
  demand: { count: number; label: string }; supply: { verified: number; required: number; label: string };
  work: { total: number; completed: number; active: number; blocked: number };
  proof: { verified: number; pending: number; missing: number };
  economics: { label: string; value: string };
  intelligence: string; chief: string; why: string; next: string;
}

// ---------- geography (50 Blueprint towns / 9 provinces — demo navigation model) ----------
export const PROVINCES: { slug: string; name: string }[] = [
  { slug: 'gauteng', name: 'Gauteng' },
  { slug: 'free-state', name: 'Free State' },
  { slug: 'kwazulu-natal', name: 'KwaZulu-Natal' },
  { slug: 'eastern-cape', name: 'Eastern Cape' },
  { slug: 'mpumalanga', name: 'Mpumalanga' },
  { slug: 'limpopo', name: 'Limpopo' },
  { slug: 'north-west', name: 'North West' },
  { slug: 'western-cape', name: 'Western Cape' },
  { slug: 'northern-cape', name: 'Northern Cape' },
];

export const TOWNS: { slug: string; name: string; province: string }[] = [
  { slug: 'johannesburg', name: 'Johannesburg', province: 'gauteng' },
  { slug: 'pretoria', name: 'Pretoria', province: 'gauteng' },
  { slug: 'soweto', name: 'Soweto', province: 'gauteng' },
  { slug: 'tembisa', name: 'Tembisa', province: 'gauteng' },
  { slug: 'springs', name: 'Springs', province: 'gauteng' },
  { slug: 'vanderbijlpark', name: 'Vanderbijlpark', province: 'gauteng' },
  { slug: 'randfontein', name: 'Randfontein', province: 'gauteng' },
  { slug: 'kempton-park', name: 'Kempton Park', province: 'gauteng' },
  { slug: 'bloemfontein', name: 'Bloemfontein', province: 'free-state' },
  { slug: 'bethlehem', name: 'Bethlehem', province: 'free-state' },
  { slug: 'harrismith', name: 'Harrismith', province: 'free-state' },
  { slug: 'ficksburg', name: 'Ficksburg', province: 'free-state' },
  { slug: 'senekal', name: 'Senekal', province: 'free-state' },
  { slug: 'ladybrand', name: 'Ladybrand', province: 'free-state' },
  { slug: 'phuthaditjhaba', name: 'Phuthaditjhaba', province: 'free-state' },
  { slug: 'welkom', name: 'Welkom', province: 'free-state' },
  { slug: 'durban', name: 'Durban', province: 'kwazulu-natal' },
  { slug: 'newcastle', name: 'Newcastle', province: 'kwazulu-natal' },
  { slug: 'kokstad', name: 'Kokstad', province: 'kwazulu-natal' },
  { slug: 'harding', name: 'Harding', province: 'kwazulu-natal' },
  { slug: 'greytown', name: 'Greytown', province: 'kwazulu-natal' },
  { slug: 'nquthu', name: 'Nquthu', province: 'kwazulu-natal' },
  { slug: 'richards-bay', name: 'Richards Bay', province: 'kwazulu-natal' },
  { slug: 'matatiele', name: 'Matatiele', province: 'eastern-cape' },
  { slug: 'kwa-maqoma', name: 'KwaMaqoma', province: 'eastern-cape' },
  { slug: 'mthatha', name: 'Mthatha', province: 'eastern-cape' },
  { slug: 'gqeberha', name: 'Gqeberha', province: 'eastern-cape' },
  { slug: 'east-london', name: 'East London', province: 'eastern-cape' },
  { slug: 'emalahleni', name: 'Emalahleni', province: 'mpumalanga' },
  { slug: 'bushbuckridge', name: 'Bushbuckridge', province: 'mpumalanga' },
  { slug: 'acornhoek', name: 'Acornhoek', province: 'mpumalanga' },
  { slug: 'sabie', name: 'Sabie', province: 'mpumalanga' },
  { slug: 'mbombela', name: 'Mbombela', province: 'mpumalanga' },
  { slug: 'burgersfort', name: 'Burgersfort', province: 'mpumalanga' },
  { slug: 'mokopane', name: 'Mokopane', province: 'limpopo' },
  { slug: 'polokwane', name: 'Polokwane', province: 'limpopo' },
  { slug: 'tzaneen', name: 'Tzaneen', province: 'limpopo' },
  { slug: 'thohoyandou', name: 'Thohoyandou', province: 'limpopo' },
  { slug: 'brits', name: 'Brits', province: 'north-west' },
  { slug: 'rustenburg', name: 'Rustenburg', province: 'north-west' },
  { slug: 'mahikeng', name: 'Mahikeng', province: 'north-west' },
  { slug: 'klerksdorp', name: 'Klerksdorp', province: 'north-west' },
  { slug: 'cape-town', name: 'Cape Town', province: 'western-cape' },
  { slug: 'george', name: 'George', province: 'western-cape' },
  { slug: 'paarl', name: 'Paarl', province: 'western-cape' },
  { slug: 'worcester', name: 'Worcester', province: 'western-cape' },
  { slug: 'kimberley', name: 'Kimberley', province: 'northern-cape' },
  { slug: 'upington', name: 'Upington', province: 'northern-cape' },
  { slug: 'kuruman', name: 'Kuruman', province: 'northern-cape' },
  { slug: 'de-aar', name: 'De Aar', province: 'northern-cape' },
];

// ---------- people (synthetic personas — Proof Profiles) ----------
export const PEOPLE: SynPerson[] = [
  {
    id: 'syn-person-palesa', name: 'Palesa Mokoena', town: 'senekal', roles: ['Builder', 'Convener'],
    contribution: 'Led 6 verified repair missions; trained 3 new artisans.', reliability: 0.92,
    capability: ['plumbing', 'team leadership', 'quality review'], collaboration: 'Runs the Tuesday skills circle; 4 people list her as preferred partner.',
    initiative: 'Started the artisan tool-library after a shared-equipment shortage.',
    scope: 'FixEasy Senekal workstream lead', roleNow: 'Builder (acting workstream lead)',
    evidence: ['syn-work-201', 'syn-work-203', 'syn-proof-301', 'syn-proof-302', 'syn-learning-401'],
    nextCapability: 'Formal artisan assessor certification', opportunity: 'Provincial artisan verification lead (Free State)',
    recommendation: 'Progress to Initiative Lead — evidence supports the move (scenario D).',
  },
  {
    id: 'syn-person-thabo', name: 'Thabo Radebe', town: 'senekal', roles: ['Builder'],
    contribution: '12 completed repairs, fastest first-response time in the network.', reliability: 0.88,
    capability: ['electrical', 'diagnostics'], collaboration: 'Strong pair-worker; needs a co-lead for larger jobs.',
    initiative: 'Proposed the demand-triage board that cut response time by half.',
    scope: 'FixEasy Senekal responder', roleNow: 'Builder',
    evidence: ['syn-work-202', 'syn-proof-303'], nextCapability: 'Estimating and quoting',
    opportunity: 'Klerksdorp Market Link pilot responder', recommendation: 'Pair with a commercial mentor before scaling.',
  },
  {
    id: 'syn-person-naledi', name: 'Naledi Khumalo', town: 'soweto', roles: ['Creator', 'Ambassador'],
    contribution: 'Activated 8 creators; 14 published media works this quarter.', reliability: 0.81,
    capability: ['storytelling', 'facilitation', 'content production'], collaboration: 'Runs the FrameSouth creator guild.',
    initiative: 'Turned a stalled workshop series into a weekly creator activation.',
    scope: 'FrameSouth Soweto', roleNow: 'Creator guild convener',
    evidence: ['syn-work-101', 'syn-work-102', 'syn-proof-110'], nextCapability: 'Producer-level project finance',
    opportunity: 'National Creator Network ambassador', recommendation: 'Hold scope; consolidate proof quality before expansion.',
  },
  {
    id: 'syn-person-sipho', name: 'Sipho Dlamini', town: 'mthatha', roles: ['Operator'],
    contribution: 'Kept Trade Bridge administration running through two coordinator changes.', reliability: 0.64,
    capability: ['administration', 'record keeping'], collaboration: 'Reliable executor; limited initiative evidence.',
    initiative: 'Requested Town Lead scope for Mthatha.',
    scope: 'Trade Bridge Mthatha operator', roleNow: 'Operator',
    evidence: ['syn-work-501'], nextCapability: 'Evidence of outcome delivery (not activity)',
    opportunity: 'Deputy scope after outcome evidence exists', recommendation: 'DO NOT grant Town Lead scope yet — INSUFFICIENT EVIDENCE (scenario E).',
  },
  {
    id: 'syn-person-amahle', name: 'Amahle Zwane', town: 'phuthaditjhaba', roles: ['Builder', 'Networker'],
    contribution: 'Built the ECD operator roster from 4 to 11 verified practitioners.', reliability: 0.79,
    capability: ['ECD training', 'recruitment'], collaboration: 'Connects QwaQwa practitioners with Free State mentors.',
    initiative: 'Green Streets ECD capacity drive.',
    scope: 'Green Streets ECD Phuthaditjhaba', roleNow: 'Capacity lead',
    evidence: ['syn-work-601', 'syn-proof-610'], nextCapability: 'Facility compliance knowledge',
    opportunity: 'Provincial ECD capacity coordinator', recommendation: 'Fund a second verification round — capacity gap is the constraint.',
  },
  {
    id: 'syn-person-bongani', name: 'Bongani Nkosi', town: 'bushbuckridge', roles: ['Operator'],
    contribution: 'Coordinated care visits across 9 households; 2 proofs captured of 9.', reliability: 0.58,
    capability: ['care coordination'], collaboration: 'Trusted by families; weak on evidence capture.',
    initiative: 'Care Collective proof recovery.',
    scope: 'Care Collective Bushbuckridge', roleNow: 'Coordinator',
    evidence: ['syn-work-701'], nextCapability: 'Proof capture discipline (photo + sign-off)',
    opportunity: 'Verification trainer once own proof rate passes 80%', recommendation: 'Coach on proof capture before any scope growth (scenario C).',
  },
  {
    id: 'syn-person-kagiso', name: 'Kagiso Molefe', town: 'klerksdorp', roles: ['Trader', 'Networker'],
    contribution: 'Surfaced 31 repair demand signals from local businesses.', reliability: 0.85,
    capability: ['market sensing', 'sales'], collaboration: 'Bridges Klerksdorp businesses and town builders.',
    initiative: 'Market Link demand aggregation.',
    scope: 'Market Link North West', roleNow: 'Demand lead',
    evidence: ['syn-signal-801', 'syn-signal-802', 'syn-work-801'], nextCapability: 'Supply verification pipeline',
    opportunity: 'Cross-town opportunity pilot with Senekal (scenario G)', recommendation: 'Run the pilot as a bounded mission — evidence first.',
  },
];

// ---------- initiatives ----------
export const INITIATIVES: SynInitiative[] = [
  {
    id: 'syn-init-fixeasy-senekal', name: 'FixEasy', town: 'senekal', headline: 'Verified repair work, matched to local demand.',
    demand: { count: 31, label: 'repair demand signals' }, supply: { verified: 8, required: 21, label: 'verified artisans' },
    work: { total: 12, completed: 9, active: 2, blocked: 1 }, proof: { verified: 7, pending: 2, missing: 3 },
    economics: { label: 'verified work value this quarter', value: 'R 148 500' },
    intelligence: 'Demand exists. Supply verification is the bottleneck.',
    chief: 'Recommendation: run a five-person artisan verification mission.',
    why: 'Because the evidence indicates a supply-capacity constraint rather than a demand-generation constraint.',
    next: 'Create Mission',
  },
  {
    id: 'syn-init-framesouth-soweto', name: 'FrameSouth', town: 'soweto', headline: 'A creator guild turning local stories into paid work.',
    demand: { count: 12, label: 'commission requests' }, supply: { verified: 8, required: 10, label: 'verified creators' },
    work: { total: 24, completed: 19, active: 4, blocked: 1 }, proof: { verified: 14, pending: 3, missing: 2 },
    economics: { label: 'creator earnings this quarter', value: 'R 96 200' },
    intelligence: 'Activation is compounding: 8 creators activated, earnings rising.',
    chief: 'Recommendation: consolidate proof quality before expanding scope.',
    why: 'Because growth is outrunning evidence capture.',
    next: 'Review proof backlog',
  },
  {
    id: 'syn-init-ecd-phuthaditjhaba', name: 'Green Streets ECD', town: 'phuthaditjhaba', headline: 'Community early childhood development capacity.',
    demand: { count: 44, label: 'children needing placement' }, supply: { verified: 11, required: 19, label: 'verified ECD operators' },
    work: { total: 9, completed: 5, active: 3, blocked: 1 }, proof: { verified: 5, pending: 2, missing: 2 },
    economics: { label: 'monthly parent fees flowing', value: 'R 38 400' },
    intelligence: 'QwaQwa needs additional ECD operators — the gap is capacity, not demand.',
    chief: 'Recommendation: fund a second operator verification round.',
    why: 'Because 44 children are waiting on 8 missing verified operators.',
    next: 'Create Mission',
  },
  {
    id: 'syn-init-tradebridge-mthatha', name: 'Trade Bridge', town: 'mthatha', headline: 'Linking township producers to buyers.',
    demand: { count: 17, label: 'buyer enquiries' }, supply: { verified: 6, required: 12, label: 'verified producers' },
    work: { total: 15, completed: 4, active: 6, blocked: 5 }, proof: { verified: 3, pending: 4, missing: 8 },
    economics: { label: 'trade value this quarter', value: 'R 22 100' },
    intelligence: 'Activity exists but outcomes are not progressing — stalled (scenario F).',
    chief: 'Recommendation: intervene at coordinator level; 5 works blocked > 30 days.',
    why: 'Because work is being started but not carried to outcome.',
    next: 'Review blocked works',
  },
  {
    id: 'syn-init-care-bushbuckridge', name: 'Care Collective', town: 'bushbuckridge', headline: 'Community care visits with verified evidence.',
    demand: { count: 9, label: 'households enrolled' }, supply: { verified: 4, required: 6, label: 'verified carers' },
    work: { total: 9, completed: 7, active: 2, blocked: 0 }, proof: { verified: 2, pending: 2, missing: 5 },
    economics: { label: 'stipends disbursed', value: 'R 17 900' },
    intelligence: 'Work happened. The evidence did not — 5 of 9 proofs missing (scenario C).',
    chief: 'Recommendation: run a proof-recovery mission before paying the next stipend round.',
    why: 'Because payment without proof breaks the trust model.',
    next: 'Create Mission',
  },
  {
    id: 'syn-init-marketlink-klerksdorp', name: 'Market Link', town: 'klerksdorp', headline: 'Demand aggregation for local repair and trade.',
    demand: { count: 31, label: 'aggregated demand signals' }, supply: { verified: 3, required: 15, label: 'verified suppliers' },
    work: { total: 3, completed: 1, active: 2, blocked: 0 }, proof: { verified: 1, pending: 1, missing: 1 },
    economics: { label: 'indicative demand value', value: 'R 210 000' },
    intelligence: 'Cross-town signals suggest a Klerksdorp↔Senekal pilot (scenario G).',
    chief: 'Recommendation: test a bounded cross-town supply pilot with Senekal builders.',
    why: 'Because demand here and verified supply there have never been connected.',
    next: 'Propose pilot',
  },
];

// ---------- work rows ----------
export const WORK: SynWork[] = [
  // FrameSouth Soweto (scenario A — momentum)
  { id: 'syn-work-101', title: 'Produce township market documentary series', town: 'soweto', initiative: 'syn-init-framesouth-soweto', owner: 'syn-person-naledi', status: 'published', created_at: '2026-08-02', updated_at: '2026-09-28' },
  { id: 'syn-work-102', title: 'Activate 8 new creators into the guild', town: 'soweto', initiative: 'syn-init-framesouth-soweto', owner: 'syn-person-naledi', status: 'published', created_at: '2026-08-15', updated_at: '2026-10-02' },
  { id: 'syn-work-103', title: 'Creator onboarding workshop (weekly series)', town: 'soweto', initiative: 'syn-init-framesouth-soweto', owner: 'syn-person-naledi', status: 'approved', created_at: '2026-09-01', updated_at: '2026-10-08' },
  { id: 'syn-work-104', title: 'Commission: local business profile pack', town: 'soweto', initiative: 'syn-init-framesouth-soweto', owner: 'syn-person-naledi', status: 'submitted', created_at: '2026-10-04', updated_at: '2026-10-10' },
  // FixEasy Senekal (scenario B — capacity bottleneck; D — builder)
  { id: 'syn-work-201', title: 'Repair mission: 6 household fixes (Zone 3)', town: 'senekal', initiative: 'syn-init-fixeasy-senekal', owner: 'syn-person-palesa', status: 'published', created_at: '2026-08-20', updated_at: '2026-09-12' },
  { id: 'syn-work-202', title: 'First-response triage for 31 demand signals', town: 'senekal', initiative: 'syn-init-fixeasy-senekal', owner: 'syn-person-thabo', status: 'published', created_at: '2026-09-05', updated_at: '2026-10-01' },
  { id: 'syn-work-203', title: 'Train 3 new artisans (skills circle)', town: 'senekal', initiative: 'syn-init-fixeasy-senekal', owner: 'syn-person-palesa', status: 'approved', created_at: '2026-09-10', updated_at: '2026-10-06' },
  { id: 'syn-work-204', title: 'Artisan verification mission (5 candidates)', town: 'senekal', initiative: 'syn-init-fixeasy-senekal', owner: 'syn-person-palesa', status: 'draft', created_at: '2026-10-09', updated_at: '2026-10-09' },
  { id: 'syn-work-205', title: 'Tool-library shared equipment drive', town: 'senekal', initiative: 'syn-init-fixeasy-senekal', owner: 'syn-person-palesa', status: 'submitted', created_at: '2026-09-22', updated_at: '2026-10-05' },
  { id: 'syn-work-206', title: 'Blocked: municipal compliance sign-off (electricians)', town: 'senekal', initiative: 'syn-init-fixeasy-senekal', owner: 'syn-person-thabo', status: 'draft', created_at: '2026-08-28', updated_at: '2026-09-02' },
  // Trade Bridge Mthatha (scenario F — stalled)
  { id: 'syn-work-501', title: 'Producer catalogue v2 (record keeping)', town: 'mthatha', initiative: 'syn-init-tradebridge-mthatha', owner: 'syn-person-sipho', status: 'approved', created_at: '2026-07-15', updated_at: '2026-08-30' },
  { id: 'syn-work-502', title: 'Buyer enquiry pipeline (17 enquiries)', town: 'mthatha', initiative: 'syn-init-tradebridge-mthatha', owner: 'syn-person-sipho', status: 'submitted', created_at: '2026-08-01', updated_at: '2026-08-19' },
  { id: 'syn-work-503', title: 'Producer verification round 1', town: 'mthatha', initiative: 'syn-init-tradebridge-mthatha', owner: 'syn-person-sipho', status: 'draft', created_at: '2026-07-20', updated_at: '2026-07-21' },
  { id: 'syn-work-504', title: 'Buyer-matching pilot (blocked: no verified producers)', town: 'mthatha', initiative: 'syn-init-tradebridge-mthatha', owner: 'syn-person-sipho', status: 'draft', created_at: '2026-08-05', updated_at: '2026-08-06' },
  // Green Streets ECD (capacity)
  { id: 'syn-work-601', title: 'ECD operator verification round 1 (4→11)', town: 'phuthaditjhaba', initiative: 'syn-init-ecd-phuthaditjhaba', owner: 'syn-person-amahle', status: 'published', created_at: '2026-08-11', updated_at: '2026-09-30' },
  { id: 'syn-work-602', title: 'Operator verification round 2 (8 candidates)', town: 'phuthaditjhaba', initiative: 'syn-init-ecd-phuthaditjhaba', owner: 'syn-person-amahle', status: 'approved', created_at: '2026-09-25', updated_at: '2026-10-07' },
  { id: 'syn-work-603', title: 'Facility compliance checks (blocked: awaiting inspection)', town: 'phuthaditjhaba', initiative: 'syn-init-ecd-phuthaditjhaba', owner: 'syn-person-amahle', status: 'draft', created_at: '2026-09-15', updated_at: '2026-09-16' },
  // Care Collective (scenario C — proof gap)
  { id: 'syn-work-701', title: 'Care visits — September round (9 households)', town: 'bushbuckridge', initiative: 'syn-init-care-bushbuckridge', owner: 'syn-person-bongani', status: 'approved', created_at: '2026-09-03', updated_at: '2026-09-29' },
  { id: 'syn-work-702', title: 'Proof-recovery sweep (5 missing proofs)', town: 'bushbuckridge', initiative: 'syn-init-care-bushbuckridge', owner: 'syn-person-bongani', status: 'submitted', created_at: '2026-10-02', updated_at: '2026-10-09' },
  // Market Link (scenario G — opportunity)
  { id: 'syn-work-801', title: 'Aggregate Klerksdorp repair demand', town: 'klerksdorp', initiative: 'syn-init-marketlink-klerksdorp', owner: 'syn-person-kagiso', status: 'published', created_at: '2026-09-12', updated_at: '2026-10-04' },
  { id: 'syn-work-802', title: 'Cross-town supply pilot design (Klerksdorp↔Senekal)', town: 'klerksdorp', initiative: 'syn-init-marketlink-klerksdorp', owner: 'syn-person-kagiso', status: 'draft', created_at: '2026-10-08', updated_at: '2026-10-08' },
];

// ---------- signals ----------
export const SIGNALS: SynSignal[] = [
  { id: 'syn-signal-801', title: '31 repair demand signals from Klerksdorp businesses', town: 'klerksdorp', created_by: 'syn-person-kagiso', created_at: '2026-09-12', status: 'triaged' },
  { id: 'syn-signal-802', title: 'Businesses report 2-week waits for verified artisans', town: 'klerksdorp', created_by: 'syn-person-kagiso', created_at: '2026-09-27', status: 'open' },
  { id: 'syn-signal-201', title: 'Repair demand exceeds verified supply (Senekal)', town: 'senekal', created_by: 'syn-person-thabo', created_at: '2026-09-05', status: 'triaged' },
  { id: 'syn-signal-601', title: '44 children awaiting ECD placement (QwaQwa)', town: 'phuthaditjhaba', created_by: 'syn-person-amahle', created_at: '2026-08-11', status: 'triaged' },
  { id: 'syn-signal-701', title: 'Stipend round approaching without proof backing', town: 'bushbuckridge', created_by: 'syn-person-bongani', created_at: '2026-10-01', status: 'open' },
  { id: 'syn-signal-501', title: 'Buyer enquiries drying up — no verified producers', town: 'mthatha', created_by: 'syn-person-sipho', created_at: '2026-09-20', status: 'open' },
  { id: 'syn-signal-101', title: 'Commission demand rising from local business', town: 'soweto', created_by: 'syn-person-naledi', created_at: '2026-10-04', status: 'open' },
];

// ---------- proofs ----------
export const PROOFS: SynProof[] = [
  { id: 'syn-proof-110', work_id: 'syn-work-101', town: 'soweto', state: 'verified', created_at: '2026-09-28', note: 'Broadcast cut + client sign-off' },
  { id: 'syn-proof-111', work_id: 'syn-work-102', town: 'soweto', state: 'verified', created_at: '2026-10-02', note: 'Guild roster + first paid gig receipts' },
  { id: 'syn-proof-112', work_id: 'syn-work-103', town: 'soweto', state: 'captured', created_at: '2026-10-08', note: 'Attendance register (awaiting review)' },
  { id: 'syn-proof-301', work_id: 'syn-work-201', town: 'senekal', state: 'verified', created_at: '2026-09-12', note: 'Household sign-off sheet ×6' },
  { id: 'syn-proof-302', work_id: 'syn-work-203', town: 'senekal', state: 'verified', created_at: '2026-10-06', note: 'Skills circle assessment ×3' },
  { id: 'syn-proof-303', work_id: 'syn-work-202', town: 'senekal', state: 'verified', created_at: '2026-10-01', note: 'Triage board export' },
  { id: 'syn-proof-304', work_id: 'syn-work-205', town: 'senekal', state: 'captured', created_at: '2026-10-05', note: 'Tool-library inventory photo (pending review)' },
  { id: 'syn-proof-610', work_id: 'syn-work-601', town: 'phuthaditjhaba', state: 'verified', created_at: '2026-09-30', note: 'Operator certificates ×7' },
  { id: 'syn-proof-611', work_id: 'syn-work-602', town: 'phuthaditjhaba', state: 'captured', created_at: '2026-10-07', note: 'Round-2 candidate files' },
  { id: 'syn-proof-710', work_id: 'syn-work-701', town: 'bushbuckridge', state: 'verified', created_at: '2026-09-29', note: '2 of 9 household sign-offs' },
  { id: 'syn-proof-810', work_id: 'syn-work-801', town: 'klerksdorp', state: 'verified', created_at: '2026-10-04', note: 'Demand register export' },
];

// ---------- learnings ----------
export const LEARNINGS: SynLearning[] = [
  { id: 'syn-learning-401', source_proof_id: 'syn-proof-301', town: 'senekal', text: 'Household sign-off sheets double as quality reviews — fold them into the mission template.', created_at: '2026-09-13' },
  { id: 'syn-learning-402', source_proof_id: 'syn-proof-303', town: 'senekal', text: 'A visible triage board cut first-response time by half.', created_at: '2026-10-02' },
  { id: 'syn-learning-403', source_proof_id: 'syn-proof-111', town: 'soweto', text: 'Creators progress fastest when their first paid gig lands inside 30 days.', created_at: '2026-10-03' },
  { id: 'syn-learning-404', source_proof_id: 'syn-proof-710', town: 'bushbuckridge', text: 'Proof capture fails when it is a separate step — it must be part of the visit.', created_at: '2026-09-30' },
];

// ---------- opportunities ----------
export const OPPORTUNITIES: SynOpportunity[] = [
  { id: 'syn-opp-901', title: 'Klerksdorp↔Senekal cross-town supply pilot', town: 'klerksdorp', status: 'open', created_at: '2026-10-08', summary: '31 aggregated demand signals in Klerksdorp meet verified Senekal artisans. A bounded pilot can test whether cross-town supply matching holds.', evidenceHint: ['syn-signal-801', 'syn-signal-802', 'syn-work-202'] },
  { id: 'syn-opp-902', title: 'Municipal food procurement pilot', town: 'senekal', status: 'open', created_at: '2026-09-18', summary: 'Local food gardens could supply a municipal pilot if production capacity is verified.', evidenceHint: ['syn-work-205'] },
  { id: 'syn-opp-903', title: 'Provincial artisan verification lead (Free State)', town: 'senekal', status: 'open', created_at: '2026-10-06', summary: 'Palesa Mokoena has the evidence base to lead artisan verification across Free State towns.', evidenceHint: ['syn-work-201', 'syn-proof-301', 'syn-proof-302'] },
];

// ---------- opening tiles (the operating-intelligence opening) ----------
export const OPENING_TILES = [
  {
    key: 'ATTENTION', headline: '7 initiatives need intervention',
    detail: 'Trade Bridge Mthatha is stalled; Care Collective has a proof gap; 5 more need a decision.',
    href: '/os/national', evidence: ['syn-work-502', 'syn-work-504', 'syn-work-701'],
  },
  {
    key: 'MOMENTUM', headline: 'FrameSouth activated 8 creators',
    detail: 'Soweto creator guild earnings are compounding. Proof quality is the watch-item.',
    href: '/os/initiative/syn-init-framesouth-soweto', evidence: ['syn-work-102', 'syn-proof-111'],
  },
  {
    key: 'CAPACITY', headline: 'QwaQwa needs additional ECD operators',
    detail: '44 children are waiting on 8 missing verified operators in Phuthaditjhaba.',
    href: '/os/initiative/syn-init-ecd-phuthaditjhaba', evidence: ['syn-signal-601', 'syn-work-602'],
  },
  {
    key: 'OPPORTUNITY', headline: 'FixEasy demand is exceeding verified supply',
    detail: 'A Klerksdorp↔Senekal pilot could connect 31 demand signals to verified artisans.',
    href: '/os/opportunity/syn-opp-901', evidence: ['syn-signal-801', 'syn-work-202'],
  },
  {
    key: 'YOUR NEXT MOVE', headline: 'Review the Senekal FixEasy capacity gap',
    detail: 'Recommendation: run a five-person artisan verification mission.',
    href: '/os/town/senekal', evidence: ['syn-work-204', 'syn-signal-201'],
  },
];

export function townBySlug(slug: string) { return TOWNS.find((t) => t.slug === slug) ?? null; }
export function personById(id: string) { return PEOPLE.find((p) => p.id === id) ?? null; }
export function initiativeById(id: string) { return INITIATIVES.find((i) => i.id === id) ?? null; }
export function workById(id: string) { return WORK.find((w) => w.id === id) ?? null; }
export function proofById(id: string) { return PROOFS.find((p) => p.id === id) ?? null; }
export function learningById(id: string) { return LEARNINGS.find((l) => l.id === id) ?? null; }
export function opportunityById(id: string) { return OPPORTUNITIES.find((o) => o.id === id) ?? null; }
