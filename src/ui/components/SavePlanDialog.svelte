<script lang="ts">
  import { t } from '@/i18n';

  let {
    open = false,
    initialName = '',
    planId = null,
    saving = false,
    onconfirm,
    onclose,
  }: {
    open: boolean;
    initialName?: string;
    planId?: string | null;
    saving?: boolean;
    onconfirm: (name: string, asNew: boolean) => void;
    onclose: () => void;
  } = $props();

  let dialog: HTMLDialogElement;
  let name = $state('');

  $effect(() => {
    if (open) {
      name = initialName ?? '';
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  });

  function handleSave(asNew: boolean) {
    onconfirm(name, asNew);
  }
</script>

<dialog bind:this={dialog} aria-labelledby="save-title" onclose={() => open && onclose()}>
  <form onsubmit={(e) => { e.preventDefault(); handleSave(!planId); }}>
    <h2 id="save-title">
      {planId ? $t('editor.saveDialog.updateTitle') : $t('editor.saveDialog.title')}
    </h2>

    {#if planId}
      <p class="desc">
        {$t('editor.saveDialog.updateText', { name: initialName || $t('history.unnamed') })}
      </p>
    {/if}

    <label for="plan-name-input">{$t('editor.saveDialog.label')}</label>
    <input
      id="plan-name-input"
      type="text"
      bind:value={name}
      disabled={saving}
      placeholder={$t('editor.saveDialog.placeholder')}
      maxlength="80"
    />

    {#if planId}
      <!-- Options when currently working on an existing saved plan -->
      <div class="choices">
        <button
          type="button"
          class="update-btn"
          disabled={saving}
          onclick={() => handleSave(false)}
        >
          {saving ? $t('editor.saveDialog.saving') : $t('editor.saveDialog.updateBtn')}
        </button>

        <button
          type="button"
          class="new-btn"
          disabled={saving}
          onclick={() => handleSave(true)}
        >
          {saving ? $t('editor.saveDialog.saving') : $t('editor.saveDialog.saveAsNewBtn')}
        </button>
      </div>

      <div class="cancel-row">
        <button type="button" class="cancel" disabled={saving} onclick={onclose}>
          {$t('editor.dialog.cancel')}
        </button>
      </div>
    {:else}
      <!-- Options when saving a brand new drawing -->
      <div class="buttons">
        <button type="button" class="cancel" disabled={saving} onclick={onclose}>
          {$t('editor.dialog.cancel')}
        </button>
        <button type="submit" class="go" disabled={saving}>
          {saving ? $t('editor.saveDialog.saving') : $t('editor.saveDialog.confirm')}
        </button>
      </div>
    {/if}
  </form>
</dialog>

<style>
  dialog {
    border: 0;
    border-radius: 18px;
    width: min(420px, calc(100% - 32px));
    padding: 24px;
    box-shadow: 0 16px 60px #15251d35;
    color: var(--ink);
  }
  dialog::backdrop {
    background: #17231c66;
  }
  h2 {
    font-size: 19px;
    margin: 0 0 12px;
  }
  .desc {
    font-size: 14px;
    color: var(--muted);
    line-height: 1.5;
    margin: 0 0 16px;
  }
  label {
    display: block;
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 8px;
  }
  input {
    width: 100%;
    font: inherit;
    font-size: 16px;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 11px;
    outline-color: var(--green);
    margin-bottom: 20px;
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 12px;
  }
  .update-btn {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    background: var(--green);
    color: #fff;
    font-weight: 700;
    font-size: 14px;
  }
  .new-btn {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    background: #edf5ef;
    color: var(--green-dark);
    border: 1px solid var(--line);
    font-weight: 700;
    font-size: 14px;
  }
  .cancel-row {
    display: flex;
    justify-content: center;
  }
  .cancel-row button {
    width: 100%;
    padding: 10px;
    border-radius: 10px;
    background: #f0f3f0;
    font-size: 13px;
  }
  .buttons {
    display: flex;
    gap: 8px;
  }
  .buttons button {
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    font-weight: 600;
  }
  .cancel {
    background: #f0f3f0;
  }
  .go {
    background: var(--green);
    color: #fff;
    font-weight: 700;
  }
  @media (max-width: 480px) {
    dialog {
      padding: 18px 16px;
      width: calc(100% - 20px);
    }
  }
</style>
