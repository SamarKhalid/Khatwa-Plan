<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '@/i18n';
  import { safeStorage } from '@/platform/storage';

  const STORAGE_KEY = 'khatwa.install_notice_seen';

  let dialog: HTMLDialogElement;
  let open = $state(false);

  onMount(() => {
    // Only show if user hasn't seen it yet and not already running as installed standalone PWA
    const seen = safeStorage.getItem(STORAGE_KEY) === '1';
    const isStandalone =
      (typeof window !== 'undefined' &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof navigator !== 'undefined' && (navigator as unknown as { standalone?: boolean }).standalone === true);

    if (!seen && !isStandalone) {
      open = true;
    }
  });

  $effect(() => {
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  });

  function dismiss() {
    safeStorage.setItem(STORAGE_KEY, '1');
    open = false;
  }
</script>

<dialog bind:this={dialog} aria-labelledby="notice-title" onclose={dismiss}>
  <div class="icon-wrap" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  </div>

  <h2 id="notice-title">{$t('installNotice.title')}</h2>

  <div class="cards">
    <!-- Android card -->
    <div class="card android">
      <div class="card-head">
        <span class="platform-icon" aria-hidden="true">🤖</span>
        <strong>{$t('installNotice.androidTitle')}</strong>
      </div>
      <p>{$t('installNotice.androidText')}</p>
    </div>

    <!-- iOS Safari card -->
    <div class="card ios">
      <div class="card-head">
        <span class="platform-icon" aria-hidden="true">🍎</span>
        <strong>{$t('installNotice.iosTitle')}</strong>
      </div>
      <p>{$t('installNotice.iosText')}</p>
    </div>
  </div>

  <button type="button" class="dismiss-btn" onclick={dismiss}>
    {$t('installNotice.dismiss')}
  </button>
</dialog>

<style>
  dialog {
    border: 0;
    border-radius: 20px;
    width: min(440px, calc(100% - 24px));
    padding: 24px 20px;
    box-shadow: 0 20px 60px #15251d3f;
    color: var(--ink);
    text-align: center;
    margin: auto;
    max-height: 90dvh;
    overflow-y: auto;
  }
  dialog::backdrop {
    background: #17231c66;
    backdrop-filter: blur(3px);
  }
  .icon-wrap {
    width: 56px;
    height: 56px;
    margin: 0 auto 12px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--green);
    display: grid;
    place-items: center;
  }
  h2 {
    font-size: 18px;
    margin: 0 0 16px;
  }
  .cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
    text-align: start;
  }
  .card {
    padding: 14px 16px;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: #f8faf8;
  }
  .card-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 14px;
  }
  .platform-icon {
    font-size: 16px;
  }
  .card p {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
    line-height: 1.6;
    word-break: break-word;
  }
  .dismiss-btn {
    width: 100%;
    padding: 13px;
    border-radius: 12px;
    background: var(--green);
    color: #fff;
    font-weight: 700;
    font-size: 15px;
    min-height: 48px;
  }
  .dismiss-btn:hover {
    background: var(--green-dark);
  }

  @media (max-width: 480px) {
    dialog {
      padding: 20px 16px;
      width: calc(100% - 20px);
    }
    h2 {
      font-size: 17px;
    }
  }
</style>

