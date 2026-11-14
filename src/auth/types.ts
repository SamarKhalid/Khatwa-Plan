/** Authenticated Google user, reduced to what the app needs (no Firebase types leak out). */
export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type AuthErrorCode =
  | 'popup-blocked'
  | 'network'
  | 'too-many-requests'
  | 'unauthorized-domain'
  | 'account-disabled'
  | 'unknown';

/** Thrown by `AuthService` implementations. A user dismissing the popup is NOT an error. */
export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    cause?: unknown,
  ) {
    super(code, { cause });
    this.name = 'AuthError';
  }
}

/**
 * Identity provider boundary. The app only knows this interface, so the Firebase
 * implementation can be swapped (e.g. native Capacitor plugin on Android) without UI changes.
 */
export interface AuthService {
  /** Emits the current user (or null) now and on every change. Returns an unsubscribe function. */
  subscribe(listener: (user: AuthUser | null) => void): () => void;
  /** Resolves with `null` if the user closed the Google window without signing in. */
  signInWithGoogle(): Promise<AuthUser | null>;
  signOut(): Promise<void>;
}

export type AuthStatus = 'loading' | 'signed-out' | 'guest' | 'signed-in';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /** A sign-in or sign-out request is in flight. */
  busy: boolean;
  error: AuthErrorCode | null;
}

