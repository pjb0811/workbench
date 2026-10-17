import {
  FileEditor,
  FileTree,
  type FileTreeIconRenderer,
  Workbench,
  type WorkbenchAdapter,
  type WorkbenchEditorLanguage,
  type WorkbenchEditorRenderer,
  type WorkbenchNode,
  createFsAdapter,
  createHttpAdapter,
  detectLanguage,
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

const language: WorkbenchEditorLanguage = detectLanguage(node.name);
const renderEditor: WorkbenchEditorRenderer = ({
  content,
  language,
  readOnly,
}) => `${language}:${readOnly}:${content}`;

renderEditor({
  filename: node.name,
  content: 'content',
  language,
  readOnly: false,
  theme: 'dark',
  onChange: content => adapter.writeFile(node, content),
});
FileEditor({
  filename: node.name,
  content: 'content',
  onChange: content => adapter.writeFile(node, content),
  renderEditor,
});

// Picker options belong to the demo's ambient types (#29).
// @ts-expect-error The consumer must not inherit the demo's picker global.
export type PickerOptions = DirectoryPickerOptions;

// @ts-expect-error The consumer must not inherit the demo's picker function.
window.showDirectoryPicker();
