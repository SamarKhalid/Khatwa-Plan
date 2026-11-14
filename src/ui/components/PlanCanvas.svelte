<script lang="ts">
  import type { Plan } from '@/core/plan';
  import { t } from '@/i18n';
  import { renderPlan } from '@/render/renderer';
  import {
    centered,
    gridStepCm,
    pan,
    zoomAt,
    type Viewport,
    DEFAULT_SCALE,
  } from '@/render/viewport';
  import { toast } from '@/ui/toast';

  let { plan }: { plan: Plan } = $props();

  let canvas: HTMLCanvasElement;
  let size = $state({ w: 0, h: 0 });
  let vp = $state<Viewport>({ ox: 0, oy: 0, scale: DEFAULT_SCALE });
  let sized = false;

  const gridCm = $derived(gridStepCm(vp.scale));

  // Resize: keep the backing store sharp on high-DPI screens.
  $effect(() => {
    const observer = new ResizeObserver(() => {
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      if (!sized && r.width > 0) {
        sized = true;
        vp = centered(r.width, r.height, vp.scale);
      }
      size = { w: r.width, h: r.height };
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  });

  // Redraw whenever the plan, viewport, size or language changes.
  $effect(() => {
    if (size.w === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderPlan(ctx, size.w, size.h, vp, plan, { door: $t('editor.door'), window: $t('editor.window') });
  });

  // Wheel zoom needs a non-passive listener to call preventDefault.
  $effect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      vp = zoomAt(vp, e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  });

  // Pointer gestures: one pointer pans, two pointers pinch-zoom.
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch: { dist: number } | null = null;

  const distance = () => {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  function onPointerDown(e: PointerEvent) {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pinch = pointers.size === 2 ? { dist: distance() } : null;
  }

  function onPointerMove(e: PointerEvent) {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, next);

    if (pointers.size === 1) {
      vp = pan(vp, next.x - prev.x, next.y - prev.y);
    } else if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()];
      const d = distance();
      if (a && b && pinch.dist > 0 && d > 0) {
        const rect = canvas.getBoundingClientRect();
        vp = zoomAt(vp, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top, d / pinch.dist);
        pinch = { dist: d };
      }
    }
  }

  function onPointerEnd(e: PointerEvent) {
    pointers.delete(e.pointerId);
    pinch = pointers.size === 2 ? { dist: distance() } : null;
  }

  export function goHome() {
    vp = centered(size.w, size.h, vp.scale);
    toast.show('editor.toast.homed');
  }
</script>

<div class="drawing">
  <canvas
    bind:this={canvas}
    aria-label={$t('editor.canvas.label')}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerEnd}
    onpointercancel={onPointerEnd}
  ></canvas>
  <button type="button" class="home" onclick={goHome}>⌖ {$t('editor.home')}</button>
  <div class="scale">{$t('editor.grid', { n: gridCm })}</div>
</div>

<style>
  .drawing {
    position: relative;
    overflow: hidden;
    background: var(--paper);
    min-height: 0;
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none;
    cursor: grab;
  }
  canvas:active {
    cursor: grabbing;
  }
  .home {
    position: absolute;
    inset-block-start: 12px;
    inset-inline-start: 14px;
    background: #ffffffe6;
    color: var(--green);
    border: 1px solid var(--line);
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 2px 8px #15251d1a;
  }
  .home:active {
    transform: scale(0.97);
  }
  .scale {
    position: absolute;
    inset-block-end: 12px;
    inset-inline-end: 14px;
    color: var(--muted);
    font-size: 12px;
    background: #ffffffd9;
    padding: 6px 9px;
    border-radius: 8px;
  }
  @media (max-width: 640px) {
    .home {
      font-size: 11px;
      padding: 6px 9px;
      inset-block-start: 8px;
      inset-inline-start: 8px;
      min-height: 32px;
    }
    .scale {
      font-size: 11px;
      padding: 4px 7px;
      inset-block-end: 8px;
      inset-inline-end: 8px;
    }
  }
</style>
