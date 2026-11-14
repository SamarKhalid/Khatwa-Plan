<script lang="ts" module>
  export interface AmountRequest {
    title: string;
    text: string;
    initial?: string;
    onconfirm: (value: number) => void;
  }
</script>

<script lang="ts">
  import { isValidLength } from '@/core/plan';
  import { t } from '@/i18n';

  let { request, onclose }: { request: AmountRequest | null; onclose: () => void } = $props();

  let dialog: HTMLDialogElement;
  let input = $state<HTMLInputElement>();
  let value = $state('');
  let invalid = $state(false);

  $effect(() => {
    if (request) {
      value = request.initial ?? '';
      invalid = false;
      if (!dialog.open) dialog.showModal();
      // On mobile, slight delay helps virtual keyboard open smoothly
      setTimeout(() => input?.focus(), 80);
    } else if (dialog.open) {
      dialog.close();
    }
  });

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const amount = Number(value);
    if (!isValidLength(amount)) {
      invalid = true;
      input?.focus();
      return;
    }
    const current = request;
    onclose();
    current?.onconfirm(amount);
  }
</script>

<dialog bind:this={dialog} aria-labelledby="amount-title" onclose={() => request && onclose()}>
  <form onsubmit={submit}>
    <h2 id="amount-title">{request?.title}</h2>
    <p class="desc">{request?.text}</p>
    <div class="row">
      <input
        bind:this={input}
        bind:value
        type="number"
        inputmode="decimal"
        step="any"
        min="0"
        placeholder={$t('editor.dialog.placeholder')}
        aria-label={request?.title}
        aria-invalid={invalid}
        oninput={() => (invalid = false)}
      />
      <span class="unit">{$t('editor.dialog.unit')}</span>
    </div>
    {#if invalid}
      <p class="error" role="alert">{$t('editor.dialog.invalid')}</p>
    {/if}
    <div class="buttons">
      <button type="button" class="cancel" onclick={onclose}>{$t('editor.dialog.cancel')}</button>
      <button type="submit" class="go">{$t('editor.dialog.confirm')}</button>
    </div>
  </form>
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
    margin: 0 0 6px;
  }
  .desc {
    color: var(--muted);
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 16px;
  }
  .row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  input {
    width: 100%;
    font: inherit;
    font-size: 22px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
    outline-color: var(--green);
    direction: ltr;
    text-align: left;
    min-height: 48px;
    background: #fff;
  }
  input[aria-invalid='true'] {
    border-color: var(--danger);
  }
  .unit {
    color: var(--muted);
    font-weight: 600;
  }
  .error {
    margin: 8px 0 0;
    color: var(--danger);
    font-size: 13px;
  }
  .buttons {
    display: flex;
    gap: 8px;
    margin-top: 20px;
  }
  .buttons button {
    flex: 1;
    padding: 12px;
    min-height: 48px;
    border-radius: 11px;
    font-weight: 700;
    font-size: 15px;
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
