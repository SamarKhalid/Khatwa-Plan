import type { FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '@/config/firebase';

let app: Promise<FirebaseApp> | null = null;

/**
 * The single, lazily created Firebase app shared by Auth and Firestore.
 * The SDK is only downloaded when first needed (guests never pay for it).
 */
export function getFirebaseApp(): Promise<FirebaseApp> {
  app ??= import('firebase/app')
    .then(({ initializeApp, getApps, getApp }) =>
      getApps().length ? getApp() : initializeApp(firebaseConfig),
    )
    .catch((error: unknown) => {
      app = null; // allow a retry (e.g. first visit was offline)
      throw error;
    });
  return app;
}

