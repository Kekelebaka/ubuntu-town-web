// src/lib/experience/stories.ts — EXPERIENCE 001 intelligence statements.
// Every statement is shaped as PulseStatement (src/lib/pulse/types.ts) so the EXISTING
// five-mode projection (projectMode: OBSERVE/EXPLAIN/CHALLENGE/COACH/ACT) and the
// acceptance contract apply unchanged. ⚠ SYNTHETIC DEMO CONTENT.
// Evidence arrays reference universe row ids ONLY (verified by src/tests/experience-universe.test.ts).
// Claims that cannot be supported return kind:'insufficient_evidence' — that is a feature (§17).

import type { PulseStatement } from '@/lib/pulse/types';

export type Mode = 'OBSERVE' | 'EXPLAIN' | 'CHALLENGE' | 'COACH' | 'ACT';
export const MODE_QUESTIONS: Record<Mode, string> = {
  OBSERVE: 'What is happening?',
  EXPLAIN: 'Why is it happening?',
  CHALLENGE: 'What assumption or risk should we question?',
  COACH: 'How should the human improve?',
  ACT: 'What action could be taken?',
};

const s = (
  interpretation: string, evidence: string[], capabilityImplication: string | null,
  nextAction: { action: string; owner: string; reviewPoint: string } | null,
  owner: string | null, reviewPoint: string | null,
): PulseStatement => ({ kind: 'signal', interpretation, evidence, capabilityImplication, nextAction, owner, reviewPoint });

const ins = (reason: string, evidence: string[], whatIsMissing: string, howToCollect: string): PulseStatement => ({
  kind: 'insufficient_evidence', interpretation: 'INSUFFICIENT EVIDENCE', evidence,
  capabilityImplication: null, nextAction: null, owner: null, reviewPoint: null,
  reason: `${reason} Missing: ${whatIsMissing}. How to collect: ${howToCollect}.`,
});

// ---------- NATIONAL ----------
export const NATIONAL_STATEMENTS: PulseStatement[] = [
  s('The network is moving: 3 initiatives are accelerating and 1 is stalled.',
    ['syn-work-102', 'syn-work-601', 'syn-work-502'],
    'Operating rhythm is real but uneven — intervention quality is the constraint.',
    { action: 'Hold a national intervention review on the 4 at-risk initiatives', owner: 'national lead', reviewPoint: 'next national heartbeat' },
    'national lead', 'next national heartbeat'),
  s('Capacity gaps are the dominant constraint: verified supply trails demand in 4 of 6 initiatives.',
    ['syn-signal-201', 'syn-signal-601', 'syn-signal-801'],
    'Verification capacity — not demand generation — limits the flywheel.',
    { action: 'Fund two verification rounds (artisan + ECD operator)', owner: 'national capacity desk', reviewPoint: 'after verification round 1 completes' },
    'national capacity desk', 'after verification round 1 completes'),
  s('Proof discipline is uneven: Care Collective paid out on 2 of 9 proofs.',
    ['syn-work-701', 'syn-proof-710'],
    'Payment without proof breaks the trust model.',
    { action: 'Run a proof-recovery mission before the next stipend round', owner: 'Bushbuckridge coordinator', reviewPoint: 'before stipend round 2' },
    'Bushbuckridge coordinator', 'before stipend round 2'),
  ins('Cross-town opportunity claims are not yet tested.',
    ['syn-signal-801'],
    'a completed cross-town pilot with outcome proof',
    'run the bounded Klerksdorp↔Senekal pilot mission and capture outcome proof'),
];

