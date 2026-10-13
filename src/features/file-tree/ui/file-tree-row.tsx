import { useContext } from 'react';

import type { NodeRendererProps, RowRendererProps } from 'react-arborist';

import type { WorkbenchNode } from '@/entities/node';

import { FileTreeIconContext } from '../model/icon-renderer';

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
}: NodeRendererProps<WorkbenchNode>) => {
  const renderIcon = useContext(FileTreeIconContext);
  const isDirectory = node.data.kind === 'directory';
  const isExpanded = isDirectory && node.isOpen;
  const icon = renderIcon?.({ node: node.data, expanded: isExpanded });

  return (
    <div style={style}>
      {isDirectory && (
        <span
          aria-hidden="true"
          data-workbench-node-arrow
          data-open={isExpanded || undefined}
        >
          {isExpanded ? '⌄' : '›'}
        </span>
      )}
      {icon != null && (
        <span aria-hidden="true" data-workbench-node-icon>
          {icon}
        </span>
      )}
      <span data-workbench-node-name>{node.data.name}</span>
    </div>
  );
};
