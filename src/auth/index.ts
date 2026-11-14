import { safeStorage } from '@/platform/storage';
import { createAuthStore } from './store';
import { FirebaseAuthService } from './firebase-auth-service';

export { GUEST_STORAGE_KEY } from './store';
export type { AuthState, AuthStatus, AuthUser, AuthErrorCode } from './types';

/** App-wide session singleton. */
export const auth = createAuthStore(new FirebaseAuthService(), safeStorage);

