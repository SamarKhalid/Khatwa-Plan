import { describe, expect, it } from 'vitest';
import { detectLocale, directionOf, interpolate } from '@/i18n';
import { ar } from '@/i18n/locales/ar';
import { en } from '@/i18n/locales/en';

describe('i18n', () => {
  it('has identical keys in every locale', () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });

  it('has no empty messages', () => {
    for (const catalog of [ar, en]) {
      for (const [key, value] of Object.entries(catalog)) {
        expect(value.trim(), key).not.toBe('');
      }
    }
  });

  it('keeps the same placeholders in every locale', () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(ar[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it('interpolates params and leaves unknown ones untouched', () => {
    expect(interpolate('Hi {name}', { name: 'Sara' })).toBe('Hi Sara');
    expect(interpolate('Hi {name}', {})).toBe('Hi {name}');
    expect(interpolate('Hi')).toBe('Hi');
  });

  it('maps locales to direction', () => {
    expect(directionOf('ar')).toBe('rtl');
    expect(directionOf('en')).toBe('ltr');
  });

  it('detects locale: saved choice > device language > default', () => {
    expect(detectLocale('en', ['ar-EG'])).toBe('en');
    expect(detectLocale(null, ['fr-FR', 'en-US'])).toBe('en');
    expect(detectLocale(null, ['ar-SA'])).toBe('ar');
    expect(detectLocale(null, ['fr-FR'])).toBe('ar');
    expect(detectLocale('xx', [])).toBe('ar');
  });
});

