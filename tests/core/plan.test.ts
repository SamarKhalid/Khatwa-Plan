import { describe, expect, it } from 'vitest';
import { addOpening, createPlan, fmt, isValidLength, move, snap, startPlan } from '@/core/plan';

describe('plan', () => {
  it('ignores drawing until a start point is set', () => {
    const plan = createPlan();
    expect(move(plan, 'right', 100)).toBe(plan);
    expect(addOpening(plan, 'door', 90)).toBe(plan);
  });

  it('starts at (0,0) facing right with a log entry', () => {
    expect(startPlan()).toMatchObject({ started: true, x: 0, y: 0, dir: 'right' });
    expect(startPlan().log).toEqual([{ kind: 'start' }]);
  });

  it('moves in each direction (+Y is up)', () => {
    const p = startPlan();
    expect(move(p, 'right', 100)).toMatchObject({ x: 100, y: 0, dir: 'right' });
    expect(move(p, 'left', 100)).toMatchObject({ x: -100, y: 0 });
    expect(move(p, 'up', 50)).toMatchObject({ x: 0, y: 50 });
    expect(move(p, 'down', 50)).toMatchObject({ x: 0, y: -50 });
  });

  it('records walls as segments and does not mutate the previous plan', () => {
    const p0 = startPlan();
    const p1 = move(p0, 'right', 300);
    const p2 = move(p1, 'up', 200.5);
    expect(p0.segments).toHaveLength(0);
    expect(p2.segments).toEqual([
      { x1: 0, y1: 0, x2: 300, y2: 0 },
      { x1: 300, y1: 0, x2: 300, y2: 200.5 },
    ]);
  });

  it('rejects invalid lengths by returning the same instance', () => {
    const p = startPlan();
    for (const bad of [0, -5, NaN, Infinity]) expect(move(p, 'up', bad)).toBe(p);
  });

  it('keeps decimals exact despite floating point (0.1 + 0.2)', () => {
    let p = startPlan();
    p = move(p, 'right', 0.1);
    p = move(p, 'right', 0.2);
    expect(p.x).toBe(0.3);
  });

  it('adds an opening along the current direction and the pen continues from its end', () => {
    let p = move(startPlan(), 'up', 100);
    p = addOpening(p, 'door', 90);
    expect(p.openings).toEqual([{ type: 'door', width: 90, x1: 0, y1: 100, x2: 0, y2: 190 }]);
    expect(p).toMatchObject({ x: 0, y: 190 });
    expect(p.segments).toHaveLength(1);
  });

  it('logs structured entries', () => {
    let p = move(startPlan(), 'left', 40);
    p = addOpening(p, 'window', 120);
    expect(p.log.slice(1)).toEqual([
      { kind: 'move', dir: 'left', length: 40 },
      { kind: 'opening', type: 'window', width: 120 },
    ]);
  });

  it('helpers', () => {
    expect(isValidLength(1)).toBe(true);
    expect(isValidLength('1')).toBe(false);
    expect(snap(0.30000000000000004)).toBe(0.3);
    expect(fmt(125.256)).toBe('125.26');
    expect(fmt(100)).toBe('100');
    expect(fmt(2.5)).toBe('2.5');
  });
});