// ---------- PROVINCE (parametric) ----------
export function provinceStatements(slug: string): PulseStatement[] {
  const map: Record<string, PulseStatement[]> = {
    'free-state': [
      s('Senekal is the province\'s most evidenced town: verified proofs on the majority of its completed work.',
        ['syn-proof-301', 'syn-proof-302', 'syn-proof-303'],
        'Senekal can carry provincial verification load.',
        { action: 'Appoint Senekal as Free State artisan verification hub', owner: 'provincial lead', reviewPoint: 'next provincial review' },
        'provincial lead', 'next provincial review'),
      s('Phuthaditjhaba capacity gap: 44 children waiting on 8 missing verified ECD operators.',
        ['syn-signal-601', 'syn-work-602'],
        'Capacity, not demand, is the provincial constraint.',
        { action: 'Fund ECD operator verification round 2', owner: 'provincial capacity desk', reviewPoint: 'after round 2' },
        'provincial capacity desk', 'after round 2'),
    ],
    'gauteng': [
      s('Soweto\'s FrameSouth is the network\'s momentum leader: 8 creators activated, earnings compounding.',
        ['syn-work-102', 'syn-proof-111'],
        'Guild activation is the repeatable mechanism.',
        { action: 'Document the FrameSouth activation playbook for other towns', owner: 'provincial lead', reviewPoint: 'next provincial review' },
        'provincial lead', 'next provincial review'),
    ],
    'north-west': [
      s('Klerksdorp demand aggregation surfaced 31 repair signals against 3 verified suppliers.',
        ['syn-signal-801', 'syn-work-801'],
        'Demand sensing works; supply verification is absent.',
        { action: 'Open supply verification in Klerksdorp or connect to Senekal supply', owner: 'provincial lead', reviewPoint: 'pilot decision point' },
        'provincial lead', 'pilot decision point'),
    ],
    'mpumalanga': [
      s('Bushbuckridge care work is landing but its evidence is not: 2 of 9 proofs verified.',
        ['syn-work-701', 'syn-proof-710'],
        'Proof capture is the provincial risk.',
        { action: 'Coach the coordinator on in-visit proof capture', owner: 'provincial lead', reviewPoint: 'proof rate ≥ 80%' },
        'provincial lead', 'proof rate ≥ 80%'),
    ],
    'eastern-cape': [
      s('Mthatha\'s Trade Bridge is stalled: activity without outcome for 5 blocked works.',
        ['syn-work-502', 'syn-work-504', 'syn-signal-501'],
        'Coordinator-level intervention is required.',
        { action: 'Run an intervention review on Trade Bridge', owner: 'provincial lead', reviewPoint: '2 weeks' },
        'provincial lead', '2 weeks'),
    ],
  };
  return map[slug] ?? [
    ins(`No province-level operating evidence is available for this province yet.`, [],
      'at least one town work or signal row',
      'open a town workspace and record the first mission'),
  ];
}

// ---------- TOWN (parametric) ----------
export function townStatements(slug: string): PulseStatement[] {
  const map: Record<string, PulseStatement[]> = {
    senekal: [
      s('The current constraint is verified artisan capacity — 31 demand signals against 8 verified artisans.',
        ['syn-signal-201', 'syn-work-202'],
        'The town can absorb more work if verification capacity grows.',
        { action: 'Run an artisan verification mission', owner: 'town lead', reviewPoint: 'after the verification mission' },
        'town lead', 'after the verification mission'),
      s('People are moving: 2 active builders with verified proof; 1 emerging capability (Palesa Mokoena).',
        ['syn-person-palesa', 'syn-proof-301', 'syn-proof-302'],
        'Evidence supports progression to initiative lead.',
        { action: 'Progress Palesa Mokoena to Initiative Lead', owner: 'town lead', reviewPoint: 'next weekly heartbeat' },
        'town lead', 'next weekly heartbeat'),
    ],
    soweto: [
      s('Momentum is compounding: 8 creators activated and 14 media works published.',
        ['syn-work-102', 'syn-work-101'],
        'Guild activation is working.',
        { action: 'Consolidate proof quality before expanding', owner: 'town lead', reviewPoint: 'proof backlog cleared' },
        'town lead', 'proof backlog cleared'),
    ],
    phuthaditjhaba: [
      s('Capacity gap: 44 children awaiting placement against 11 verified ECD operators.',
        ['syn-signal-601', 'syn-work-601'],
        'Verification throughput is the constraint.',
        { action: 'Fund operator verification round 2', owner: 'town lead', reviewPoint: 'after round 2' },
        'town lead', 'after round 2'),
    ],
    mthatha: [
      s('Activity without outcomes: 6 works active, 5 blocked > 30 days.',
        ['syn-work-502', 'syn-work-503', 'syn-work-504'],
        'Coordination failure, not effort failure.',
        { action: 'Intervene at coordinator level', owner: 'town lead', reviewPoint: '2 weeks' },
        'town lead', '2 weeks'),
    ],
    bushbuckridge: [
      s('Work happened; the evidence did not — 5 of 9 proofs missing before the stipend round.',
        ['syn-work-701', 'syn-proof-710', 'syn-signal-701'],
        'Proof capture must become part of the visit itself.',
        { action: 'Run a proof-recovery mission', owner: 'town coordinator', reviewPoint: 'before stipend round 2' },
        'town coordinator', 'before stipend round 2'),
    ],
    klerksdorp: [
      s('Demand sensing is strong (31 signals); verified supply is almost absent (3).',
        ['syn-signal-801', 'syn-signal-802', 'syn-work-801'],
        'Either build local supply or connect cross-town supply.',
        { action: 'Propose the Klerksdorp↔Senekal pilot', owner: 'town lead', reviewPoint: 'pilot decision point' },
        'town lead', 'pilot decision point'),
    ],
  };
  return map[slug] ?? [
    ins('This town has no operating rows yet — nothing can be honestly claimed about it.', [],
      'a first mission, signal or work row',
      'open the town workspace and record the first mission'),
  ];
}

