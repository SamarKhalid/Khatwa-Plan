import type { Plan } from '@/core/plan';
import type { PlanStats } from '@/core/serialization';

/** Summary of one saved drawing (the heavy drawing data is loaded only on open). */
export interface SavedPlanMeta extends PlanStats {
  id: string;
  /** Optional user-given title. `null` = show the date instead. */
  name: string | null;
  /** Epoch milliseconds when the user pressed Save. */
  savedAt: number;
  /** Written locally but not yet confirmed by the server (offline). */
  pending: boolean;
}

export type StorageErrorCode =
  | 'permission'
  | 'network'
  | 'not-found'
  | 'too-large'
  | 'invalid-data'
  | 'unknown';

export class StorageError extends Error {
  constructor(
    public readonly code: StorageErrorCode,
    cause?: unknown,
  ) {
    super(code, { cause });
    this.name = 'StorageError';
  }
}

/**
 * Where saved drawings live. The app only knows this interface: Firestore today,
 * anything else (local-only, another backend) tomorrow, without touching UI or core.
 * All methods are scoped to a user id; implementations must never cross users.
 */
export interface PlanRepository {
  /** Newest first. */
  list(userId: string): Promise<SavedPlanMeta[]>;
  load(userId: string, id: string): Promise<Plan>;
  save(userId: string, plan: Plan, name?: string | null, planId?: string | null): Promise<SavedPlanMeta>;
  remove(userId: string, id: string): Promise<void>;
}

