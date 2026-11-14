import { get, writable } from 'svelte/store';
import { t } from '@/i18n';
import type { MessageKey } from '@/i18n/locales/en';

const DURATION_MS = 1800;
const message = writable<string | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

export const toast = {
  subscribe: message.subscribe,
  /** Shows a translated message; it keeps the language it was created in. */
  show(key: MessageKey, params?: Record<string, string | number>): void {
    clearTimeout(timer);
    message.set(get(t)(key, params));
    timer = setTimeout(() => message.set(null), DURATION_MS);
  },
};

