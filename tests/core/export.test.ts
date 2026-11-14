import { describe, expect, it } from 'vitest';
import { toDxf } from '@/core/export/dxf';
import { toJson } from '@/core/export/json';
import { addOpening, move, startPlan } from '@/core/plan';

/** Parses the flat group-code/value list into entities. */
function entities(dxf: string): { type: string; codes: [string, string][] }[] {
  const lines = dxf.split('\r\n');
  const out: { type: string; codes: [string, string][] }[] = [];
  let inEntities = false;
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = lines[i]!;
    const value = lines[i + 1]!;
    if (code === '2' && value === 'ENTITIES') inEntities = true;
    else if (code === '0' && value === 'ENDSEC') inEntities = false;
    else if (inEntities && code === '0') out.push({ type: value, codes: [] });
    else if (inEntities) out.at(-1)?.codes.push([code, value]);
  }
  return out;
}

const get = (e: { codes: [string, string][] }, code: string) => e.codes.find(([c]) => c === code)?.[1];

describe('DXF export', () => {
  const plan = addOpening(move(move(startPlan(), 'right', 300), 'up', 200.25), 'door', 90);
  const dxf = toDxf(plan);
  const ents = entities(dxf);

  it('declares centimetre units and ends with EOF', () => {
    expect(dxf).toContain('$INSUNITS\r\n70\r\n5');
    expect(dxf.trimEnd().endsWith('EOF')).toBe(true);
    expect(dxf).toContain('\r\n');
  });

  it('exports each wall as a LINE on layer WALL', () => {
    const walls = ents.filter((e) => e.type === 'LINE' && get(e, '8') === 'WALL');
    expect(walls).toHaveLength(2);
    expect(get(walls[1]!, '11')).toBe('300');
    expect(get(walls[1]!, '21')).toBe('200.25');
  });

  it('exports a door as frame lines, a leaf, a swing ARC and a label on layer DOOR', () => {
    const door = ents.filter((e) => get(e, '8') === 'DOOR');
    expect(door.filter((e) => e.type === 'LINE')).toHaveLength(5); // 4 frame + leaf
    const arc = door.find((e) => e.type === 'ARC')!;
    expect(get(arc, '40')).toBe('90');
    expect(get(arc, '50')).toBe('90'); // opening runs up (+Y) = 90°
    expect(get(arc, '51')).toBe('180');
    expect(get(door.find((e) => e.type === 'TEXT')!, '1')).toBe('D 90 cm');
  });

  it('uses the WINDOW layer for windows', () => {
    const w = entities(toDxf(addOpening(startPlan(), 'window', 120)));
    expect(w.filter((e) => get(e, '8') === 'WINDOW' && e.type === 'LINE')).toHaveLength(6); // 4 frame + 2 glass
    expect(w.some((e) => e.type === 'ARC')).toBe(false);
  });

  it('never emits exponent notation', () => {
    expect(toDxf(move(startPlan(), 'right', 1e-9))).not.toMatch(/e[-+]\d/i);
  });
});

describe('JSON export', () => {
  it('is versioned and lossless', () => {
    const plan = addOpening(move(startPlan(), 'right', 100.5), 'window', 80);
    const data = JSON.parse(toJson(plan));
    expect(data).toMatchObject({ format: 'khatwa-plan', version: 1, units: 'cm' });
    expect(data.segments).toEqual(plan.segments);
    expect(data.openings).toEqual(plan.openings);
  });
});

