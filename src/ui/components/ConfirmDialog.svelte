<script lang="ts" module>
  export interface ConfirmRequest {
    title: string;
    text: string;
    confirmLabel: string;
    onconfirm: () => void;
  }
</script>

<script lang="ts">
  import { t } from '@/i18n';

  let { request, onclose }: { request: ConfirmRequest | null; onclose: () => void } = $props();

  let dialog: HTMLDialogElement;

  $effect(() => {
    if (request) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  });

  function confirm() {
    const current = request;
    onclose();
    current?.onconfirm();
  }
</script>

<dialog bind:this={dialog} aria-labelledby="confirm-title" onclose={() => request && onclose()}>
  <h2 id="confirm-title">{request?.title}</h2>
  <p>{request?.text}</p>
  <div class="buttons">
    <button type="button" class="cancel" onclick={onclose}>{$t('editor.dialog.cancel')}</button>
    <button type="button" class="go" onclick={confirm}>{request?.confirmLabel}</button>
  </div>
</dialog>

<style>
  dialog {
    border: 0;
    border-radius: 18px;
    width: min(380px, calc(100% - 24px));
    padding: 22px;
    box-shadow: 0 16px 60px #15251d35;
    color: var(--ink);
    margin: auto;
  }
  dialog::backdrop {
    background: #17231c66;
    backdrop-filter: blur(2px);
  }
  h2 {
    font-size: 19px;
    margin: 0 0 8px;
  }
  p {
    color: var(--muted);
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 20px;
  }
  .buttons {
    display: flex;
    gap: 8px;
  }
  .buttons button {
    flex: 1;
    padding: 12px;
    min-height: 46px;
    border-radius: 11px;
    font-size: 14px;
    font-weight: 700;
  }
  .cancel {
    background: #f0f3f0;
    color: var(--ink);
  }
  .go {
    background: var(--green);
    color: #fff;
  }
  @media (max-width: 480px) {
    dialog {
      padding: 18px 16px;
      width: calc(100% - 20px);
    }
  }
</style>
