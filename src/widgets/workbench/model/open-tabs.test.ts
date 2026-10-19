import { describe, expect, it } from 'vitest';

import { type OpenTab, closeTab, isDirty, moveTab } from './open-tabs';

const tab = (id: string, content = '', savedContent = content): OpenTab => ({
  node: { id, name: id, kind: 'file' },
  content,
  savedContent,
});

const ids = (tabs: OpenTab[]) => tabs.map(item => item.node.id);

const tabs = [tab('a'), tab('b'), tab('c')];

describe('isDirty', () => {
  it('compares the content with the saved content', () => {
    expect(isDirty(tab('a', 'x', 'x'))).toBe(false);
    expect(isDirty(tab('a', 'xy', 'x'))).toBe(true);
  });
});

describe('closeTab', () => {
  it('activates the right neighbor of the closed active tab', () => {
    const result = closeTab(tabs, 'b', 'b');

    expect(ids(result.tabs)).toEqual(['a', 'c']);
    expect(result.activeTabId).toBe('c');
  });

  it('activates the left neighbor when the closed active tab was last', () => {
    expect(closeTab(tabs, 'c', 'c').activeTabId).toBe('b');
  });

  it('keeps the active tab when another tab closes', () => {
    const result = closeTab(tabs, 'a', 'c');

    expect(ids(result.tabs)).toEqual(['a', 'b']);
    expect(result.activeTabId).toBe('a');
  });

  it('leaves no active tab after the last one closes', () => {
    expect(closeTab([tab('a')], 'a', 'a')).toEqual({
      tabs: [],
      activeTabId: undefined,
    });
  });

  it('ignores an unknown id', () => {
    const result = closeTab(tabs, 'a', 'missing');

    expect(result.tabs).toBe(tabs);
    expect(result.activeTabId).toBe('a');
  });
});

describe('moveTab', () => {
  it('moves a tab right or left to the target position', () => {
    expect(ids(moveTab(tabs, 'a', 'c'))).toEqual(['b', 'c', 'a']);
    expect(ids(moveTab(tabs, 'c', 'a'))).toEqual(['c', 'a', 'b']);
  });

  it('returns the same array for a no-op or an unknown id', () => {
    expect(moveTab(tabs, 'a', 'a')).toBe(tabs);
    expect(moveTab(tabs, 'a', 'missing')).toBe(tabs);
  });
});
