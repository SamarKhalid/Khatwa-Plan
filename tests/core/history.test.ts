import { describe, expect, it } from 'vitest';
import { canRedo, canUndo, commit, createHistory, redo, undo } from '@/core/history';

describe('history', () => {
  it('commits, undoes and redoes', () => {
    let h = createHistory(0);
    h = commit(h, 1);
    h = commit(h, 2);
    expect(h.present).toBe(2);
    h = undo(h);
    expect(h.present).toBe(1);
    expect(canRedo(h)).toBe(true);
    h = redo(h);
    expect(h.present).toBe(2);
    expect(canRedo(h)).toBe(false);
  });

  it('is a no-op (same instance) when there is nothing to undo/redo', () => {
    const h = createHistory('a');
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
    expect(canUndo(h)).toBe(false);
  });

  it('ignores commits of an identical value', () => {
    const value = { a: 1 };
    const h = createHistory(value);
    expect(commit(h, value)).toBe(h);
  });

  it('clears the redo branch on a new commit', () => {
    let h = commit(commit(createHistory(0), 1), 2);
    h = undo(h);
    h = commit(h, 9);
    expect(h.future).toEqual([]);
    expect(h.present).toBe(9);
  });

  it('caps the undo depth', () => {
    let h = createHistory(0);
    for (let i = 1; i <= 10; i++) h = commit(h, i, 3);
    expect(h.past).toEqual([7, 8, 9]);
  });
});

