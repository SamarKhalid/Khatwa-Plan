import { derived, get, writable } from 'svelte/store';
import type { MessageKey, Messages } from './locales/en';
import { safeStorage } from '@/platform/storage';

export type Locale = 'ar' | 'en';
export const LOCALES: readonly Locale[] = ['ar', 'en'];
export const DEFAULT_LOCALE: Locale = 'ar';
const STORAGE_KEY = 'khatwa.locale';

/** Each locale is a separate chunk, so only the active language is downloaded. */
const loaders: Record<Locale, () => Promise<Messages>> = {
  ar: () => import('./locales/ar').then((m) => m.ar),
  en: () => import('./locales/en').then((m) => m.en),
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function directionOf(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** Saved choice → device language → default. */
export function detectLocale(
  saved: string | null = safeStorage.getItem(STORAGE_KEY),
  deviceLanguages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages,
): Locale {
  if (isLocale(saved)) return saved;
  for (const lang of deviceLanguages) {
    const base = lang.toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

const localeStore = writable<Locale>(DEFAULT_LOCALE);
const messagesStore = writable<Messages | null>(null);

export const locale = { subscribe: localeStore.subscribe };

export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

/** Reactive translate function: `$t('auth.or')`. */
export const t = derived(
  messagesStore,
  ($messages): Translate =>
    (key, params) =>
      interpolate($messages?.[key] ?? key, params),
);

function applyToDocument(next: Locale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = next;
  document.documentElement.dir = directionOf(next);
}

export async function setLocale(next: Locale): Promise<void> {
  const messages = await loaders[next]();
  messagesStore.set(messages);
  localeStore.set(next);
  applyToDocument(next);
  safeStorage.setItem(STORAGE_KEY, next);
}

/** Must be awaited before the first render so the UI never flashes untranslated keys. */
export function initI18n(): Promise<void> {
  return setLocale(detectLocale());
}

export function toggleLocale(): Promise<void> {
  return setLocale(get(localeStore) === 'ar' ? 'en' : 'ar');
}

