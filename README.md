# workbench

## File tree icons

`FileTree` accepts a `renderIcon` callback with `{ node, expanded }`. It renders
no icons by default. Choose icons from the node's name, kind, or metadata;
`expanded` is always `false` for files. Return `null` to omit an icon.

```tsx
import { FileTree, type FileTreeIconRenderer } from 'workbench';

// These components belong to the consuming app and use locally bundled SVGs.
import { FileIcon, FolderIcon, FolderOpenIcon, TypeScriptIcon } from './icons';

const renderIcon: FileTreeIconRenderer = ({ node, expanded }) => {
  if (node.kind === 'directory') {
    return expanded ? <FolderOpenIcon /> : <FolderIcon />;
  }

  return /\.tsx?$/.test(node.name) ? <TypeScriptIcon /> : <FileIcon />;
};

// The parent must provide a bounded height for tree virtualization.
<div style={{ height: 400 }}>
  <FileTree nodes={nodes} renderIcon={renderIcon} onSelect={openFile} />
</div>;
```

Bundle icon assets in the consuming app to support offline rendering. Workbench
does not register icon collections, fetch assets, or include an icon dependency.
The VSCode icon mapping for the demo is tracked in #16.

Directory rows include a disclosure arrow. Clicking it or the directory name
toggles the directory; the tree also supports keyboard expansion. Icons and
arrows are decorative and hidden from assistive technology. The file or directory
name remains the accessible label. Keep icons free of interactive controls.

The tree provides these attributes for consumer CSS. Boolean data attributes are
present as `"true"` when active and absent otherwise.

| Selector                               | Meaning                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| `[data-workbench-node]`                | Tree row; `data-kind` is `file` or `directory`             |
| `[data-workbench-node][data-selected]` | Selected row                                               |
| `[data-workbench-node][data-expanded]` | Expanded directory row                                     |
| `[data-workbench-node-arrow]`          | Directory disclosure arrow; `data-open` reflects expansion |
| `[data-workbench-node-icon]`           | Consumer icon wrapper, omitted when no icon is returned    |
| `[data-workbench-node-name]`           | File or directory name                                     |
