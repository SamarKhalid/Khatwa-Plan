import type { Firestore } from 'firebase/firestore';
import { deserializePlan, hasContent, planStats, serializePlan } from '@/core/serialization';
import type { Plan } from '@/core/plan';
import { getFirebaseApp } from '@/platform/firebase';
import {
  StorageError,
  type PlanRepository,
  type SavedPlanMeta,
  type StorageErrorCode,
} from './types';

type FirestoreModule = typeof import('firebase/firestore');

interface FirestoreContext {
  db: Firestore;
  mod: FirestoreModule;
}

const ERROR_MAP: Record<string, StorageErrorCode> = {
  'permission-denied': 'permission',
  unavailable: 'network',
  'deadline-exceeded': 'network',
  'not-found': 'not-found',
  'resource-exhausted': 'too-large',
  'invalid-argument': 'invalid-data',
};

function mapError(error: unknown): StorageError {
  if (error instanceof StorageError) return error;
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code).replace('firestore/', '')
      : '';
  return new StorageError(ERROR_MAP[code] ?? 'unknown', error);
}

export class FirestorePlanRepository implements PlanRepository {
  private context: Promise<FirestoreContext> | null = null;

  private getContext(): Promise<FirestoreContext> {
    this.context ??= (async () => {
      const [app, mod] = await Promise.all([
        getFirebaseApp(),
        import('firebase/firestore'),
      ]);

      let db: Firestore;
      try {
        // Attempt persistent local cache for offline work
        db = mod.initializeFirestore(app, {
          localCache: mod.persistentLocalCache(),
        });
      } catch {
        // Already initialized or persistent cache not supported in environment
        db = mod.getFirestore(app);
      }

      return { db, mod };
    })();
    return this.context;
  }

  async list(userId: string): Promise<SavedPlanMeta[]> {
    if (!userId) throw new StorageError('permission', new Error('User ID is required'));
    try {
      const { db, mod } = await this.getContext();
      const plansRef = mod.collection(db, 'users', userId, 'plans');
      const q = mod.query(plansRef, mod.orderBy('savedAt', 'desc'));
      const snapshot = await mod.getDocs(q);

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const savedAtRaw = data['savedAt'];
        const savedAt =
          typeof savedAtRaw === 'number'
            ? savedAtRaw
            : savedAtRaw?.toMillis?.() ?? Date.now();

        const stats = data['stats'] as Record<string, unknown> | undefined;

        return {
          id: docSnap.id,
          name: typeof data['name'] === 'string' ? data['name'] : null,
          savedAt,
          pending: docSnap.metadata.hasPendingWrites,
          wallCount: typeof stats?.['wallCount'] === 'number' ? stats['wallCount'] : 0,
          openingCount:
            typeof stats?.['openingCount'] === 'number' ? stats['openingCount'] : 0,
          wallLengthCm:
            typeof stats?.['wallLengthCm'] === 'number' ? stats['wallLengthCm'] : 0,
        };
      });
    } catch (e) {
      throw mapError(e);
    }
  }

  async load(userId: string, id: string): Promise<Plan> {
    if (!userId) throw new StorageError('permission', new Error('User ID is required'));
    if (!id) throw new StorageError('not-found', new Error('Plan ID is required'));

    try {
      const { db, mod } = await this.getContext();
      const docRef = mod.doc(db, 'users', userId, 'plans', id);
      const snapshot = await mod.getDoc(docRef);

      if (!snapshot.exists()) {
        throw new StorageError('not-found');
      }

      const data = snapshot.data();
      return deserializePlan(data['plan']);
    } catch (e) {
      throw mapError(e);
    }
  }

  async save(
    userId: string,
    plan: Plan,
    name?: string | null,
    planId?: string | null,
  ): Promise<SavedPlanMeta> {
    if (!userId) throw new StorageError('permission', new Error('User ID is required'));
    if (!hasContent(plan)) {
      throw new StorageError('invalid-data', new Error('Plan is empty'));
    }

    try {
      const { db, mod } = await this.getContext();
      const stats = planStats(plan);
      const now = Date.now();
      const serialized = serializePlan(plan);
      const cleanName = name ? name.trim() : null;

      let finalId: string;
      if (planId) {
        const docRef = mod.doc(db, 'users', userId, 'plans', planId);
        await mod.setDoc(
          docRef,
          {
            name: cleanName,
            savedAt: now,
            stats,
            plan: serialized,
          },
          { merge: true },
        );
        finalId = planId;
      } else {
        const plansRef = mod.collection(db, 'users', userId, 'plans');
        const docRef = await mod.addDoc(plansRef, {
          name: cleanName,
          savedAt: now,
          stats,
          plan: serialized,
        });
        finalId = docRef.id;
      }

      return {
        id: finalId,
        name: cleanName,
        savedAt: now,
        pending: true,
        ...stats,
      };
    } catch (e) {
      throw mapError(e);
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!userId) throw new StorageError('permission', new Error('User ID is required'));
    if (!id) throw new StorageError('not-found');

    try {
      const { db, mod } = await this.getContext();
      const docRef = mod.doc(db, 'users', userId, 'plans', id);
      await mod.deleteDoc(docRef);
    } catch (e) {
      throw mapError(e);
    }
  }
}
