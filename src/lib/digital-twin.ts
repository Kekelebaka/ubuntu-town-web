export type KopanoTruthType = 'FACT' | 'INFERENCE' | 'RECOMMENDATION';
export type FrictionClass = 'REMOVE' | 'EXPLAIN' | 'GUIDE' | 'CONNECT' | 'AUTOMATE' | 'INTELLIGENT';
export type TwinStatus = 'healthy' | 'active' | 'weak_signal' | 'missing_data' | 'blocked' | 'candidate_pending_confirmation';

export interface TownIdentity {
  id: string;
  name: string;
  province?: string | null;
}

export interface TownCounts {
  people: number;
  work: number;
  proofs: number;
  opportunities: number;
  initiatives: number;
  openReviews: number;
  assignments: number;
  memories: number;
}

export interface TownReadinessInput {
  launch_readiness_pct?: number | null;
  coordinator_status?: string | null;
  applicant_count?: number | null;
}

export interface TownTwinInput {
  town: TownIdentity;
  counts: TownCounts;
  readiness?: TownReadinessInput | null;
  recentProofTitles?: string[];
}

export interface EvidenceItem {
  type: KopanoTruthType;
  label: string;
  value: string;
  source: string;
}

export interface TwinDomain {
  status: TwinStatus;
  summary: string;
  missing: string[];
  evidence: EvidenceItem[];
}

export interface TwinBlocker {
  kind: string;
  severity: 'P0' | 'P1' | 'P2';
  explanation: string;
}

export interface TwinRecommendation {
  action: string;
  why: string;
  target: string;
  requiresApproval: boolean;
}

export interface TownTwinState {
  town: TownIdentity;
  readinessScore: number;
  people: TwinDomain;
  economicActivity: TwinDomain;
  assets: TwinDomain;
  opportunities: TwinDomain;
  initiatives: TwinDomain;
  workVelocity: TwinDomain;
  proofQuality: TwinDomain;
  engagement: TwinDomain;
  blockers: TwinBlocker[];
  risk: TwinDomain;
  evidence: EvidenceItem[];
  topRecommendations: TwinRecommendation[];
}

export interface ReadinessComponent {
  key: 'people' | 'opportunities' | 'work' | 'proof' | 'engagement' | 'learning';
  label: string;
  points: number;
  max: number;
  evidence: string;
  missing: string[];
}

export interface ReadinessExplanation {
  score: number;
  components: ReadinessComponent[];
  fastestLegitimateActions: string[];
}

export interface KopanoSection {
  type: KopanoTruthType;
  items: string[];
}

