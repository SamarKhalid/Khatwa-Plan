import { writable, type Readable } from 'svelte/store';
import type { KeyValueStorage } from '@/platform/storage';
import { AuthError, type AuthErrorCode, type AuthService, type AuthState, type AuthUser } from './types';

export const GUEST_STORAGE_KEY = 'khatwa.guest';

export interface AuthStore extends Readable<AuthState> {
  /** Resolves the initial status. Guests resolve instantly and never load Firebase. */
  init(): void;
  signInWithGoogle(): Promise<void>;
  continueAsGuest(): void;
  /** Leaves guest mode and returns to the sign-in screen. */
  exitGuest(): void;
  signOut(): Promise<void>;
  clearError(): void;
}

/**
 * Session state machine.
 *
 *   loading ──► signed-out ◄──► guest
 *                  │  ▲
 *                  ▼  │
 *               signed-in
 *
 * Guest mode is a local flag (no Firebase account). Signing in always clears it.
 */
export function createAuthStore(service: AuthService, storage: KeyValueStorage): AuthStore {
  const state = writable<AuthState>({ status: 'loading', user: null, busy: false, error: null });
  let unsubscribe: (() => void) | null = null;

  const isGuest = () => storage.getItem(GUEST_STORAGE_KEY) === '1';

  function onUser(user: AuthUser | null): void {
    if (user) {
      storage.removeItem(GUEST_STORAGE_KEY);
      state.update((s) => ({ ...s, status: 'signed-in', user, error: null }));
    } else {
      state.update((s) => ({ ...s, status: isGuest() ? 'guest' : 'signed-out', user: null }));
    }
  }

  function listen(): void {
    unsubscribe ??= service.subscribe(onUser);
  }

  return {
    subscribe: state.subscribe,

    init() {
      if (isGuest()) {
        state.update((s) => ({ ...s, status: 'guest' }));
        return;
      }
      listen();
    },

    async signInWithGoogle() {
      state.update((s) => ({ ...s, busy: true, error: null }));
      listen();
      try {
        await service.signInWithGoogle();
      } catch (e) {
        const code: AuthErrorCode = e instanceof AuthError ? e.code : 'unknown';
        state.update((s) => ({ ...s, error: code }));
      } finally {
        state.update((s) => ({ ...s, busy: false }));
      }
    },

    continueAsGuest() {
      storage.setItem(GUEST_STORAGE_KEY, '1');
      state.update((s) => ({ ...s, status: 'guest', user: null, error: null }));
    },

    exitGuest() {
      storage.removeItem(GUEST_STORAGE_KEY);
      state.update((s) => ({ ...s, status: 'signed-out', user: null, error: null }));
    },

    async signOut() {
      state.update((s) => ({ ...s, busy: true, error: null }));
      try {
        await service.signOut();
        // The service emits `null` and `onUser` moves us to signed-out.
      } catch (e) {
        const code: AuthErrorCode = e instanceof AuthError ? e.code : 'unknown';
        state.update((s) => ({ ...s, error: code }));
      } finally {
        state.update((s) => ({ ...s, busy: false }));
      }
    },

    clearError() {
      state.update((s) => ({ ...s, error: null }));
    },
  };
}

