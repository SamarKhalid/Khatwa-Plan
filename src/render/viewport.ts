/** Pure viewport math (no DOM). `scale` is screen pixels per centimetre. */
export interface Viewport {
  /** Screen position of world (0,0). */
  ox: number;
  oy: number;
  scale: number;
}

export const MIN_SCALE = 0.15;
export const MAX_SCALE = 4;
export const DEFAULT_SCALE = 0.8;

export const clampScale = (s: number): number => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

export function centered(width: number, height: number, scale = DEFAULT_SCALE): Viewport {
  return { ox: width / 2, oy: height / 2, scale };
}

export function pan(vp: Viewport, dx: number, dy: number): Viewport {
  return { ...vp, ox: vp.ox + dx, oy: vp.oy + dy };
}

/** Zooms by `factor` keeping the world point under screen (mx, my) fixed. */
export function zoomAt(vp: Viewport, mx: number, my: number, factor: number): Viewport {
  const scale = clampScale(vp.scale * factor);
  const k = scale / vp.scale;
  return { scale, ox: mx + (vp.ox - mx) * k, oy: my + (vp.oy - my) * k };
}

export function toScreen(vp: Viewport, x: number, y: number): { x: number; y: number } {
  return { x: vp.ox + x * vp.scale, y: vp.oy - y * vp.scale };
}

const GRID_STEPS_CM = [1, 5, 10, 50, 100, 500, 1000, 5000] as const;
const MIN_GRID_PX = 14;

/** Smallest "nice" grid step (cm) that is still at least MIN_GRID_PX apart on screen. */
export function gridStepCm(scale: number): number {
  return GRID_STEPS_CM.find((s) => s * scale >= MIN_GRID_PX) ?? GRID_STEPS_CM[GRID_STEPS_CM.length - 1]!;
}