// ---------- INITIATIVE (scenario stories) ----------
export function initiativeStatements(id: string): PulseStatement[] {
  const map: Record<string, PulseStatement[]> = {
    'syn-init-fixeasy-senekal': [
      s('Demand exists (31 signals). Supply verification is the bottleneck (8 verified of 21 required).',
        ['syn-signal-201', 'syn-work-202', 'syn-work-204'],
        'Supply-capacity constraint, not a demand-generation constraint.',
        { action: 'Run a five-person artisan verification mission', owner: 'Palesa Mokoena (workstream lead)', reviewPoint: 'after the verification mission' },
        'Palesa Mokoena (workstream lead)', 'after the verification mission'),
      s('Three active builders have relevant completed work but have not been assessed for the next capability level.',
        ['syn-person-palesa', 'syn-person-thabo', 'syn-work-201', 'syn-work-202'],
        'Progression is blocked on assessment, not on performance.',
        { action: 'Schedule capability assessments for 3 builders', owner: 'town lead', reviewPoint: 'next weekly heartbeat' },
        'town lead', 'next weekly heartbeat'),
    ],
    'syn-init-framesouth-soweto': [
      s('Activation is compounding: 8 creators activated, 14 works published, R96 200 earned.',
        ['syn-work-102', 'syn-work-101', 'syn-proof-111'],
        'Growth is outrunning evidence capture.',
        { action: 'Clear the proof backlog (3 pending, 2 missing)', owner: 'Naledi Khumalo', reviewPoint: 'proof backlog cleared' },
        'Naledi Khumalo', 'proof backlog cleared'),
    ],
    'syn-init-ecd-phuthaditjhaba': [
      s('44 children are waiting on 8 missing verified operators.',
        ['syn-signal-601', 'syn-work-602', 'syn-proof-611'],
        'Verification throughput is the constraint.',
        { action: 'Fund a second operator verification round', owner: 'Amahle Zwane', reviewPoint: 'after round 2' },
        'Amahle Zwane', 'after round 2'),
    ],
    'syn-init-tradebridge-mthatha': [
      s('Stalled: 5 of 15 works blocked > 30 days, 8 proofs missing, buyer enquiries falling.',
        ['syn-work-502', 'syn-work-504', 'syn-signal-501'],
        'This is a coordination failure requiring intervention.',
        { action: 'Run a coordinator intervention review', owner: 'provincial lead', reviewPoint: '2 weeks' },
        'provincial lead', '2 weeks'),
      ins('The cause of the stall cannot be determined from current evidence.',
        ['syn-work-504'],
        'blocked-work reason codes and a coordinator 1:1 note',
        'add a reason to each blocked work and capture the review note as proof'),
    ],
    'syn-init-care-bushbuckridge': [
      s('Work happened (7 of 9 visits) but evidence did not (2 of 9 proofs verified).',
        ['syn-work-701', 'syn-proof-710'],
        'Payment without proof breaks the trust model.',
        { action: 'Run a proof-recovery mission before stipend round 2', owner: 'Bongani Nkosi', reviewPoint: 'before stipend round 2' },
        'Bongani Nkosi', 'before stipend round 2'),
    ],
    'syn-init-marketlink-klerksdorp': [
      s('Cross-town signals suggest a pilot: 31 Klerksdorp demand signals meet verified Senekal supply.',
        ['syn-signal-801', 'syn-signal-802', 'syn-work-202'],
        'Untested opportunity — evidence supports a bounded test, not a rollout.',
        { action: 'Propose the Klerksdorp↔Senekal cross-town pilot', owner: 'Kagiso Molefe', reviewPoint: 'pilot decision point' },
        'Kagiso Molefe', 'pilot decision point'),
    ],
  };
  return map[id] ?? [ins('No initiative-level evidence exists.', [], 'initiative work or signal rows', 'record the initiative\'s first mission')];
}

