import { useState } from 'react';

import type { FileTreeIconRenderer } from '@/features/file-tree';

import type { WorkbenchNode } from '@/entities/node';

export interface FileTab {
  node: WorkbenchNode;
  /** The tab has unsaved edits. */
  dirty: boolean;
}

export interface FileTabsProps {
  tabs: FileTab[];
  activeTabId?: string;
  /** Renders a decorative icon, called with `expanded: false`. */
  renderIcon?: FileTreeIconRenderer;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  /** Moves the `fromId` tab to the position of the `toId` tab. */
  onReorder: (fromId: string, toId: string) => void;
}

// Reordering uses native HTML drag and drop, so the bundle carries no drag
// library. The tree's react-dnd backend listens for drag events on `window`
// and would reject or break a drag it did not start, so tab drags use their
// own data type and stop propagating at the tab.
const TAB_DATA_TYPE = 'application/x-workbench-tab';

export const FileTabs = ({
  tabs,
  activeTabId,
  renderIcon,
  onActivate,
  onClose,
  onReorder,
}: FileTabsProps) => {
  const [draggingId, setDraggingId] = useState<string>();
  const [dropTargetId, setDropTargetId] = useState<string>();

  const endDrag = () => {
    setDraggingId(undefined);
    setDropTargetId(undefined);
  };

  return (
    <div role="tablist" aria-label="Open files" data-workbench-tabs>
      {tabs.map(({ node, dirty }) => {
        const isActive = node.id === activeTabId;
        const isDropTarget =
          draggingId !== undefined &&
          node.id !== draggingId &&
          node.id === dropTargetId;
        const icon = renderIcon?.({ node, expanded: false });

        return (
          <div
            key={node.id}
            role="presentation"
            draggable
            data-workbench-tab
            data-active={isActive || undefined}
            data-dirty={dirty || undefined}
            data-dragging={node.id === draggingId || undefined}
            data-drop-target={isDropTarget || undefined}
            onDragStart={event => {
              event.stopPropagation();
              // Firefox starts a drag only when data is set.
              event.dataTransfer.setData(TAB_DATA_TYPE, node.id);
              event.dataTransfer.effectAllowed = 'move';
              setDraggingId(node.id);
            }}
            onDragEnter={event => {
              if (draggingId !== undefined) {
                event.stopPropagation();
              }
            }}
            onDragOver={event => {
              if (draggingId === undefined) {
                return;
              }

              event.stopPropagation();
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setDropTargetId(node.id);
            }}
            onDrop={event => {
              if (draggingId === undefined) {
                return;
              }

              event.stopPropagation();
              event.preventDefault();

              if (draggingId !== node.id) {
                onReorder(draggingId, node.id);
              }

              endDrag();
            }}
            onDragEnd={endDrag}
          >
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              title={node.name}
              data-workbench-tab-label
              onClick={() => onActivate(node.id)}
              // Middle click closes, as in most editors.
              onAuxClick={event => {
                if (event.button === 1) {
                  onClose(node.id);
                }
              }}
            >
              {icon != null && (
                <span aria-hidden="true" data-workbench-tab-icon>
                  {icon}
                </span>
              )}
              <span data-workbench-tab-name>{node.name}</span>
            </button>
            <button
              type="button"
              aria-label={
                dirty ? `Close ${node.name} (unsaved)` : `Close ${node.name}`
              }
              data-workbench-tab-close
              onClick={() => onClose(node.id)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};
