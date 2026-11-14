import { describe, expect, it } from 'vitest';
import { addOpening, move, startPlan } from '@/core/plan';
import {
  deserializePlan,
  hasContent,
  InvalidPlanDataError,
  planStats,
  serializePlan,
} from '@/core/serialization';

describe('serialization', () => {
  it('detects if plan has content', () => {
    const empty = startPlan();
    expect(hasContent(empty)).toBe(false);

    const withWall = move(startPlan(), 'right', 100);
    expect(hasContent(withWall)).toBe(true);

    const withOpening = addOpening(startPlan(), 'door', 90);
    expect(hasContent(withOpening)).toBe(true);
  });

  it('calculates plan statistics accurately', () => {
    let p = move(startPlan(), 'right', 300);
    p = move(p, 'up', 400);
    p = addOpening(p, 'window', 120);

    const stats = planStats(p);
    expect(stats.wallCount).toBe(2);
    expect(stats.openingCount).toBe(1);
    expect(stats.wallLengthCm).toBe(700);
  });

  it('serializes and deserializes a plan with full fidelity', () => {
    let original = move(startPlan(), 'right', 250.5);
    original = addOpening(original, 'door', 90);
    original = move(original, 'up', 180);

    const serialized = serializePlan(original);
    expect(serialized.schema).toBe(1);

    const restored = deserializePlan(serialized);
    expect(restored).toEqual(original);
  });

  it('rejects invalid or corrupted plan schemas', () => {
    expect(() => deserializePlan(null)).toThrow(InvalidPlanDataError);
    expect(() => deserializePlan({ schema: 999 })).toThrow(InvalidPlanDataError);
    expect(() => deserializePlan({ schema: 1, started: 'yes' })).toThrow(InvalidPlanDataError);
    expect(() =>
      deserializePlan({
        schema: 1,
        started: true,
        x: 0,
        y: 0,
        dir: 'invalid',
        segments: [],
        openings: [],
        log: [],
      }),
    ).toThrow(InvalidPlanDataError);
  });
});

