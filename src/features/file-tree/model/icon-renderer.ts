import { type ReactNode, createContext } from 'react';

import type { WorkbenchNode } from '@/entities/node';

export interface FileTreeIconProps {
  /** The file or directory to render. */
  node: WorkbenchNode;
  /** Whether the directory is expanded. Always false for files. */
  expanded: boolean;
}

/** Returns a decorative icon, or null to omit it. */
export type FileTreeIconRenderer = (props: FileTreeIconProps) => ReactNode;

export const FileTreeIconContext = createContext<
  FileTreeIconRenderer | undefined
>(undefined);
