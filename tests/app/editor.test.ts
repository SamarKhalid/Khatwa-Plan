import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { createEditor } from '@/app/editor';
import { move, startPlan } from '@/core/plan';

describe('editor store with plan identity', () => {
  it('starts fresh without planId or planName', () => {
    const editor = createEditor();
    expect(get(editor).planId).toBeNull();
    expect(get(editor).planName).toBeNull();

    editor.start();
    expect(get(editor).planId).toBeNull();
    expect(get(editor).plan.started).toBe(true);
  });

  it('loads an existing plan preserving its id and name', () => {
    const editor = createEditor();
    const existingPlan = move(startPlan(), 'right', 200);

    editor.load(existingPlan, 'Floor 1', 'plan-123');
    const view = get(editor);
    expect(view.planId).toBe('plan-123');
    expect(view.planName).toBe('Floor 1');
    expect(view.plan.x).toBe(200);
  });

  it('updates planId when saved', () => {
    const editor = createEditor();
    editor.start();
    expect(get(editor).planId).toBeNull();

    editor.setPlanId('new-doc-id');
    editor.setName('Office Layout');
    expect(get(editor).planId).toBe('new-doc-id');
    expect(get(editor).planName).toBe('Office Layout');
  });

  it('resets planId and planName when starting a new plan', () => {
    const editor = createEditor();
    editor.load(startPlan(), 'Old Plan', 'old-id');
    expect(get(editor).planId).toBe('old-id');

    editor.start();
    expect(get(editor).planId).toBeNull();
    expect(get(editor).planName).toBeNull();
  });
});