// ---------- PERSON (Proof Profile) ----------
export function personStatements(id: string): PulseStatement[] {
  const map: Record<string, PulseStatement[]> = {
    'syn-person-palesa': [
      s('Palesa is moving: 6 verified repair missions, 3 artisans trained, 2 verified proofs.',
        ['syn-work-201', 'syn-work-203', 'syn-proof-301', 'syn-proof-302'],
        'Demonstrated delivery + leadership capability.',
        { action: 'Progress to Initiative Lead', owner: 'town lead', reviewPoint: 'next weekly heartbeat' },
        'town lead', 'next weekly heartbeat'),
    ],
    'syn-person-thabo': [
      s('Thabo delivers consistently (12 completed repairs) but has limited leadership evidence.',
        ['syn-work-202', 'syn-proof-303'],
        'Pairing before scaling.',
        { action: 'Pair with a commercial mentor before cross-town scaling', owner: 'town lead', reviewPoint: 'pilot decision point' },
        'town lead', 'pilot decision point'),
    ],
    'syn-person-naledi': [
      s('Naledi activated 8 creators and published 14 works — momentum evidence is strong.',
        ['syn-work-102', 'syn-work-101', 'syn-proof-111'],
        'Ambassador-level evidence is forming.',
        { action: 'Hold scope; consolidate proof quality', owner: 'provincial lead', reviewPoint: 'proof backlog cleared' },
        'provincial lead', 'proof backlog cleared'),
    ],
    'syn-person-sipho': [
      ins('Sipho requested Town Lead scope, but the evidence supports operator-level scope only.',
        ['syn-work-501'],
        'outcome evidence (completed works with verified proof), not activity evidence',
        'carry 2 works to published with verified proof, then re-request scope'),
    ],
    'syn-person-amahle': [
      s('Amahle grew verified ECD capacity from 4 to 11 operators.',
        ['syn-work-601', 'syn-proof-610'],
        'Capacity-building capability demonstrated.',
        { action: 'Fund verification round 2 under her lead', owner: 'provincial capacity desk', reviewPoint: 'after round 2' },
        'provincial capacity desk', 'after round 2'),
    ],
    'syn-person-bongani': [
      s('Bongani\'s care coordination is trusted, but his proof capture rate is 22%.',
        ['syn-work-701', 'syn-proof-710'],
        'Coach on evidence discipline before scope growth.',
        { action: 'Coach on in-visit proof capture', owner: 'town lead', reviewPoint: 'proof rate ≥ 80%' },
        'town lead', 'proof rate ≥ 80%'),
    ],
    'syn-person-kagiso': [
      s('Kagiso surfaced 31 demand signals — market sensing capability demonstrated.',
        ['syn-signal-801', 'syn-signal-802', 'syn-work-801'],
        'Ready to run a bounded pilot.',
        { action: 'Run the cross-town pilot as a bounded mission', owner: 'town lead', reviewPoint: 'pilot decision point' },
        'town lead', 'pilot decision point'),
    ],
  };
  return map[id] ?? [ins('No person-level evidence exists.', [], 'work or proof rows attributed to this person', 'complete a first mission with proof')];
}

// ---------- flywheel stages (§14) ----------
export const FLYWHEEL = [
  { stage: 'DISCOVER', copy: 'Signals from the town surface real demand.', href: '/os/town/senekal', evidence: ['syn-signal-201'] },
  { stage: 'MISSION', copy: 'A mission turns demand into accountable work.', href: '/os/mission/syn-work-204', evidence: ['syn-work-204'] },
  { stage: 'WORK', copy: 'People do the work — tracked, scoped, owned.', href: '/os/mission/syn-work-201', evidence: ['syn-work-201'] },
  { stage: 'PROOF', copy: 'Work becomes evidence — signed, captured, verified.', href: '/os/proof/syn-proof-301', evidence: ['syn-proof-301'] },
  { stage: 'LEARNING', copy: 'Proof becomes transferable learning.', href: '/os/learning/syn-learning-401', evidence: ['syn-learning-401'] },
  { stage: 'OPPORTUNITY', copy: 'Capability opens real economic opportunity.', href: '/os/opportunity/syn-opp-903', evidence: ['syn-opp-903'] },
  { stage: 'UBUNTU PASSPORT', copy: 'Your evidence travels with you. Evidence moves you — time served does not.', href: '/os/person/syn-person-palesa', evidence: ['syn-proof-301', 'syn-proof-302'] },
];
