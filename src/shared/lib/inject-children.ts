import type { WorkbenchNode } from '@/entities/node';

/**
 * Immutably attach lazily-loaded `children` to the node with `targetId`.
 *
 * Returns a new tree with fresh objects only along the path to the target;
 * untouched branches keep their original references, so React can skip them.
 * The target's previous `children` are replaced — pass `[]` for a directory
 * that loaded empty (vs. `undefined`, meaning "not loaded", elsewhere).
 */
export const injectChildren = (
  nodes: WorkbenchNode[],
  targetId: string,
  children: WorkbenchNode[],
): WorkbenchNode[] =>
  nodes.map(node => {
    if (node.id === targetId) {
      return { ...node, children };
    }

    if (node.children) {
      return {
        ...node,
        children: injectChildren(node.children, targetId, children),
      };
    }

    return node;
  });
