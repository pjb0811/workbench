import type { WorkbenchAdapter } from '@/entities/adapter';
import type { WorkbenchNode } from '@/entities/node';

type FsHandle = FileSystemFileHandle | FileSystemDirectoryHandle;

/**
 * Explorer ordering: directories first, then by name ascending (locale-aware),
 * so the tree reads like a native file browser.
 */
const byExplorerOrder = (a: WorkbenchNode, b: WorkbenchNode): number => {
  if (a.kind !== b.kind) {
    return a.kind === 'directory' ? -1 : 1;
  }

  return a.name.localeCompare(b.name);
};

/**
 * Expose a local folder (picked via the File System Access API) as a
 * `WorkbenchAdapter`. Server-less — runs entirely in a Chromium-based browser.
 *
 * The caller owns the permission flow: it runs `showDirectoryPicker()` and
 * hands the resulting handle in, so this library never touches permission UI.
 *
 * @param dirHandle - a directory handle the user has already granted access to.
 */
export const createFsAdapter = (
  dirHandle: FileSystemDirectoryHandle,
): WorkbenchAdapter => {
  // `WorkbenchNode` must stay a plain, serialisable object, so it can't carry a
  // `FileSystemHandle`. We keep handles here and look them back up by node id.
  // Ids are path-like (`${parentId}/${name}`), starting from the root folder's
  // own name.
  const handles = new Map<string, FsHandle>();
  const rootId = dirHandle.name;
  handles.set(rootId, dirHandle);

  // Read one directory level into nodes, registering each child handle by id as
  // we go. Lazy by design — descendants aren't touched until expanded.
  const readDir = async (
    dir: FileSystemDirectoryHandle,
    parentId: string,
  ): Promise<WorkbenchNode[]> => {
    const nodes: WorkbenchNode[] = [];

    for await (const [name, handle] of dir.entries()) {
      const id = `${parentId}/${name}`;
      handles.set(id, handle);
      nodes.push({ id, name, kind: handle.kind });
    }

    return nodes.sort(byExplorerOrder);
  };

  const fileHandleFor = (node: WorkbenchNode): FileSystemFileHandle => {
    const handle = handles.get(node.id);

    if (!handle) {
      throw new Error(`workbench: no handle registered for node "${node.id}".`);
    }
    if (handle.kind !== 'file') {
      throw new Error(
        `workbench: node "${node.id}" is a directory, not a file.`,
      );
    }

    return handle;
  };

  const dirHandleFor = (node: WorkbenchNode): FileSystemDirectoryHandle => {
    const handle = handles.get(node.id);

    if (!handle) {
      throw new Error(`workbench: no handle registered for node "${node.id}".`);
    }
    if (handle.kind !== 'directory') {
      throw new Error(
        `workbench: node "${node.id}" is a file, not a directory.`,
      );
    }

    return handle;
  };

  return {
    getTree: () => readDir(dirHandle, rootId),
    loadChildren: node => readDir(dirHandleFor(node), node.id),
    readFile: async node => {
      const file = await fileHandleFor(node).getFile();
      return file.text();
    },
    writeFile: async (node, content) => {
      const writable = await fileHandleFor(node).createWritable();
      await writable.write(content);
      await writable.close();
    },
  };
};
