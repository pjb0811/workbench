import type { NodeRendererProps, RowRendererProps } from 'react-arborist';

import type { WorkbenchNode } from '@/entities/node';

export const FileTreeRow = ({
  node,
  innerRef,
  attrs,
  children,
}: RowRendererProps<WorkbenchNode>) => (
  <div
    {...attrs}
    ref={innerRef}
    aria-expanded={node.isInternal ? node.isOpen : undefined}
    data-workbench-node
    data-kind={node.data.kind}
    data-selected={node.isSelected || undefined}
    data-expanded={node.isOpen || undefined}
    onFocus={event => event.stopPropagation()}
    onClick={event => {
      if (node.data.kind === 'directory') {
        node.select();
        node.toggle();
      } else {
        node.handleClick(event);
      }
    }}
  >
    {children}
  </div>
);

export const FileTreeNode = ({
  node,
  style,
}: NodeRendererProps<WorkbenchNode>) => (
  <div style={style}>
    <span data-workbench-node-name>{node.data.name}</span>
  </div>
);
