import { describe, it, expect } from 'vitest';
import {
  buildLearningRecord,
  buildSupersedingLearning,
  LearningInput,
  ActorScope,
  LearningValidationError,
  UnauthorizedLearningError,
  CrossTownLearningError,
  CrossInitiativeLearningError,
} from '@/lib/learnings/write';

const NATIONAL: ActorScope = { userId: 'user-national', isNational: true, townIds: [], initiativeKeys: [] };
const COORD_A: ActorScope = { userId: 'user-a', isNational: false, townIds: ['town-a'], initiativeKeys: ['kasibuy'] };
const COORD_B: ActorScope = { userId: 'user-b', isNational: false, townIds: ['town-b'], initiativeKeys: [] };

function base(over: Partial<LearningInput> = {}): LearningInput {
  return {
    statement: 'Demand for agricultural inputs in Senekal is unconfirmed.',
    truth_class: 'INSUFFICIENT_EVIDENCE',
    scope_level: 'town',
    town_id: 'town-a',
    initiative_key: 'kasibuy',
    evidence_refs: ['opp-senekal-agriculture_green_economy'],
    source: 'passport-snapshot@1.0.0',
    passport_delta: {
      field: 'initiative_fit.kasibuy',
      truth_class: 'INSUFFICIENT_EVIDENCE',
      reason: 'not yet field-verified',
      evidence_refs: ['va-senekal-initiatives'],
      source: 'FieldPack FS181',
      timestamp: '2026-10-12T00:00:00Z',
      human_decision_status: 'PROPOSED',
    },
    ...over,
  };
}

describe('application learning write path (governed record builder)', () => {
  it('authorised learning creation builds an active, versioned record', () => {
    const rec = buildLearningRecord(base(), COORD_A);
    expect(rec.author_id).toBe('user-a');
    expect(rec.status).toBe('active');
    expect(rec.version).toBe(1);
    expect(rec.supersedes).toBeNull();
  });

  it('preserves provenance (source + chain + version + recorded_at)', () => {
    const rec = buildLearningRecord(base(), COORD_A);
    expect(rec.provenance.source).toBe('passport-snapshot@1.0.0');
    expect(String(rec.provenance.chain)).toContain('LEARNING');
    expect(rec.provenance.version).toBe(1);
    expect(rec.provenance.recorded_at).toBeTruthy();
  });

  it('enforces truth class vocabulary', () => {
    expect(() => buildLearningRecord(base({ truth_class: 'MAYBE' as any }), COORD_A))
      .toThrow(LearningValidationError);
  });

  it('requires evidence_refs unless truth_class is AUTHORED', () => {
    expect(() => buildLearningRecord(base({ evidence_refs: [] }), COORD_A))
      .toThrow(LearningValidationError);
    // AUTHORED with empty evidence is allowed (learning.schema.json anyOf)
    const rec = buildLearningRecord(base({ truth_class: 'AUTHORED', evidence_refs: [] }), COORD_A);
    expect(rec.truth_class).toBe('AUTHORED');
  });

  it('keeps INSUFFICIENT_EVIDENCE explicit when evidence is absent (no fabrication)', () => {
    const rec = buildLearningRecord(base({ evidence_refs: ['none-available'], truth_class: 'INSUFFICIENT_EVIDENCE' }), COORD_A);
    expect(rec.truth_class).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('accepts a valid Passport Delta and keeps it distinct from BMC Delta', () => {
    const rec = buildLearningRecord(base({
      bmc_delta: {
        field: 'value_proposition', truth_class: 'HYPOTHESIS',
        reason: 'untested', evidence_refs: ['e1'], source: 'bmc',
        timestamp: '2026-10-12T00:00:00Z', human_decision_status: 'PROPOSED',
      },
    }), COORD_A);
    expect(rec.passport_delta?.field).toBe('initiative_fit.kasibuy');
    expect(rec.bmc_delta?.field).toBe('value_proposition');
    expect(rec.bmc_delta).not.toEqual(rec.passport_delta);
  });

  it('rejects malformed Passport/BMC deltas (missing reason/source/evidence)', () => {
    const bad: any = { field: 'x', truth_class: 'HYPOTHESIS', timestamp: 't', human_decision_status: 'PROPOSED' };
    expect(() => buildLearningRecord(base({ passport_delta: bad }), COORD_A)).toThrow(LearningValidationError);
    expect(() => buildLearningRecord(base({ bmc_delta: bad }), COORD_A)).toThrow(LearningValidationError);
  });

  it('rejects empty statement', () => {
    expect(() => buildLearningRecord(base({ statement: '   ' }), COORD_A)).toThrow(LearningValidationError);
  });

  it('unauthorized creation: requires an actor', () => {
    expect(() => buildLearningRecord(base(), null as unknown as ActorScope)).toThrow(UnauthorizedLearningError);
  });

  it('town scope: coordinator may write to own town', () => {
    expect(() => buildLearningRecord(base({ town_id: 'town-a' }), COORD_A)).not.toThrow();
  });

  it('cross-town creation is denied for a coordinator without scope', () => {
    expect(() => buildLearningRecord(base({ town_id: 'town-b' }), COORD_A)).toThrow(CrossTownLearningError);
  });

  it('national may write to any town', () => {
    expect(() => buildLearningRecord(base({ town_id: 'town-z' }), NATIONAL)).not.toThrow();
  });

  it('initiative scope: scoped initiative allowed, unscoped denied', () => {
    expect(() => buildLearningRecord(base({ town_id: null, initiative_key: 'kasibuy' }), COORD_A)).not.toThrow();
    expect(() => buildLearningRecord(base({ town_id: null, initiative_key: 'orbit-music' }), COORD_A))
      .toThrow(CrossInitiativeLearningError);
  });

  it('immutability/versioning: a correction is a NEW superseding row with bumped version', () => {
    const first = buildLearningRecord(base(), COORD_A);
    const corrected = buildSupersedingLearning(
      { id: 'prev-uuid', version: first.version },
      base({ statement: 'Corrected: field verification confirms demand.', truth_class: 'VERIFIED' }),
      COORD_A,
    );
    expect(corrected.supersedes).toBe('prev-uuid');
    expect(corrected.version).toBe(first.version + 1);
    expect(corrected.statement).toContain('Corrected');
    // the original builder output is untouched (append-only, no in-place mutation)
    expect(first.statement).not.toContain('Corrected');
    expect(first.version).toBe(1);
    expect(first.supersedes).toBeNull();
  });
});
