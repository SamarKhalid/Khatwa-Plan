import type { Opening, Point } from './plan';

export interface OpeningShape {
  /** Opening length along the wall. */
  w: number;
  hinge: Point;
  /** Direction of the opening in degrees (CAD convention, counter-clockwise from +X). */
  angleDeg: number;
  /** Closed rectangle outline (4 corners). */
  rect: Point[];
  /** Door only: leaf line and the swing arc as a polyline. */
  leaf?: [Point, Point];
  arc?: Point[];
  /** Window only: two glass lines. */
  glass?: [Point, Point][];
}

/**
 * Geometry of a door/window of wall thickness `t`, built along its own axis
 * (u = along the opening, n = perpendicular). Shared by the renderer and the DXF exporter.
 */
export function openingShape(o: Opening, t: number): OpeningShape {
  const dx = o.x2 - o.x1;
  const dy = o.y2 - o.y1;
  const w = Math.hypot(dx, dy) || 1;
  const ux = dx / w;
  const uy = dy / w;
  const nx = -uy;
  const ny = ux;
  const h = t / 2;
  const P = (a: number, b: number): Point => ({
    x: o.x1 + ux * a + nx * b,
    y: o.y1 + uy * a + ny * b,
  });

  const shape: OpeningShape = {
    w,
    hinge: { x: o.x1, y: o.y1 },
    angleDeg: (Math.atan2(uy, ux) * 180) / Math.PI,
    rect: [P(0, -h), P(w, -h), P(w, h), P(0, h)],
  };

  if (o.type === 'door') {
    shape.leaf = [P(0, 0), P(0, w)];
    const steps = 16;
    shape.arc = Array.from({ length: steps + 1 }, (_, i) => {
      const q = ((Math.PI / 2) * i) / steps;
      return P(Math.cos(q) * w, Math.sin(q) * w);
    });
  } else {
    shape.glass = [
      [P(0, -h / 3), P(w, -h / 3)],
      [P(0, h / 3), P(w, h / 3)],
    ];
  }
  return shape;
}

