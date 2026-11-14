<script lang="ts">
  import { t, locale, toggleLocale } from '@/i18n';
</script>

<button
  type="button"
  class="lang"
  lang={$locale === 'ar' ? 'en' : 'ar'}
  aria-label={$t('lang.switchLabel')}
  title={$t('lang.switchLabel')}
  onclick={() => void toggleLocale()}
>
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
  </svg>
  <span class="text">{$t('lang.switch')}</span>
</button>

<style>
  .lang {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 11px;
    border-radius: 999px;
    background: #fff;
    border: 1px solid var(--line);
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
    white-space: nowrap;
    min-height: 34px;
    touch-action: manipulation;
  }
  .lang:hover {
    background: var(--accent);
  }
  @media (max-width: 640px) {
    .lang {
      padding: 6px 8px;
      font-size: 12px;
      gap: 4px;
    }
  }
</style>