export interface KopanoAnswer {
  question: string;
  sections: KopanoSection[];
  traceIds: string[];
  caveats: string[];
  proposedMutations: string[];
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export function explainTownReadiness(counts: Pick<TownCounts, 'people' | 'opportunities' | 'memories'> & {
  publishedWork: number;
  proofCount: number;
  activeAssignments: number;
}): ReadinessExplanation {
  const components: ReadinessComponent[] = [
    {
      key: 'people',
      label: 'People confirmed',
      points: counts.people > 0 ? 10 : 0,
      max: 20,
      evidence: `${counts.people} people/coordinator records visible`,
      missing: counts.people > 0 ? ['human confirmation state', 'onboarding state'] : ['candidate or coordinator record'],
    },
    {
      key: 'opportunities',
      label: 'Opportunity map',
      points: counts.opportunities > 0 ? 15 : 0,
      max: 15,
      evidence: `${counts.opportunities} opportunity points captured`,
      missing: counts.opportunities > 0 ? [] : ['local opportunities'],
    },
    {
      key: 'work',
      label: 'Work velocity',
      points: counts.publishedWork > 0 ? 20 : 0,
      max: 20,
      evidence: `${counts.publishedWork} published work records`,
      missing: counts.publishedWork > 0 ? [] : ['published work'],
    },
    {
      key: 'proof',
      label: 'Proof quality',
      points: counts.proofCount > 0 ? 20 : 0,
      max: 20,
      evidence: `${counts.proofCount} proofs attached`,
      missing: counts.proofCount > 0 ? [] : ['photo/GPS/contact proof'],
    },
    {
      key: 'engagement',
      label: 'Active assignments',
      points: counts.activeAssignments > 0 ? 15 : 0,
      max: 15,
      evidence: `${counts.activeAssignments} active assignments`,
      missing: counts.activeAssignments > 0 ? [] : ['assigned next actions'],
    },
    {
      key: 'learning',
      label: 'Memory / learning',
      points: counts.memories > 0 ? 10 : 0,
      max: 10,
      evidence: `${counts.memories} memory records`,
      missing: counts.memories > 0 ? [] : ['verified learning/memory entry'],
    },
  ];

  const fastestLegitimateActions = [
    counts.people === 0 ? 'Identify and confirm the accountable coordinator or candidate.' : 'Confirm the candidate/person is correctly paired to this town.',
    counts.opportunities === 0 ? 'Capture one real opportunity or blocker from the town.' : 'Convert the strongest opportunity into a work item.',
    counts.proofCount === 0 ? 'Submit one photo/GPS/contact-backed proof for current work.' : 'Review proof quality and convert learning into memory.',
  ];

  return { score: clamp(components.reduce((sum, c) => sum + c.points, 0)), components, fastestLegitimateActions };
}

function domain(status: TwinStatus, summary: string, missing: string[] = [], evidence: EvidenceItem[] = []): TwinDomain {
  return { status, summary, missing, evidence };
}

export function buildTownTwin(input: TownTwinInput): TownTwinState {
  const { town, counts } = input;
  const readinessScore = input.readiness?.launch_readiness_pct ?? explainTownReadiness({
    people: counts.people,
    opportunities: counts.opportunities,
    publishedWork: counts.work,
    proofCount: counts.proofs,
    activeAssignments: counts.assignments,
    memories: counts.memories,
  }).score;

  const evidence: EvidenceItem[] = [
    { type: 'FACT', label: 'Town', value: town.name, source: `town:${town.id}` },
    { type: 'FACT', label: 'People records', value: String(counts.people), source: 'coordinators/role_assignments' },
    { type: 'FACT', label: 'Work records', value: String(counts.work), source: 'community_work' },
    { type: 'FACT', label: 'Proof records', value: String(counts.proofs), source: 'proofs' },
    { type: 'FACT', label: 'Readiness score', value: String(readinessScore), source: 'town_readiness + derived explanation' },
  ];

  const blockers: TwinBlocker[] = [];
  if (counts.people === 0 || input.readiness?.coordinator_status === 'pending') {
    blockers.push({ kind: 'people_confirmation', severity: 'P1', explanation: 'The town has no confirmed active coordinator state yet.' });
  }
  if (counts.opportunities === 0) blockers.push({ kind: 'missing_opportunity_map', severity: 'P1', explanation: 'No local opportunity points are captured, so Kopano cannot infer initiative readiness.' });
  if (counts.proofs === 0) blockers.push({ kind: 'weak_proof_loop', severity: 'P1', explanation: 'No proof is attached, so progress is not yet verifiable.' });
  if (counts.memories === 0) blockers.push({ kind: 'learning_loop_open', severity: 'P2', explanation: 'No memory record closes the observe/prove/learn loop.' });

  const topRecommendations: TwinRecommendation[] = [
    {
      action: counts.people > 0 ? `Confirm ${town.name}'s coordinator/candidate pairing and onboarding state.` : `Find and record the accountable coordinator/candidate for ${town.name}.`,
      why: 'People readiness unlocks legitimate access and accountable execution.',
      target: 'people-readiness',
      requiresApproval: false,
    },
    {
      action: counts.opportunities > 0 ? 'Turn the strongest opportunity into a clear workpack.' : 'Capture the strongest real signal/opportunity/blocker in the town.',
      why: 'The operating loop starts from a signal that can become work.',
      target: 'signals/opportunities',
      requiresApproval: false,
    },
    {
      action: counts.proofs > 0 ? 'Review the latest proof and write the learning into the town memory.' : 'Submit one verifiable proof for the highest-priority work.',
      why: 'Proof and learning are what make the twin update honestly.',
      target: 'proof/memory',
      requiresApproval: false,
    },
  ];

  return {
    town,
    readinessScore,
    people: domain(counts.people > 0 ? 'candidate_pending_confirmation' : 'missing_data', `${counts.people} people/coordinator records visible`, counts.people > 0 ? ['human-confirmed state'] : ['coordinator/candidate'], evidence.slice(1, 2)),
    economicActivity: domain('missing_data', 'Economic activity is not yet attributable from current workspace counts.', ['business/trader activity', 'finance/economy metrics']),
    assets: domain('missing_data', 'Town assets require passport/profile evidence.', ['asset inventory']),
    opportunities: domain(counts.opportunities > 0 ? 'active' : 'missing_data', `${counts.opportunities} opportunity points captured`, counts.opportunities > 0 ? [] : ['opportunity points']),
    initiatives: domain(counts.initiatives > 0 ? 'weak_signal' : 'missing_data', `${counts.initiatives} Blueprint initiatives available; per-town activation still needs evidence`, ['per-town initiative readiness']),
    workVelocity: domain(counts.work > 0 ? 'active' : 'weak_signal', `${counts.work} work records`, counts.work > 0 ? [] : ['first work item']),
    proofQuality: domain(counts.proofs > 0 ? 'active' : 'missing_data', `${counts.proofs} proof records${input.recentProofTitles?.length ? `: ${input.recentProofTitles.join(', ')}` : ''}`, counts.proofs > 0 ? [] : ['verifiable proof']),
    engagement: domain(counts.assignments > 0 ? 'active' : 'weak_signal', `${counts.assignments} open assignments and ${counts.openReviews} open reviews`, counts.assignments > 0 ? [] : ['assigned next action']),
    blockers,
    risk: domain(blockers.length > 0 ? 'blocked' : 'healthy', blockers.length ? `${blockers.length} blockers need attention` : 'No major blockers from supplied counts', []),
    evidence,
    topRecommendations,
  };
}

export function answerKopanoQuestion(question: string, twin: TownTwinState): KopanoAnswer {
  const strongestBlocker = twin.blockers[0];
  return {
    question,
    sections: [
      {
        type: 'FACT',
        items: [
          `${twin.town.name}${twin.town.province ? `, ${twin.town.province}` : ''}: readiness ${twin.readinessScore}/100.`,
          twin.people.summary,
          twin.workVelocity.summary,
          twin.proofQuality.summary,
        ],
      },
      {
        type: 'INFERENCE',
        items: [
          strongestBlocker
            ? `${twin.town.name} is constrained by ${strongestBlocker.kind}: ${strongestBlocker.explanation}`
            : `${twin.town.name} has no blocker in the current supplied state.`,
          twin.opportunities.status === 'missing_data'
            ? 'Initiative readiness cannot be inferred yet because local opportunities are missing.'
            : 'There is enough opportunity signal to shape the next workpack.',
        ],
      },
      {
        type: 'RECOMMENDATION',
        items: twin.topRecommendations.map((r, i) => `${i + 1}. ${r.action} Why: ${r.why}`),
      },
    ],
    traceIds: [`town:${twin.town.id}`, ...twin.evidence.map(e => e.source)],
    caveats: ['Missing data is shown explicitly. Kopano must not fabricate people, proof, opportunities or finance records.'],
    proposedMutations: twin.topRecommendations.filter(r => r.requiresApproval).map(r => r.action),
  };
}

export function classifyFriction(text: string): FrictionClass {
  const t = text.toLowerCase();
  if (/(duplicate|stale|remove|clutter)/.test(t)) return 'REMOVE';
  if (/(why|calculated|score|unexplained|meaning)/.test(t)) return 'EXPLAIN';
  if (/(empty|dead end|what now|next action|confusion)/.test(t)) return 'GUIDE';
  if (/(someone|anonymous|actor|identity|link|trace)/.test(t)) return 'CONNECT';
  if (/(automatic|queue|reminder|draft|assign)/.test(t)) return 'AUTOMATE';
  return 'INTELLIGENT';
}
