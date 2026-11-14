import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { createAuthStore, GUEST_STORAGE_KEY } from '@/auth/store';
import { AuthError, type AuthService, type AuthUser } from '@/auth/types';
import type { KeyValueStorage } from '@/platform/storage';

const USER: AuthUser = { uid: 'u1', displayName: 'Sara', email: 's@x.com', photoURL: null };

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

/** Fake identity provider that behaves like Firebase: emits to subscribers on change. */
function fakeService(opts: { initialUser?: AuthUser | null } = {}) {
  let current: AuthUser | null = opts.initialUser ?? null;
  const listeners = new Set<(u: AuthUser | null) => void>();
  const emit = () => listeners.forEach((l) => l(current));

  const service = {
    subscribe: vi.fn((l: (u: AuthUser | null) => void) => {
      listeners.add(l);
      queueMicrotask(() => l(current));
      return () => listeners.delete(l);
    }),
    signInWithGoogle: vi.fn(async (): Promise<AuthUser | null> => {
      current = USER;
      emit();
      return USER;
    }),
    signOut: vi.fn(async () => {
      current = null;
      emit();
    }),
  } satisfies AuthService;
  return service;
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('auth store', () => {
  let storage: KeyValueStorage;
  beforeEach(() => {
    storage = memoryStorage();
  });

  it('starts in loading and resolves to signed-out when there is no session', async () => {
    const store = createAuthStore(fakeService(), storage);
    expect(get(store).status).toBe('loading');
    store.init();
    await tick();
    expect(get(store).status).toBe('signed-out');
  });

  it('restores an existing session', async () => {
    const store = createAuthStore(fakeService({ initialUser: USER }), storage);
    store.init();
    await tick();
    expect(get(store)).toMatchObject({ status: 'signed-in', user: USER });
  });

  it('signs in with Google', async () => {
    const store = createAuthStore(fakeService(), storage);
    store.init();
    await tick();
    await store.signInWithGoogle();
    expect(get(store)).toMatchObject({ status: 'signed-in', user: USER, busy: false, error: null });
  });

  it('stays signed out silently when the popup is dismissed', async () => {
    const service = fakeService();
    service.signInWithGoogle.mockResolvedValueOnce(null);
    const store = createAuthStore(service, storage);
    store.init();
    await tick();
    await store.signInWithGoogle();
    expect(get(store)).toMatchObject({ status: 'signed-out', busy: false, error: null });
  });

  it('exposes typed errors and recovers', async () => {
    const service = fakeService();
    service.signInWithGoogle.mockRejectedValueOnce(new AuthError('network'));
    const store = createAuthStore(service, storage);
    store.init();
    await tick();
    await store.signInWithGoogle();
    expect(get(store)).toMatchObject({ status: 'signed-out', busy: false, error: 'network' });
    store.clearError();
    expect(get(store).error).toBeNull();
  });

  it('maps unexpected failures to "unknown"', async () => {
    const service = fakeService();
    service.signInWithGoogle.mockRejectedValueOnce(new Error('boom'));
    const store = createAuthStore(service, storage);
    await store.signInWithGoogle();
    expect(get(store).error).toBe('unknown');
  });

  describe('guest mode', () => {
    it('continues as guest and persists the choice', () => {
      const store = createAuthStore(fakeService(), storage);
      store.init();
      store.continueAsGuest();
      expect(get(store)).toMatchObject({ status: 'guest', user: null });
      expect(storage.getItem(GUEST_STORAGE_KEY)).toBe('1');
    });

    it('resumes instantly as guest and never loads the identity provider', () => {
      const service = fakeService();
      const store = createAuthStore(service, memoryStorage({ [GUEST_STORAGE_KEY]: '1' }));
      store.init();
      expect(get(store).status).toBe('guest');
      expect(service.subscribe).not.toHaveBeenCalled();
    });

    it('exiting guest mode returns to sign-in', () => {
      const store = createAuthStore(fakeService(), storage);
      store.continueAsGuest();
      store.exitGuest();
      expect(get(store).status).toBe('signed-out');
      expect(storage.getItem(GUEST_STORAGE_KEY)).toBeNull();
    });

    it('signing in from guest mode clears the guest flag', async () => {
      const store = createAuthStore(fakeService(), storage);
      store.init();
      store.continueAsGuest();
      await store.signInWithGoogle();
      expect(get(store)).toMatchObject({ status: 'signed-in', user: USER });
      expect(storage.getItem(GUEST_STORAGE_KEY)).toBeNull();
    });
  });

  it('signs out back to the sign-in screen (not guest)', async () => {
    const store = createAuthStore(fakeService({ initialUser: USER }), storage);
    store.init();
    await tick();
    await store.signOut();
    expect(get(store)).toMatchObject({ status: 'signed-out', user: null, busy: false });
  });
});

