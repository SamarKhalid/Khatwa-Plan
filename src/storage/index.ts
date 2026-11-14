import { FirestorePlanRepository } from './firestore-plan-repository';
import type { PlanRepository } from './types';

export * from './types';
export { FirestorePlanRepository } from './firestore-plan-repository';

/** Default PlanRepository implementation for the app */
export const planRepository: PlanRepository = new FirestorePlanRepository();

