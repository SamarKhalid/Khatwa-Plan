<script lang="ts">
  import { auth } from '@/auth';
  import { t } from '@/i18n';
  import GoogleIcon from './GoogleIcon.svelte';

  let {
    open = false,
    onclose,
  }: {
    open: boolean;
    onclose: () => void;
  } = $props();

  let dialog: HTMLDialogElement;

  $effect(() => {
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  });

  function handleSignIn() {
    onclose();
    auth.exitGuest();
  }
</script>

<dialog bind:this={dialog} aria-labelledby="guest-notice-title" onclose={() => open && onclose()}>
  <div class="icon-wrap" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  </div>
  <h2 id="guest-notice-title">{$t('editor.guestNotice.title')}</h2>
  <p>{$t('editor.guestNotice.text')}</p>
  <div class="buttons">
    <button type="button" class="google-btn" onclick={handleSignIn}>
      <GoogleIcon />
      <span>{$t('editor.guestNotice.signIn')}</span>
    </button>
    <button type="button" class="cancel" onclick={onclose}>
      {$t('editor.guestNotice.stay')}
    </button>
  </div>
</dialog>

<style>
  dialog {
    border: 0;
    border-radius: 18px;
    width: min(390px, calc(100% - 24px));
    padding: 24px 20px;
    box-shadow: 0 16px 60px #15251d35;
    color: var(--ink);
    text-align: center;
    margin: auto;
  }
  dialog::backdrop {
    background: #17231c66;
    backdrop-filter: blur(2px);
  }
  .icon-wrap {
    width: 52px;
    height: 52px;
    margin: 0 auto 12px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--green);
    display: grid;
    place-items: center;
  }
  h2 {
    font-size: 19px;
    margin: 0 0 8px;
  }
  p {
    color: var(--muted);
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 20px;
  }
  .buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .buttons button {
    padding: 12px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    min-height: 48px;
  }
  .google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #fff;
    border: 1px solid #c9d6cc;
    font-weight: 700;
  }
  .google-btn:hover {
    background: #f7faf7;
  }
  .cancel {
    background: #f0f3f0;
  }
  @media (max-width: 480px) {
    dialog {
      padding: 20px 16px;
      width: calc(100% - 20px);
    }
  }
</style>
