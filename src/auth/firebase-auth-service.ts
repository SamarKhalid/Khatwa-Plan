import type { Auth, User } from 'firebase/auth';
import { AuthError, type AuthErrorCode, type AuthService, type AuthUser } from './types';
import { getFirebaseApp } from '@/platform/firebase';

type FirebaseAuthModule = typeof import('firebase/auth');
interface FirebaseContext {
  auth: Auth;
  mod: FirebaseAuthModule;
}

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

const ERROR_CODES: Record<string, AuthErrorCode> = {
  'auth/popup-blocked': 'popup-blocked',
  'auth/network-request-failed': 'network',
  'auth/too-many-requests': 'too-many-requests',
  'auth/unauthorized-domain': 'unauthorized-domain',
  'auth/user-disabled': 'account-disabled',
};

/** Popup closed / second popup opened: the user changed their mind, not a failure. */
const CANCELLED = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

function errorCodeOf(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : '';
}

/**
 * Firebase Authentication (Google provider) for the web.
 * The Firebase SDK is imported lazily, so guests and the first paint never pay for it.
 *
 * Android note: `signInWithPopup` is not supported inside a Capacitor WebView. Phase 5 adds a
 * native implementation of `AuthService` (Capacitor Firebase Authentication plugin).
 */
export class FirebaseAuthService implements AuthService {
  private context: Promise<FirebaseContext> | null = null;

  private load(): Promise<FirebaseContext> {
    this.context ??= (async () => {
      const [app, mod] = await Promise.all([
        getFirebaseApp(),
        import('firebase/auth'),
      ]);
      return { auth: mod.getAuth(app), mod };
    })();
    return this.context;
  }

  subscribe(listener: (user: AuthUser | null) => void): () => void {
    let cancelled = false;
    let stop: () => void = () => {};

    this.load()
      .then(({ auth, mod }) => {
        if (cancelled) return;
        stop = mod.onAuthStateChanged(
          auth,
          (user) => listener(user ? toAuthUser(user) : null),
          () => listener(null),
        );
      })
      // SDK failed to load (offline first visit): treat as signed out instead of hanging.
      .catch(() => {
        this.context = null;
        if (!cancelled) listener(null);
      });

    return () => {
      cancelled = true;
      stop();
    };
  }

  async signInWithGoogle(): Promise<AuthUser | null> {
    let ctx: FirebaseContext;
    try {
      ctx = await this.load();
    } catch (e) {
      this.context = null;
      throw new AuthError('network', e);
    }

    const { auth, mod } = ctx;
    const provider = new mod.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await mod.signInWithPopup(auth, provider);
      return toAuthUser(result.user);
    } catch (e) {
      const code = errorCodeOf(e);
      if (CANCELLED.has(code)) return null;
      throw new AuthError(ERROR_CODES[code] ?? 'unknown', e);
    }
  }

  async signOut(): Promise<void> {
    const { auth, mod } = await this.load();
    try {
      await mod.signOut(auth);
    } catch (e) {
      throw new AuthError(ERROR_CODES[errorCodeOf(e)] ?? 'unknown', e);
    }
  }
}

