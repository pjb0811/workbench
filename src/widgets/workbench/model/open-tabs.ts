import type { WorkbenchNode } from '@/entities/node';

export interface OpenTab {
  node: WorkbenchNode;
  content: string;
  /** Content as last read or saved; the tab is dirty while they differ. */
  savedContent: string;
}

export const isDirty = (tab: OpenTab) => tab.content !== tab.savedContent;

/**
 * Removes a tab. Closing the active tab activates its right neighbor, or the
 * left one when it was last.
 */
export function closeTab(
  tabs: OpenTab[],
  activeTabId: string | undefined,
  id: string,
): { tabs: OpenTab[]; activeTabId: string | undefined } {
  const index = tabs.findIndex(tab => tab.node.id === id);

  if (index === -1) {
    return { tabs, activeTabId };
  }

  const remaining = tabs.filter(tab => tab.node.id !== id);

  if (id !== activeTabId) {
    return { tabs: remaining, activeTabId };
  }

  const next = remaining[index] ?? remaining[index - 1];

  return { tabs: remaining, activeTabId: next?.node.id };
}

/** Moves the `fromId` tab to the position of the `toId` tab. */
export function moveTab(
  tabs: OpenTab[],
  fromId: string,
  toId: string,
): OpenTab[] {
  const from = tabs.findIndex(tab => tab.node.id === fromId);
  const to = tabs.findIndex(tab => tab.node.id === toId);

  if (from === -1 || to === -1 || from === to) {
    return tabs;
  }

  const next = [...tabs];
  const [moved] = next.splice(from, 1);

  next.splice(to, 0, moved);

  return next;
}
