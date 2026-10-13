import { useEffect, useRef, useState } from 'react';

import { Tree, type TreeApi } from 'react-arborist';

import type { WorkbenchNode } from '@/entities/node';

import { injectChildren } from '@/shared/lib';

import { FileTreeNode, FileTreeRow } from './file-tree-row';

export interface FileTreeProps {
  /** Root nodes. Replacing this array resets locally loaded children. */
  nodes: WorkbenchNode[];
  /** File selected by the consumer; selecting it also scrolls it into view. */
  selectedId?: string;
  /** Marks the tree as busy and blocks file activation and lazy requests. */
  loading?: boolean;
  /** Called on file activation, never for directories. */
  onSelect?: (node: WorkbenchNode) => void;
  /**
   * Load an unloaded directory once. Return children for local merging, or
   * return void and update `nodes` in the consumer. An empty array is loaded.
   */
  onExpand?: (node: WorkbenchNode) => Promise<WorkbenchNode[] | void>;
  /** Receives load errors. Without a handler, an alert is shown in the tree. */
  onError?: (error: Error, node: WorkbenchNode) => void;
}

export const FileTree = ({
  nodes,
  selectedId,
  loading = false,
  onSelect,
  onExpand,
  onError,
}: FileTreeProps) => {
  const containerRef = useRef<HTMLElement>(null);
  const treeRef = useRef<TreeApi<WorkbenchNode>>(null);
  const requestsRef = useRef(new Set<string>());
  const generationRef = useRef(0);
  const [height, setHeight] = useState(0);
  const [snapshot, setSnapshot] = useState<{
    source: WorkbenchNode[];
    nodes: WorkbenchNode[];
    error?: Error;
  }>({ source: nodes, nodes });

  if (snapshot.source !== nodes) {
    setSnapshot({ source: nodes, nodes });
  }

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const observer = new ResizeObserver(entries => {
      setHeight(Math.max(0, entries[0]?.contentRect.height ?? 0));
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const requests = requestsRef.current;

    return () => {
      generationRef.current += 1;
      requests.clear();
    };
  }, [nodes]);

  const loadChildren = async (id: string) => {
    const node = treeRef.current?.get(id);

    if (
      loading ||
      !onExpand ||
      !node?.isOpen ||
      node.data.kind !== 'directory' ||
      node.data.children !== undefined ||
      requestsRef.current.has(id)
    ) {
      return;
    }

    const generation = generationRef.current;
    const directory = node.data;

    requestsRef.current.add(id);
    setSnapshot(current => ({ ...current, error: undefined }));

    try {
      const children = await onExpand(directory);

      if (generation !== generationRef.current) {
        return;
      }

      if (children) {
        setSnapshot(current =>
          current.source === nodes
            ? {
                ...current,
                nodes: injectChildren(current.nodes, id, children),
              }
            : current,
        );
      }
    } catch (reason) {
      if (generation !== generationRef.current) {
        return;
      }

      requestsRef.current.delete(id);

      const error =
        reason instanceof Error ? reason : new Error(String(reason));

      if (onError) {
        onError(error, directory);
      } else {
        setSnapshot(current =>
          current.source === nodes ? { ...current, error } : current,
        );
      }
    }
  };

  return (
    <nav
      ref={containerRef}
      aria-label="File tree"
      aria-busy={loading}
      data-workbench-tree
      data-loading={loading || undefined}
      style={{ height: '100%', minHeight: 0, width: '100%' }}
    >
      {height > 0 && (
        <Tree<WorkbenchNode>
          ref={treeRef}
          data={snapshot.nodes}
          idAccessor="id"
          childrenAccessor={node =>
            node.kind === 'directory' ? (node.children ?? []) : null
          }
          height={height}
          width="100%"
          rowHeight={22}
          indent={16}
          openByDefault={false}
          disableDrag
          disableDrop
          disableEdit
          disableMultiSelection
          disableSelect={loading}
          selection={selectedId}
          renderRow={FileTreeRow}
          onToggle={id => void loadChildren(id)}
          onActivate={node => {
            if (!loading && node.data.kind === 'file') {
              onSelect?.(node.data);
            }
          }}
        >
          {FileTreeNode}
        </Tree>
      )}
      {snapshot.error && (
        <div role="alert" data-workbench-tree-error>
          {snapshot.error.message}
        </div>
      )}
    </nav>
  );
};
