import { derived, get, writable, type Readable } from 'svelte/store';
import {
  canRedo,
  canUndo,
  commit,
  createHistory,
  redo as redoHistory,
  undo as undoHistory,
  type History,
} from '@/core/history';
import {
  addOpening,
  createPlan,
  move,
  startPlan,
  type Direction,
  type OpeningType,
  type Plan,
} from '@/core/plan';

export interface EditorView {
  plan: Plan;
  planId: string | null;
  planName: string | null;
  canUndo: boolean;
  canRedo: boolean;
}

export interface Editor extends Readable<EditorView> {
  /** Starts a brand-new drawing at (0,0) and clears the undo history and ID. */
  start(): void;
  /** Loads an existing plan (e.g. from saved history) with its ID and title. */
  load(plan: Plan, name?: string | null, id?: string | null): void;
  /** Sets or renames the current plan title. */
  setName(name: string | null): void;
  /** Sets the saved plan document ID. */
  setPlanId(id: string | null): void;
  /** Each returns false when it was a no-op (not started / invalid amount / nothing to do). */
  move(dir: Direction, length: number): boolean;
  addOpening(type: OpeningType, width: number): boolean;
  undo(): boolean;
  redo(): boolean;
}

export function createEditor(
  initial: Plan = createPlan(),
  initialName: string | null = null,
  initialId: string | null = null,
): Editor {
  const store = writable<History<Plan>>(createHistory(initial));
  const planName = writable<string | null>(initialName);
  const planId = writable<string | null>(initialId);

  const view = derived(
    [store, planName, planId],
    ([h, name, id]): EditorView => ({
      plan: h.present,
      planName: name,
      planId: id,
      canUndo: canUndo(h),
      canRedo: canRedo(h),
    }),
  );

  /** Applies a plan transformation as one undoable step. */
  function apply(transform: (plan: Plan) => Plan): boolean {
    const before = get(store);
    const after = commit(before, transform(before.present));
    if (after === before) return false;
    store.set(after);
    return true;
  }

  function step(transition: (h: History<Plan>) => History<Plan>): boolean {
    const before = get(store);
    const after = transition(before);
    if (after === before) return false;
    store.set(after);
    return true;
  }

  return {
    subscribe: view.subscribe,
    start: () => {
      store.set(createHistory(startPlan()));
      planName.set(null);
      planId.set(null);
    },
    load: (plan: Plan, name: string | null = null, id: string | null = null) => {
      store.set(createHistory(plan));
      planName.set(name);
      planId.set(id);
    },
    setName: (name: string | null) => planName.set(name),
    setPlanId: (id: string | null) => planId.set(id),
    move: (dir, length) => apply((p) => move(p, dir, length)),
    addOpening: (type, width) => apply((p) => addOpening(p, type, width)),
    undo: () => step(undoHistory),
    redo: () => step(redoHistory),
  };
}
