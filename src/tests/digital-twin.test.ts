import { describe, expect, it } from 'vitest';
import {
  buildTownTwin,
  explainTownReadiness,
  answerKopanoQuestion,
  classifyFriction,
} from '../lib/digital-twin';

describe('Ubuntu Town digital twin convergence helpers', () => {
  it('builds a town twin without fabricating missing state', () => {
    const twin = buildTownTwin({
      town: { id: 'ladybrand', name: 'Ladybrand', province: 'Free State' },
      counts: { people: 1, work: 2, proofs: 1, opportunities: 0, initiatives: 13, openReviews: 1, assignments: 0, memories: 0 },
      readiness: { launch_readiness_pct: 20, coordinator_status: 'pending', applicant_count: 1 },
      recentProofTitles: ['Daycare visit photo'],
    });

    expect(twin.town.name).toBe('Ladybrand');
    expect(twin.people.status).toBe('candidate_pending_confirmation');
    expect(twin.opportunities.status).toBe('missing_data');
    expect(twin.blockers[0].kind).toBe('people_confirmation');
    expect(twin.topRecommendations[0].action).toContain('Confirm');
    expect(twin.evidence.some(e => e.type === 'FACT')).toBe(true);
  });

  it('explains readiness from attributable components and fastest legitimate actions', () => {
    const explanation = explainTownReadiness({
      people: 1,
      opportunities: 0,
      publishedWork: 0,
      proofCount: 0,
      activeAssignments: 0,
      memories: 0,
    });

    expect(explanation.score).toBe(10);
    expect(explanation.components.map(c => c.key)).toEqual(['people', 'opportunities', 'work', 'proof', 'engagement', 'learning']);
    expect(explanation.components.find(c => c.key === 'proof')?.evidence).toContain('0 proofs');
    expect(explanation.fastestLegitimateActions[0]).toContain('Confirm');
  });

  it('formats Kopano answers as FACT, INFERENCE and RECOMMENDATION only from supplied state', () => {
    const twin = buildTownTwin({
      town: { id: 'ladybrand', name: 'Ladybrand', province: 'Free State' },
      counts: { people: 1, work: 0, proofs: 0, opportunities: 0, initiatives: 13, openReviews: 0, assignments: 0, memories: 0 },
      readiness: { launch_readiness_pct: 10, coordinator_status: 'pending', applicant_count: 1 },
      recentProofTitles: [],
    });
    const answer = answerKopanoQuestion('What is happening in Ladybrand, what is stopping progress, and what should we do tomorrow?', twin);

    expect(answer.sections.map(s => s.type)).toEqual(['FACT', 'INFERENCE', 'RECOMMENDATION']);
    expect(answer.sections[0].items.join(' ')).toContain('Ladybrand');
    expect(answer.traceIds).toContain('town:ladybrand');
    expect(answer.caveats.join(' ')).toContain('Missing data is shown explicitly');
  });

  it('classifies experience archaeology with the required friction classes', () => {
    expect(classifyFriction('unexplained score')).toBe('EXPLAIN');
    expect(classifyFriction('dead end empty state')).toBe('GUIDE');
    expect(classifyFriction('generic Someone actor')).toBe('CONNECT');
    expect(classifyFriction('Kopano reasoning')).toBe('INTELLIGENT');
  });
});
