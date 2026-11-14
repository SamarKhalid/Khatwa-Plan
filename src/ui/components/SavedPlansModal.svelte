<script lang="ts">
  import type { Plan } from '@/core/plan';
  import { locale, t } from '@/i18n';
  import { planRepository, type SavedPlanMeta } from '@/storage';
  import { toast } from '@/ui/toast';

  let {
    open = false,
    userId = '',
    onopen,
    onclose,
  }: {
    open: boolean;
    userId: string;
    onopen: (plan: Plan, name: string | null, id: string) => void;
    onclose: () => void;
  } = $props();

  let dialog: HTMLDialogElement;
  let loading = $state(false);
  let deletingId = $state<string | null>(null);
  let plans = $state<SavedPlanMeta[]>([]);

  $effect(() => {
    if (open && userId) {
      if (!dialog.open) dialog.showModal();
      void loadPlans();
    } else if (dialog.open) {
      dialog.close();
    }
  });

  async function loadPlans() {
    loading = true;
    try {
      plans = await planRepository.list(userId);
    } catch {
      toast.show('editor.toast.saveFailed');
    } finally {
      loading = false;
    }
  }

  function formatDate(timestamp: number): string {
    try {
      return new Intl.DateTimeFormat($locale === 'ar' ? 'ar-EG' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleDateString();
    }
  }

  async function handleOpen(item: SavedPlanMeta) {
    try {
      const plan = await planRepository.load(userId, item.id);
      onopen(plan, item.name, item.id);
      onclose();
      toast.show('editor.toast.loaded');
    } catch {
      toast.show('editor.toast.saveFailed');
    }
  }

  async function handleDelete(item: SavedPlanMeta) {
    const title = item.name || $t('history.unnamed');
    if (!confirm($t('history.deleteConfirm', { name: title }))) return;

    deletingId = item.id;
    try {
      await planRepository.remove(userId, item.id);
      plans = plans.filter((p) => p.id !== item.id);
      toast.show('editor.toast.deleted');
    } catch {
      toast.show('editor.toast.deleteFailed');
    } finally {
      deletingId = null;
    }
  }
</script>

<dialog bind:this={dialog} aria-labelledby="history-modal-title" onclose={() => open && onclose()}>
  <div class="header">
    <h2 id="history-modal-title">{$t('history.title')}</h2>
    <button type="button" class="close-btn" aria-label={$t('history.close')} onclick={onclose}>
      ✕
    </button>
  </div>

  <div class="content">
    {#if loading}
      <div class="state-msg">{$t('history.loading')}</div>
    {:else if plans.length === 0}
      <div class="state-msg">
        <div class="empty-icon" aria-hidden="true">📂</div>
        <p>{$t('history.empty')}</p>
      </div>
    {:else}
      <ul class="list">
        {#each plans as item (item.id)}
          <li class="item">
            <div class="meta">
              <div class="title">{item.name || $t('history.unnamed')}</div>
              <div class="date">{formatDate(item.savedAt)}</div>
              <div class="badges">
                <span class="badge">{$t('history.walls', { n: item.wallCount })}</span>
                <span class="badge">{$t('history.openings', { n: item.openingCount })}</span>
                <span class="badge">{$t('history.length', { n: item.wallLengthCm })}</span>
              </div>
            </div>
            <div class="actions">
              <button
                type="button"
                class="open-btn"
                onclick={() => void handleOpen(item)}
              >
                {$t('history.open')}
              </button>
              <button
                type="button"
                class="delete-btn"
                disabled={deletingId === item.id}
                onclick={() => void handleDelete(item)}
              >
                {$t('history.delete')}
              </button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</dialog>

<style>
  dialog {
    border: 0;
    border-radius: 18px;
    width: min(520px, calc(100% - 24px));
    max-height: 85dvh;
    padding: 0;
    box-shadow: 0 16px 60px #15251d35;
    color: var(--ink);
    display: flex;
    flex-direction: column;
    margin: auto;
  }
  dialog::backdrop {
    background: #17231c66;
    backdrop-filter: blur(2px);
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    border-bottom: 1px solid var(--line);
    background: #fff;
  }
  h2 {
    font-size: 18px;
    margin: 0;
  }
  .close-btn {
    background: #f0f3f0;
    font-size: 14px;
    padding: 8px 12px;
    border-radius: 999px;
    color: var(--muted);
    min-height: 34px;
    display: grid;
    place-items: center;
  }
  .content {
    padding: 14px 16px;
    overflow-y: auto;
    max-height: 70dvh;
    -webkit-overflow-scrolling: touch;
  }
  .state-msg {
    text-align: center;
    padding: 36px 12px;
    color: var(--muted);
    font-size: 14px;
  }
  .empty-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    background: #f8faf8;
    border: 1px solid var(--line);
    border-radius: 14px;
  }
  .meta {
    flex: 1;
    min-width: 0;
  }
  .title {
    font-weight: 700;
    font-size: 15px;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .date {
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 6px;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .badge {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 6px;
    background: #eef3ee;
    color: var(--ink);
    font-weight: 500;
  }
  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
  }
  .open-btn {
    padding: 9px 14px;
    border-radius: 9px;
    background: var(--green);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    min-height: 38px;
  }
  .delete-btn {
    padding: 9px 12px;
    border-radius: 9px;
    background: #fdf2f2;
    color: var(--danger);
    font-size: 13px;
    min-height: 38px;
  }

  @media (max-width: 480px) {
    dialog {
      width: calc(100% - 16px);
      max-height: 88dvh;
    }
    .item {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      padding: 12px;
    }
    .actions {
      justify-content: flex-end;
      border-top: 1px solid #edf2ee;
      padding-top: 8px;
    }
    .open-btn,
    .delete-btn {
      flex: 1;
      text-align: center;
      min-height: 42px;
    }
  }
</style>
