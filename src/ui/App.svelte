<script lang="ts">
  import { auth } from '@/auth';
  import { t } from '@/i18n';
  import AuthPage from './components/AuthPage.svelte';
  import Editor from './components/Editor.svelte';
  import InstallNoticeDialog from './components/InstallNoticeDialog.svelte';
</script>

{#if $auth.status === 'loading'}
  <div class="splash" role="status" aria-live="polite">
    <div class="spinner" aria-hidden="true"></div>
    <span class="visually-hidden">{$t('loading')}</span>
  </div>
{:else if $auth.status === 'signed-out'}
  <AuthPage />
{:else}
  <Editor />
{/if}

<InstallNoticeDialog />

<style>
  .splash {
    min-height: 100dvh;
    display: grid;
    place-items: center;
  }
  .spinner {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 4px solid var(--line);
    border-top-color: var(--green);
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
