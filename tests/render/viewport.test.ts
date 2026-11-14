import { describe, expect, it } from 'vitest';
import {
  MAX_SCALE,
  MIN_SCALE,
  centered,
  gridStepCm,
  pan,
  toScreen,
  zoomAt,
} from '@/render/viewport';

describe('viewport', () => {
  it('maps world to screen with +Y up', () => {
    const vp = { ox: 100, oy: 200, scale: 2 };
    expect(toScreen(vp, 0, 0)).toEqual({ x: 100, y: 200 });
    expect(toScreen(vp, 10, 10)).toEqual({ x: 120, y: 180 });
  });

  it('centers the origin', () => {
    expect(centered(800, 600)).toMatchObject({ ox: 400, oy: 300 });
  });

  it('pans', () => {
    expect(pan({ ox: 0, oy: 0, scale: 1 }, 5, -3)).toEqual({ ox: 5, oy: -3, scale: 1 });
  });

  it('zooms around the cursor: the point under it stays fixed', () => {
    const vp = { ox: 50, oy: 80, scale: 1 };
    const mx = 300;
    const my = 200;
    const worldBefore = { x: (mx - vp.ox) / vp.scale, y: (vp.oy - my) / vp.scale };
    const z = zoomAt(vp, mx, my, 2);
    expect(z.scale).toBe(2);
    expect(toScreen(z, worldBefore.x, worldBefore.y)).toEqual({ x: mx, y: my });
  });

  it('clamps zoom and stays consistent at the limits', () => {
    const vp = { ox: 0, oy: 0, scale: MAX_SCALE };
    const z = zoomAt(vp, 100, 100, 5);
    expect(z).toEqual(vp); // already at max: nothing moves
    expect(zoomAt({ ox: 0, oy: 0, scale: MIN_SCALE }, 0, 0, 0.1).scale).toBe(MIN_SCALE);
  });

  it('picks a readable grid step for any zoom', () => {
    expect(gridStepCm(0.15)).toBe(100);
    expect(gridStepCm(0.8)).toBe(50);
    expect(gridStepCm(4)).toBe(5);
    expect(gridStepCm(1e-9)).toBe(5000);
  });
});

