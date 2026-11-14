<script lang="ts">
  import { createEditor } from '@/app/editor';
  import { auth } from '@/auth';
  import { toDxf } from '@/core/export/dxf';
  import { toJson } from '@/core/export/json';
  import { DIRECTIONS, fmt, type Direction, type LogEntry, type OpeningType } from '@/core/plan';
  import { hasContent } from '@/core/serialization';
  import { t } from '@/i18n';
  import { sanitizeFileName, saveFile } from '@/platform/files';
  import { planRepository } from '@/storage';
  import { toast } from '@/ui/toast';
  import AmountDialog, { type AmountRequest } from './AmountDialog.svelte';
  import ConfirmDialog, { type ConfirmRequest } from './ConfirmDialog.svelte';
  import GuestNoticeDialog from './GuestNoticeDialog.svelte';
  import LanguageSwitcher from './LanguageSwitcher.svelte';
  import PlanCanvas from './PlanCanvas.svelte';
  import SavePlanDialog from './SavePlanDialog.svelte';
  import SavedPlansModal from './SavedPlansModal.svelte';
  import Toast from './Toast.svelte';

  const editor = createEditor();

  let canvasApi: PlanCanvas;
  let amountRequest = $state<AmountRequest | null>(null);
  let confirmRequest = $state<ConfirmRequest | null>(null);
  let saveDialogOpen = $state(false);
  let saving = $state(false);
  let historyModalOpen = $state(false);
  let guestNoticeOpen = $state(false);

  const plan = $derived($editor.plan);
  const planId = $derived($editor.planId);
  const planName = $derived($editor.planName);
  const isGuest = $derived($auth.status === 'guest');
  const user = $derived($auth.user);
  const dirName = (d: Direction) => $t(`editor.dir.${d}`);
  const accountName = $derived($auth.user?.displayName ?? $auth.user?.email ?? '');

  function describe(entry: LogEntry): string {
    switch (entry.kind) {
      case 'start':
        return $t('editor.history.start');
      case 'move':
        return $t('editor.history.move', { dir: dirName(entry.dir), length: fmt(entry.length) });
      case 'opening':
        return $t('editor.history.opening', {
          type: $t(entry.type === 'door' ? 'editor.door' : 'editor.window'),
          width: fmt(entry.width),
        });
    }
  }

  const recent = $derived(plan.log.slice(-5).reverse());

  function ensureStarted(): boolean {
    if (plan.started) return true;
    toast.show('editor.toast.needStart');
    return false;
  }

  function askMove(dir: Direction, initial = '') {
    if (!ensureStarted()) return;
    amountRequest = {
      title: $t('editor.dialog.distance.title'),
      text: $t('editor.dialog.distance.text', { dir: dirName(dir) }),
      initial,
      onconfirm: (value) => editor.move(dir, value),
    };
  }

  function askOpening(type: OpeningType) {
    if (!ensureStarted()) return;
    const key = type === 'door' ? 'door' : 'window';
    amountRequest = {
      title: $t(`editor.dialog.${key}.title`),
      text: $t(`editor.dialog.${key}.text`, { dir: dirName(plan.dir) }),
      onconfirm: (value) => editor.addOpening(type, value),
    };
  }

  function start() {
    const begin = () => {
      editor.start();
      toast.show('editor.toast.startSet');
    };
    if (!plan.started) return begin();
    confirmRequest = {
      title: $t('editor.confirm.title'),
      text: $t('editor.confirm.text'),
      confirmLabel: $t('editor.confirm.yes'),
      onconfirm: begin,
    };
  }

  function undo() {
    toast.show(editor.undo() ? 'editor.toast.undone' : 'editor.toast.nothingToUndo');
  }

  function redo() {
    toast.show(editor.redo() ? 'editor.toast.redone' : 'editor.toast.nothingToRedo');
  }

  function handleSaveClick() {
    if (isGuest || !user) {
      guestNoticeOpen = true;
      return;
    }
    if (!hasContent(plan)) {
      toast.show('editor.toast.emptyPlan');
      return;
    }
    saveDialogOpen = true;
  }

  function handleHistoryClick() {
    if (isGuest || !user) {
      guestNoticeOpen = true;
      return;
    }
    historyModalOpen = true;
  }

  async function executeSave(name: string, asNew: boolean) {
    if (!user) return;
    saving = true;
    try {
      const targetId = asNew ? null : planId;
      const result = await planRepository.save(user.uid, plan, name, targetId);
      editor.setName(name ? name.trim() : null);
      editor.setPlanId(result.id);
      saveDialogOpen = false;
      toast.show(targetId ? 'editor.toast.updated' : 'editor.toast.saved');
    } catch {
      toast.show('editor.toast.saveFailed');
    } finally {
      saving = false;
    }
  }

  function exportDxf() {
    const base = sanitizeFileName(planName || 'plan', 'plan');
    saveFile(toDxf(plan), `${base}.dxf`, 'application/dxf');
    toast.show('editor.toast.dxfExported');
  }

  function exportJson() {
    const base = sanitizeFileName(planName || 'plan-data', 'plan-data');
    saveFile(toJson(plan), `${base}.json`, 'application/json');
    toast.show('editor.toast.jsonExported');
  }

  const ARROWS: Record<string, Direction> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
  };

  function onKeydown(e: KeyboardEvent) {
    const typing = e.target instanceof HTMLElement && e.target.matches('input, textarea, select');
    if (
      amountRequest ||
      confirmRequest ||
      saveDialogOpen ||
      historyModalOpen ||
      guestNoticeOpen ||
      e.altKey ||
      typing
    ) {
      return;
    }

    const code = e.code;
    if (e.ctrlKey || e.metaKey) {
      if (code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (code === 'KeyY' || (code === 'KeyZ' && e.shiftKey)) {
        e.preventDefault();
        redo();
        return;
      }
      if (code === 'KeyS') {
        e.preventDefault();
        handleSaveClick();
        return;
      }
      return;
    }

    const arrow = ARROWS[code];
    if (arrow) {
      e.preventDefault();
      askMove(arrow);
      return;
    }
    const digit = /^(?:Digit|Numpad)(\d)$/.exec(code);
    if (digit) {
      e.preventDefault();
      askMove(plan.dir, digit[1]);
      return;
    }
    switch (code) {
      case 'KeyD':
        e.preventDefault();
        askOpening('door');
        break;
      case 'KeyW':
        e.preventDefault();
        askOpening('window');
        break;
      case 'KeyS':
        e.preventDefault();
        start();
        break;
      case 'Backspace':
        e.preventDefault();
        undo();
        break;
      case 'Home':
        e.preventDefault();
        canvasApi.goHome();
        break;
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="shell">
  <header>
    <div class="brand">
      <span class="brand-name">{$t('app.name')}</span>
      {#if planName}
        <span class="plan-title" title={planName}>· {planName}</span>
      {/if}
    </div>

    <div class="top">
      <button
        type="button"
        class="small icon-btn"
        onclick={undo}
        disabled={!$editor.canUndo}
        aria-label={$t('editor.undo')}
        title={$t('editor.undo')}
      >
        <span class="btn-symbol">↩</span>
        <span class="btn-text">{$t('editor.undo')}</span>
      </button>

      <button
        type="button"
        class="small icon-btn"
        onclick={redo}
        disabled={!$editor.canRedo}
        aria-label={$t('editor.redo')}
        title={$t('editor.redo')}
      >
        <span class="btn-symbol">↪</span>
        <span class="btn-text">{$t('editor.redo')}</span>
      </button>

      <!-- Save & History buttons (guarded for guest mode) -->
      <button
        type="button"
        class="small action-btn"
        class:guest-locked={isGuest}
        onclick={handleSaveClick}
        aria-label={$t('editor.save')}
        title={$t('editor.save')}
      >
        <span class="btn-icon" aria-hidden="true">💾</span>
        <span class="btn-text">{$t('editor.save')}</span>
      </button>

      <button
        type="button"
        class="small action-btn"
        class:guest-locked={isGuest}
        onclick={handleHistoryClick}
        aria-label={$t('editor.savedPlans')}
        title={$t('editor.savedPlans')}
      >
        <span class="btn-icon" aria-hidden="true">📂</span>
        <span class="btn-text">{$t('editor.savedPlans')}</span>
      </button>

      <button
        type="button"
        class="small strong export-btn"
        onclick={exportDxf}
        aria-label={$t('editor.exportDxf')}
        title={$t('editor.exportDxf')}
      >
        <span class="dxf-short" aria-hidden="true">DXF</span>
        <span class="btn-text">{$t('editor.exportDxf')}</span>
      </button>

      <LanguageSwitcher />

      <div class="account">
        {#if $auth.status === 'signed-in'}
          {#if $auth.user?.photoURL}
            <img src={$auth.user.photoURL} alt="" width="26" height="26" referrerpolicy="no-referrer" />
          {/if}
          <span class="name">{accountName}</span>
          <button
            type="button"
            class="small signout-btn"
            disabled={$auth.busy}
            onclick={() => void auth.signOut()}
            title={$t('home.signOut')}
          >
            {$t('home.signOut')}
          </button>
        {:else}
          <span class="badge">{$t('home.guestBadge')}</span>
          <button
            type="button"
            class="small strong signin-btn"
            onclick={() => auth.exitGuest()}
            title={$t('home.signInToSave')}
          >
            {$t('home.signInToSave')}
          </button>
        {/if}
      </div>
    </div>
  </header>

  <main class="layout">
    <PlanCanvas bind:this={canvasApi} {plan} />

    <aside class="panel">
      <section class="section">
        <div class="label">{$t('editor.status.label')}</div>
        <div class="status" aria-live="polite">
          {#if plan.started}
            <b>{$t('editor.status.pen', { x: fmt(plan.x), y: fmt(plan.y) })}</b><br />
            {$t('editor.status.direction', { dir: dirName(plan.dir) })}
          {:else}
            {$t('editor.status.idle')}
          {/if}
        </div>
      </section>

      <section class="section">
        <div class="label">{$t('editor.section.direction')}</div>
        <div class="dpad" dir="ltr">
          {#each DIRECTIONS as dir (dir)}
            <button
              type="button"
              class="dir {dir}"
              aria-label={dirName(dir)}
              onclick={() => askMove(dir)}
            >
              {{ up: '↑', down: '↓', left: '←', right: '→' }[dir]}
            </button>
          {/each}
        </div>
      </section>

      <div class="actions">
        <button type="button" class="door" onclick={() => askOpening('door')}>
          🚪 {$t('editor.door')}
        </button>
        <button type="button" onclick={() => askOpening('window')}>▤ {$t('editor.window')}</button>
      </div>

      <button type="button" class="primary" onclick={start}>{$t('editor.start')}</button>
      <button type="button" class="outline" onclick={exportJson}>{$t('editor.exportJson')}</button>

      <div class="section history-section">
        <div class="label">{$t('editor.history.label')}</div>
        <div class="history">
          {#each recent as entry, i (plan.log.length - i)}
            <div>• {describe(entry)}</div>
          {:else}
            {$t('editor.history.empty')}
          {/each}
        </div>
      </div>

      <div class="hint main-hint">{$t('editor.hint.main')}</div>
      <div class="hint shortcuts-hint">
        <b>{$t('editor.shortcuts.title')}</b><br />
        {$t('editor.shortcuts.arrows')}<br />
        {$t('editor.shortcuts.digits')}<br />
        {$t('editor.shortcuts.items')}<br />
        {$t('editor.shortcuts.edit')}
      </div>
    </aside>
  </main>
</div>

<AmountDialog request={amountRequest} onclose={() => (amountRequest = null)} />
<ConfirmDialog request={confirmRequest} onclose={() => (confirmRequest = null)} />
<SavePlanDialog
  open={saveDialogOpen}
  initialName={planName ?? ''}
  {planId}
  {saving}
  onconfirm={(name, asNew) => void executeSave(name, asNew)}
  onclose={() => (saveDialogOpen = false)}
/>
{#if user}
  <SavedPlansModal
    open={historyModalOpen}
    userId={user.uid}
    onopen={(loadedPlan, loadedName, loadedId) => {
      editor.load(loadedPlan, loadedName, loadedId);
      canvasApi.goHome();
    }}
    onclose={() => (historyModalOpen = false)}
  />
{/if}
<GuestNoticeDialog open={guestNoticeOpen} onclose={() => (guestNoticeOpen = false)} />
<Toast />

<style>
  .shell {
    height: 100dvh;
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  header {
    min-height: 54px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: max(6px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 6px max(12px, env(safe-area-inset-left));
    background: #fff;
    border-block-end: 1px solid var(--line);
    flex-shrink: 0;
  }
  .brand {
    font-weight: 800;
    font-size: 17px;
    color: var(--green);
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .plan-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 2px 0;
  }
  .top::-webkit-scrollbar {
    display: none;
  }
  .account {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .account img {
    border-radius: 50%;
    border: 1px solid var(--line);
  }
  .name {
    font-size: 12px;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badge {
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--accent);
    color: var(--green);
    font-size: 11px;
    font-weight: 700;
  }
  .small {
    background: #edf3ee;
    color: var(--ink);
    padding: 7px 11px;
    border-radius: 9px;
    font-size: 13px;
    white-space: nowrap;
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }
  .small.strong {
    background: var(--green);
    color: #fff;
    font-weight: 700;
  }
  .action-btn {
    font-weight: 600;
  }
  .action-btn.guest-locked {
    opacity: 0.85;
  }
  .btn-icon,
  .btn-symbol {
    font-size: 14px;
  }
  .dxf-short {
    display: none;
  }

  .layout {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr 310px;
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
  }
  .panel {
    background: #fff;
    border-inline-start: 1px solid var(--line);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  .section {
    border-block-end: 1px solid #edf1ed;
    padding-block-end: 12px;
  }
  .label {
    font-size: 12px;
    color: var(--muted);
    margin-block-end: 6px;
    font-weight: 600;
  }
  .status {
    padding: 10px 12px;
    background: #f5f8f5;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.5;
  }
  .status b {
    color: var(--green);
  }
  .dpad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-areas:
      '. up .'
      'left down right';
    gap: 7px;
    width: 180px;
    margin: auto;
  }
  .dir {
    height: 48px;
    background: #eef5f0;
    color: #1f5e49;
    border-radius: 12px;
    font-size: 21px;
    font-weight: 700;
    grid-area: var(--area);
  }
  .dir.up {
    --area: up;
  }
  .dir.down {
    --area: down;
  }
  .dir.left {
    --area: left;
  }
  .dir.right {
    --area: right;
  }
  .dir:active,
  .primary:active {
    transform: scale(0.96);
  }
  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .actions button {
    padding: 11px 5px;
    border-radius: 12px;
    background: #f1f7f3;
    font-weight: 700;
    color: #245e49;
    min-height: 44px;
    font-size: 14px;
  }
  .actions .door {
    color: #91522d;
    background: #fff4eb;
  }
  .primary {
    background: var(--green);
    color: #fff;
    border-radius: 12px;
    padding: 12px;
    font-weight: 700;
    min-height: 46px;
    font-size: 14px;
  }
  .outline {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 10px;
    font-weight: 600;
    min-height: 40px;
    font-size: 13px;
  }
  .history {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.7;
    max-height: 120px;
    overflow-y: auto;
  }
  .hint {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.5;
  }

  /* Responsive Rules: Tablets and Phones */
  @media (max-width: 768px) {
    .btn-text,
    .name,
    .plan-title,
    .shortcuts-hint {
      display: none;
    }
    .dxf-short {
      display: inline;
      font-weight: 700;
      font-size: 12px;
    }
    .export-btn {
      padding: 6px 9px;
    }
    .icon-btn,
    .action-btn {
      padding: 6px 9px;
      min-width: 34px;
    }
    .signout-btn,
    .signin-btn {
      padding: 6px 9px;
      font-size: 12px;
    }
    header {
      padding-inline: 8px;
      min-height: 50px;
    }
    .brand-name {
      font-size: 15px;
    }
  }

  /* Mobile Portrait Layout */
  @media (max-width: 768px) and (orientation: portrait) {
    .layout {
      grid-template-columns: 1fr;
      grid-template-rows: 52% 48%;
    }
    .panel {
      border-inline-start: 0;
      border-block-start: 1px solid var(--line);
      padding: 10px 14px max(14px, env(safe-area-inset-bottom));
      gap: 9px;
    }
    .label {
      margin-block-end: 4px;
    }
    .section {
      padding-block-end: 8px;
    }
    .dpad {
      width: 160px;
      gap: 6px;
    }
    .dir {
      height: 44px;
      font-size: 19px;
    }
    .status {
      padding: 8px 10px;
      font-size: 12px;
    }
    .history {
      max-height: 60px;
    }
  }

  /* Mobile Landscape Layout (e.g. phone turned sideways) */
  @media (max-height: 500px) and (orientation: landscape) {
    header {
      min-height: 44px;
      padding-block: 4px;
    }
    .layout {
      grid-template-columns: 1fr 260px;
      grid-template-rows: 1fr;
    }
    .panel {
      padding: 10px 12px;
      gap: 8px;
    }
    .dpad {
      width: 140px;
      gap: 5px;
    }
    .dir {
      height: 38px;
      font-size: 18px;
    }
    .shortcuts-hint {
      display: none;
    }
  }
</style>
