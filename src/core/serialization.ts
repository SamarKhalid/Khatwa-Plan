import {
  DIRECTIONS,
  isValidLength,
  snap,
  type Direction,
  type LogEntry,
  type Opening,
  type OpeningType,
  type Plan,
  type Segment,
} from './plan';

/** Bump when the stored shape changes, and add a migration in `deserializePlan`. */
export const PLAN_SCHEMA_VERSION = 1;

/** Upper bounds protect the client (and storage) from absurd or malicious documents. */
export const MAX_ITEMS = 20_000;

/** Persistable form of a `Plan`: plain JSON, no class instances, no `undefined`. */
export interface StoredPlan {
  schema: typeof PLAN_SCHEMA_VERSION;
  started: boolean;
  x: number;
  y: number;
  dir: Direction;
  segments: Segment[];
  openings: Opening[];
  log: LogEntry[];
}

/** Lightweight summary shown in lists, so the full drawing is only fetched when opened. */
export interface PlanStats {
  wallCount: number;
  openingCount: number;
  /** Total wall length in cm (2 decimals). */
  wallLengthCm: number;
}

export class InvalidPlanDataError extends Error {
  constructor(reason: string) {
    super(`Invalid plan data: ${reason}`);
    this.name = 'InvalidPlanDataError';
  }
}

/** True when there is something worth saving. */
export function hasContent(plan: Plan): boolean {
  return plan.segments.length > 0 || plan.openings.length > 0;
}

export function planStats(plan: Pick<Plan, 'segments' | 'openings'>): PlanStats {
  const length = plan.segments.reduce((sum, s) => sum + Math.hypot(s.x2 - s.x1, s.y2 - s.y1), 0);
  return {
    wallCount: plan.segments.length,
    openingCount: plan.openings.length,
    wallLengthCm: Math.round(length * 100) / 100,
  };
}

export function serializePlan(plan: Plan): StoredPlan {
  return {
    schema: PLAN_SCHEMA_VERSION,
    started: plan.started,
    x: plan.x,
    y: plan.y,
    dir: plan.dir,
    segments: plan.segments.map((s) => ({ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 })),
    openings: plan.openings.map((o) => ({
      type: o.type,
      width: o.width,
      x1: o.x1,
      y1: o.y1,
      x2: o.x2,
      y2: o.y2,
    })),
    log: plan.log.map((e) => ({ ...e })),
  };
}

// ---------------------------------------------------------------- validation

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function num(record: Record<string, unknown>, key: string): number {
  const v = record[key];
  if (!isFiniteNumber(v)) throw new InvalidPlanDataError(`"${key}" must be a finite number`);
  return v;
}

function dirOf(v: unknown): Direction {
  if (typeof v === 'string' && (DIRECTIONS as readonly string[]).includes(v)) return v as Direction;
  throw new InvalidPlanDataError('invalid direction');
}

function openingTypeOf(v: unknown): OpeningType {
  if (v === 'door' || v === 'window') return v;
  throw new InvalidPlanDataError('invalid opening type');
}

function listOf(record: Record<string, unknown>, key: string): unknown[] {
  const v = record[key];
  if (!Array.isArray(v)) throw new InvalidPlanDataError(`"${key}" must be a list`);
  if (v.length > MAX_ITEMS) throw new InvalidPlanDataError(`"${key}" has too many items`);
  return v;
}

function segmentOf(v: unknown): Segment {
  if (!isRecord(v)) throw new InvalidPlanDataError('segment must be an object');
  return { x1: num(v, 'x1'), y1: num(v, 'y1'), x2: num(v, 'x2'), y2: num(v, 'y2') };
}

function openingOf(v: unknown): Opening {
  if (!isRecord(v)) throw new InvalidPlanDataError('opening must be an object');
  const width = num(v, 'width');
  if (!isValidLength(width)) throw new InvalidPlanDataError('opening width must be positive');
  return { ...segmentOf(v), type: openingTypeOf(v['type']), width };
}

function logEntryOf(v: unknown): LogEntry {
  if (!isRecord(v)) throw new InvalidPlanDataError('log entry must be an object');
  switch (v['kind']) {
    case 'start':
      return { kind: 'start' };
    case 'move':
      return { kind: 'move', dir: dirOf(v['dir']), length: num(v, 'length') };
    case 'opening':
      return { kind: 'opening', type: openingTypeOf(v['type']), width: num(v, 'width') };
    default:
      throw new InvalidPlanDataError('unknown log entry');
  }
}

/**
 * Validates untrusted data (from storage/network) and rebuilds a `Plan`.
 * Throws `InvalidPlanDataError`; never returns partially valid data.
 */
export function deserializePlan(data: unknown): Plan {
  if (!isRecord(data)) throw new InvalidPlanDataError('not an object');
  if (data['schema'] !== PLAN_SCHEMA_VERSION) {
    throw new InvalidPlanDataError(`unsupported schema ${String(data['schema'])}`);
  }
  if (typeof data['started'] !== 'boolean') throw new InvalidPlanDataError('"started" must be boolean');

  return {
    started: data['started'],
    x: snap(num(data, 'x')),
    y: snap(num(data, 'y')),
    dir: dirOf(data['dir']),
    segments: listOf(data, 'segments').map(segmentOf),
    openings: listOf(data, 'openings').map(openingOf),
    log: listOf(data, 'log').map(logEntryOf),
  };
}

