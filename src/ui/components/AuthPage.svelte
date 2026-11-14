<script lang="ts">
  import { auth } from '@/auth';
  import type { AuthErrorCode } from '@/auth';
  import type { MessageKey } from '@/i18n/locales/en';
  import { t } from '@/i18n';
  import GoogleIcon from './GoogleIcon.svelte';
  import LanguageSwitcher from './LanguageSwitcher.svelte';

  type Mode = 'signIn' | 'register';
  let mode = $state<Mode>('signIn');

  const ERROR_KEYS: Record<AuthErrorCode, MessageKey> = {
    'popup-blocked': 'auth.error.popupBlocked',
    network: 'auth.error.network',
    'too-many-requests': 'auth.error.tooManyRequests',
    'unauthorized-domain': 'auth.error.unauthorizedDomain',
    'account-disabled': 'auth.error.accountDisabled',
    unknown: 'auth.error.unknown',
  };

  function setMode(next: Mode) {
    mode = next;
    auth.clearError();
  }
</script>

<main class="page">
  <div class="topbar"><LanguageSwitcher /></div>

  <section class="card" aria-labelledby="auth-title">
    <div class="logo" aria-hidden="true">
      <svg viewBox="0 0 128 128" width="56" height="56">
        <rect width="128" height="128" rx="28" fill="#176b50" />
        <path d="M32 92V36h20v36h44v20z" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round" />
        <circle cx="32" cy="92" r="6" fill="#d8f0df" />
      </svg>
    </div>
    <p class="brand">{$t('app.name')}</p>
    <p class="tagline">{$t('app.tagline')}</p>

    <div class="tabs" role="tablist" aria-label={$t('app.name')}>
      <button
        type="button"
        role="tab"
        id="tab-signIn"
        aria-selected={mode === 'signIn'}
        aria-controls="auth-panel"
        class:active={mode === 'signIn'}
        onclick={() => setMode('signIn')}
      >
        {$t('auth.signIn.tab')}
      </button>
      <button
        type="button"
        role="tab"
        id="tab-register"
        aria-selected={mode === 'register'}
        aria-controls="auth-panel"
        class:active={mode === 'register'}
        onclick={() => setMode('register')}
      >
        {$t('auth.register.tab')}
      </button>
    </div>

    <div id="auth-panel" role="tabpanel" aria-labelledby="tab-{mode}" class="panel">
      <h1 id="auth-title">{$t(mode === 'signIn' ? 'auth.signIn.title' : 'auth.register.title')}</h1>
      <p class="subtitle">
        {$t(mode === 'signIn' ? 'auth.signIn.subtitle' : 'auth.register.subtitle')}
      </p>

      {#if $auth.error}
        <p class="error" role="alert">{$t(ERROR_KEYS[$auth.error])}</p>
      {/if}

      <button
        type="button"
        class="google"
        disabled={$auth.busy}
        aria-busy={$auth.busy}
        onclick={() => void auth.signInWithGoogle()}
      >
        <GoogleIcon />
        <span>
          {$auth.busy
            ? $t('auth.busy')
            : $t(mode === 'signIn' ? 'auth.google.signIn' : 'auth.google.register')}
        </span>
      </button>

      <div class="divider" role="separator"><span>{$t('auth.or')}</span></div>

      <button type="button" class="guest" disabled={$auth.busy} onclick={() => auth.continueAsGuest()}>
        {$t('auth.guest.button')}
      </button>
      <p class="note">{$t('auth.guest.note')}</p>

      <button
        type="button"
        class="switch"
        onclick={() => setMode(mode === 'signIn' ? 'register' : 'signIn')}
      >
        {$t(mode === 'signIn' ? 'auth.switch.toRegister' : 'auth.switch.toSignIn')}
      </button>
    </div>
  </section>
</main>

<style>
  .page {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
    background:
      radial-gradient(900px 400px at 50% -10%, #d9eee3 0%, transparent 70%),
      var(--bg);
  }
  .topbar {
    width: min(440px, 100%);
    display: flex;
    justify-content: flex-end;
  }
  .card {
    width: min(440px, 100%);
    margin: auto 0;
    padding: 28px 24px 22px;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 22px;
    box-shadow: var(--shadow);
    text-align: center;
  }
  .logo {
    display: grid;
    place-items: center;
  }
  .brand {
    margin: 10px 0 2px;
    font-size: 22px;
    font-weight: 800;
    color: var(--green);
  }
  .tagline {
    margin: 0 0 20px;
    color: var(--muted);
    font-size: 13px;
  }
  .tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    padding: 4px;
    background: #eef3ee;
    border-radius: 12px;
  }
  .tabs button {
    padding: 10px 8px;
    border-radius: 9px;
    background: transparent;
    font-size: 14px;
    font-weight: 600;
    color: var(--muted);
  }
  .tabs button.active {
    background: #fff;
    color: var(--ink);
    box-shadow: 0 1px 4px #15251d1f;
  }
  .panel {
    margin-top: 20px;
  }
  h1 {
    margin: 0 0 6px;
    font-size: 20px;
  }
  .subtitle {
    margin: 0 0 18px;
    color: var(--muted);
    font-size: 14px;
    line-height: 1.6;
  }
  .error {
    margin: 0 0 14px;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--danger-bg);
    color: var(--danger);
    font-size: 13px;
    line-height: 1.5;
    text-align: start;
  }
  .google,
  .guest {
    width: 100%;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 15px;
  }
  .google {
    background: #fff;
    border: 1px solid #c9d6cc;
  }
  .google:hover:not(:disabled) {
    background: #f7faf7;
  }
  .guest {
    background: var(--green);
    color: #fff;
  }
  .guest:hover:not(:disabled) {
    background: var(--green-dark);
  }
  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 16px 0;
    color: var(--muted);
    font-size: 12px;
  }
  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--line);
  }
  .note {
    margin: 8px 0 0;
    color: var(--muted);
    font-size: 12px;
  }
  .switch {
    margin-top: 18px;
    padding: 6px 10px;
    background: none;
    color: var(--green);
    font-size: 13px;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  @media (max-width: 480px) {
    .page {
      padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
    }
    .card {
      padding: 22px 16px 18px;
      border-radius: 18px;
    }
    .brand {
      font-size: 20px;
    }
    h1 {
      font-size: 18px;
    }
    .subtitle {
      font-size: 13px;
      margin-bottom: 14px;
    }
    .google,
    .guest {
      min-height: 46px;
      font-size: 14px;
    }
  }
</style>

