import {
  FileTree,
  type FileTreeIconRenderer,
  Workbench,
  type WorkbenchAdapter,
  type WorkbenchNode,
  createFsAdapter,
  createHttpAdapter,
} from 'workbench';

declare const directory: FileSystemDirectoryHandle;

const adapter: WorkbenchAdapter = createFsAdapter(directory);
const node: WorkbenchNode = { id: 'file', name: 'file.txt', kind: 'file' };

adapter.readFile(node);
adapter.writeFile(node, 'content');
createHttpAdapter({ treeUrl: '/tree', fileUrl: '/files/{id}' });
Workbench({});
const renderIcon: FileTreeIconRenderer = ({ node, expanded }) =>
  `${node.kind}:${expanded}`;

FileTree({
  nodes: [node],
  renderIcon,
  onSelect: selected => adapter.readFile(selected),
});

// Picker options belong to the demo's ambient types (#29).
// @ts-expect-error The consumer must not inherit the demo's picker global.
export type PickerOptions = DirectoryPickerOptions;

// @ts-expect-error The consumer must not inherit the demo's picker function.
window.showDirectoryPicker();
