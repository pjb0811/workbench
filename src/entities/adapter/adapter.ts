import type { WorkbenchNode } from '@/entities/node';

/**
 * The library's data-source contract. Everything above talks to a repository —
 * local filesystem, REST API, GitLab, … — only through these four methods, so
 * the UI never knows where the tree comes from.
 *
 * Loading is lazy by design: `getTree` and `loadChildren` return a single level
 * at a time, keeping the first-render cost constant even for large trees.
 */
export interface WorkbenchAdapter {
  /** Root-level nodes, one level deep. Descendants are not included. */
  getTree(): Promise<WorkbenchNode[]>;
  /** The immediate children of a directory node. */
  loadChildren(node: WorkbenchNode): Promise<WorkbenchNode[]>;
  /** Read a file's contents. Never called on a directory node. */
  readFile(node: WorkbenchNode): Promise<string>;
  /** Persist a file. Rejects when the adapter is read-only. */
  writeFile(node: WorkbenchNode, content: string): Promise<void>;
}
