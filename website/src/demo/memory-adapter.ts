import type { WorkbenchAdapter, WorkbenchNode } from '@jbpark/workbench';

export interface MemoryAdapterOptions {
  /** Milliseconds every call waits, to make loading states visible. */
  latency?: number;
  /** Makes writeFile reject, to show the error state. */
  failWrites?: () => boolean;
  /** Called after a successful write. */
  onWrite?: (path: string, content: string) => void;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * A WorkbenchAdapter over a path → content map. Directories come from the
 * paths, and each level is returned without children so the tree loads it
 * lazily, like a remote source would.
 */
export function createMemoryAdapter(
  initialFiles: Record<string, string>,
  { latency = 120, failWrites, onWrite }: MemoryAdapterOptions = {},
): WorkbenchAdapter {
  const files = { ...initialFiles };

  const childrenOf = (parent: string): WorkbenchNode[] => {
    const prefix = parent ? `${parent}/` : '';
    const kinds = new Map<string, WorkbenchNode['kind']>();

    for (const path of Object.keys(files)) {
      if (!path.startsWith(prefix)) {
        continue;
      }

      const [name, ...rest] = path.slice(prefix.length).split('/');

      kinds.set(name, rest.length > 0 ? 'directory' : 'file');
    }

    return [...kinds]
      .map(([name, kind]) => ({ id: `${prefix}${name}`, name, kind }))
      .sort((a, b) =>
        a.kind === b.kind
          ? a.name.localeCompare(b.name)
          : a.kind === 'directory'
            ? -1
            : 1,
      );
  };

  return {
    getTree: async () => {
      await wait(latency);

      return childrenOf('');
    },
    loadChildren: async node => {
      await wait(latency);

      return childrenOf(node.id);
    },
    readFile: async node => {
      await wait(latency);

      return files[node.id] ?? '';
    },
    writeFile: async (node, content) => {
      await wait(latency);

      if (failWrites?.()) {
        throw new Error(`Could not save ${node.name}: the disk is full.`);
      }

      files[node.id] = content;
      onWrite?.(node.id, content);
    },
  };
}
