/**
 * Plan domain model. Pure and immutable: every operation returns a new `Plan`.
 * Units are centimetres. Coordinates: origin (0,0), +X right, +Y up (CAD convention).
 */

export type Direction = 'up' | 'down' | 'left' | 'right';
export type OpeningType = 'door' | 'window';

export interface Point {
  x: number;
  y: number;
}

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Opening extends Segment {
  type: OpeningType;
  width: number;
}

/** Structured (not pre-translated) so the UI can render it in any language. */
export type LogEntry =
  | { kind: 'start' }
  | { kind: 'move'; dir: Direction; length: number }
  | { kind: 'opening'; type: OpeningType; width: number };

export interface Plan {
  started: boolean;
  /** Current pen position. */
  x: number;
  y: number;
  /** Last movement direction (openings extend along it). */
  dir: Direction;
  segments: readonly Segment[];
  openings: readonly Opening[];
  log: readonly LogEntry[];
}

export const DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'];

const VECTORS: Record<Direction, readonly [number, number]> = {
  up: [0, 1],
  down: [0, -1],
  left: [-1, 0],
  right: [1, 0],
};

export function vectorOf(dir: Direction): readonly [number, number] {
  return VECTORS[dir];
}

/** Removes floating-point noise (0.1 + 0.2) without losing real precision. */
export function snap(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function isValidLength(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function createPlan(): Plan {
  return { started: false, x: 0, y: 0, dir: 'right', segments: [], openings: [], log: [] };
}

/** A fresh drawing with the pen at (0,0). */
export function startPlan(): Plan {
  return { ...createPlan(), started: true, log: [{ kind: 'start' }] };
}

/**
 * Draws a wall from the pen in `dir`. Returns the SAME plan instance when the input is invalid,
 * so callers can detect a no-op with `next === plan`.
 */
export function move(plan: Plan, dir: Direction, length: number): Plan {
  if (!plan.started || !isValidLength(length)) return plan;
  const [dx, dy] = VECTORS[dir];
  const x2 = snap(plan.x + dx * length);
  const y2 = snap(plan.y + dy * length);
  return {
    ...plan,
    x: x2,
    y: y2,
    dir,
    segments: [...plan.segments, { x1: plan.x, y1: plan.y, x2, y2 }],
    log: [...plan.log, { kind: 'move', dir, length }],
  };
}

/** Adds a door/window along the current direction; the pen continues from its end. */
export function addOpening(plan: Plan, type: OpeningType, width: number): Plan {
  if (!plan.started || !isValidLength(width)) return plan;
  const [dx, dy] = VECTORS[plan.dir];
  const x2 = snap(plan.x + dx * width);
  const y2 = snap(plan.y + dy * width);
  return {
    ...plan,
    x: x2,
    y: y2,
    openings: [...plan.openings, { type, width, x1: plan.x, y1: plan.y, x2, y2 }],
    log: [...plan.log, { kind: 'opening', type, width }],
  };
}

/** Number formatting for display and export: at most 2 decimals, no trailing zeros. */
export function fmt(n: number): string {
  return Number(n.toFixed(2)).toString();
}
