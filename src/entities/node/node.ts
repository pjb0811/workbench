export type NodeKind = 'file' | 'directory';

export interface WorkbenchNode {
  id: string;
  name: string;
  kind: NodeKind;
  /**
   * Child nodes of a directory.
   *
   * The distinction below is the basis for lazy loading and must be preserved:
   * - `undefined` — not loaded yet (a directory whose children are unknown).
   * - `[]` — loaded, but the directory is empty.
   */
  children?: WorkbenchNode[];
}
