import { openingShape } from '@/core/geometry';
import { fmt, type Plan, type Point } from '@/core/plan';
import { gridStepCm, toScreen, type Viewport } from './viewport';

export interface RenderLabels {
  door: string;
  window: string;
}

const COLORS = {
  paper: '#fbfcf9',
  gridMinor: '#e8eee8',
  gridMajor: '#d3ddd4',
  axis: '#b9c9bd',
  wall: '#233d31',
  pen: '#176b50',
  door: { stroke: '#d07a42', fill: '#fff4eb', text: '#a45b2e' },
  window: { stroke: '#347fb0', fill: '#eaf4fb', text: '#28658f' },
} as const;

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, vp: Viewport): void {
  const step = gridStepCm(vp.scale);
  const px = step * vp.scale;
  const strokeLines = (color: string, every: number) => {
    ctx.strokeStyle = color;
    ctx.beginPath();
    const startI = Math.floor(-vp.ox / px);
    for (let i = startI; vp.ox + i * px <= w; i++) {
      if (i % every !== 0) continue;
      const x = Math.round(vp.ox + i * px) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    const startJ = Math.floor((vp.oy - h) / px);
    for (let j = startJ; vp.oy - j * px >= 0; j++) {
      if (j % every !== 0) continue;
      const y = Math.round(vp.oy - j * px) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  };

  ctx.lineWidth = 1;
  // Minor lines every `step`, major lines every 5 steps.
  strokeLines(COLORS.gridMinor, 1);
  strokeLines(COLORS.gridMajor, 5);

  // Axes through the origin.
  ctx.strokeStyle = COLORS.axis;
  ctx.beginPath();
  ctx.moveTo(0, Math.round(vp.oy) + 0.5);
  ctx.lineTo(w, Math.round(vp.oy) + 0.5);
  ctx.moveTo(Math.round(vp.ox) + 0.5, 0);
  ctx.lineTo(Math.round(vp.ox) + 0.5, h);
  ctx.stroke();
}

function tracePath(ctx: CanvasRenderingContext2D, vp: Viewport, pts: readonly Point[]): void {
  ctx.beginPath();
  pts.forEach((p, i) => {
    const q = toScreen(vp, p.x, p.y);
    if (i) ctx.lineTo(q.x, q.y);
    else ctx.moveTo(q.x, q.y);
  });
}

/** Draws the whole scene. `w`/`h` are CSS pixels (the context is already DPR-scaled). */
export function renderPlan(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  vp: Viewport,
  plan: Plan,
  labels: RenderLabels,
): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h, vp);

  ctx.lineCap = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.wall;
  for (const s of plan.segments) {
    const a = toScreen(vp, s.x1, s.y1);
    const b = toScreen(vp, s.x2, s.y2);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  for (const o of plan.openings) {
    const palette = o.type === 'door' ? COLORS.door : COLORS.window;
    // Keep frames visible when zoomed out: at least 20 cm or 7 px.
    const thickness = Math.max(20, 7 / vp.scale);
    const shape = openingShape(o, thickness);

    ctx.lineWidth = 2;
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = palette.stroke;
    ctx.fillStyle = palette.fill;
    tracePath(ctx, vp, shape.rect);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 1.5;
    if (shape.leaf && shape.arc) {
      tracePath(ctx, vp, shape.leaf);
      ctx.stroke();
      ctx.setLineDash([4, 3]);
      tracePath(ctx, vp, shape.arc);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const g of shape.glass ?? []) {
      tracePath(ctx, vp, g);
      ctx.stroke();
    }

    const a = toScreen(vp, o.x1, o.y1);
    const b = toScreen(vp, o.x2, o.y2);
    ctx.fillStyle = palette.text;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${o.type === 'door' ? labels.door : labels.window} ${fmt(o.width)}`,
      (a.x + b.x) / 2,
      (a.y + b.y) / 2 - (thickness * vp.scale) / 2 - 6,
    );
  }

  if (plan.started) {
    const p = toScreen(vp, plan.x, plan.y);
    ctx.fillStyle = COLORS.pen;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

