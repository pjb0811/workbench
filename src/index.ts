export { Workbench } from '@/widgets/workbench';
export type { WorkbenchProps } from '@/widgets/workbench';

export { FileTree } from '@/features/file-tree';
export type {
  FileTreeProps,
  FileTreeIconProps,
  FileTreeIconRenderer,
} from '@/features/file-tree';

export { createFsAdapter } from '@/features/fs-adapter';
export { createHttpAdapter } from '@/features/http-adapter';
export type { HttpAdapterOptions } from '@/features/http-adapter';

export type { NodeKind, WorkbenchNode } from '@/entities/node';
export type { WorkbenchAdapter } from '@/entities/adapter';
