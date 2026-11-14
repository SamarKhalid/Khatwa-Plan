import type { Plan } from '../plan';

export const PLAN_FORMAT = 'khatwa-plan';
export const PLAN_FORMAT_VERSION = 1;

/** Lossless, versioned data export (units: centimetres). */
export function toJson(plan: Pick<Plan, 'segments' | 'openings'>): string {
  return JSON.stringify(
    {
      format: PLAN_FORMAT,
      version: PLAN_FORMAT_VERSION,
      units: 'cm',
      origin: { x: 0, y: 0 },
      segments: plan.segments,
      openings: plan.openings,
    },
    null,
    2,
  );
}

