import { openingShape } from '../geometry';
import { fmt, type Plan, type Point } from '../plan';

/** DXF number: plain decimal, no exponent notation, trimmed. */
const n = (value: number): string => Number(value.toFixed(6)).toString();
const norm360 = (deg: number): number => ((deg % 360) + 360) % 360;

/** Wall thickness used to draw door/window frames, in cm. */
const OPENING_THICKNESS_CM = 20;

/**
 * ASCII DXF (units: centimetres) with layers WALL, DOOR and WINDOW.
 * Door swings are exported as ARC entities; each opening gets a TEXT label.
 */
export function toDxf(plan: Pick<Plan, 'segments' | 'openings'>): string {
  const rows: string[] = ['0', 'SECTION', '2', 'HEADER', '9', '$INSUNITS', '70', '5', '0', 'ENDSEC'];
  rows.push('0', 'SECTION', '2', 'ENTITIES');

  const line = (layer: string, a: Point, b: Point) =>
    rows.push('0', 'LINE', '8', layer, '10', n(a.x), '20', n(a.y), '30', '0', '11', n(b.x), '21', n(b.y), '31', '0');

  for (const s of plan.segments) line('WALL', { x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 });

  for (const o of plan.openings) {
    const layer = o.type === 'door' ? 'DOOR' : 'WINDOW';
    const shape = openingShape(o, OPENING_THICKNESS_CM);

    shape.rect.forEach((p, i) => line(layer, p, shape.rect[(i + 1) % 4]!));
    if (shape.leaf) line(layer, shape.leaf[0], shape.leaf[1]);
    if (shape.arc) {
      rows.push(
        '0', 'ARC', '8', layer,
        '10', n(shape.hinge.x), '20', n(shape.hinge.y), '30', '0',
        '40', n(shape.w),
        '50', n(norm360(shape.angleDeg)), '51', n(norm360(shape.angleDeg + 90)),
      );
    }
    shape.glass?.forEach(([a, b]) => line(layer, a, b));

    rows.push(
      '0', 'TEXT', '8', layer,
      '10', n((o.x1 + o.x2) / 2), '20', n((o.y1 + o.y2) / 2), '30', '0',
      '40', '10',
      '1', `${o.type === 'door' ? 'D' : 'W'} ${fmt(o.width)} cm`,
    );
  }

  rows.push('0', 'ENDSEC', '0', 'EOF');
  return rows.join('\r\n') + '\r\n';
}

