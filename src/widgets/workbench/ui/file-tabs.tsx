import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface SortableTabProps extends Omit<FileTabsProps, 'tabs' | 'onReorder'> {
  tab: FileTab;
}

const SortableTab = ({
  tab,
  activeTabId,
  renderIcon,
  onActivate,
  onClose,
}: SortableTabProps) => {
  const { node, dirty } = tab;
  // dnd-kit's own `attributes` (role="button", tabIndex) are left off: the
  // tab button inside carries the tab semantics and the focus.
  const { setNodeRef, listeners, transform, transition, isDragging } =
    useSortable({ id: node.id });
  const isActive = node.id === activeTabId;
  const icon = renderIcon?.({ node, expanded: false });

  return (
    <div
      ref={setNodeRef}
      role="presentation"
      data-workbench-tab
      data-active={isActive || undefined}
      data-dirty={dirty || undefined}
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...listeners}
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
};

export const FileTabs = ({ tabs, onReorder, ...tabProps }: FileTabsProps) => {
  // The distance keeps a click on a tab or its close button from starting a
  // drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tabs.map(tab => tab.node.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div role="tablist" aria-label="Open files" data-workbench-tabs>
          {tabs.map(tab => (
            <SortableTab key={tab.node.id} tab={tab} {...tabProps} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
