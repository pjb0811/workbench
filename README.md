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

## File editor

`FileEditor` shows one file. It does not draw an editor itself: `renderEditor`
receives an engine-neutral set of props and returns the editor.

| Prop       | Type                                       | Meaning                                                  |
| ---------- | ------------------------------------------ | -------------------------------------------------------- |
| `filename` | `string`                                   | Name of the open file, used for display and the language |
| `content`  | `string`                                   | Current text                                             |
| `language` | `WorkbenchEditorLanguage`                  | Detected from `filename`, or `plaintext`                 |
| `readOnly` | `boolean`                                  | The editor must not change or save the file              |
| `theme`    | `'dark' \| 'light'`                        | Color scheme to render                                   |
| `onChange` | `(content: string) => void`                | Report an edit                                           |
| `onSave`   | `((content: string) => void) \| undefined` | Save the latest text; `undefined` while read-only        |

`FileEditor` takes `filename`, `content`, `onChange`, `onSave` and
`renderEditor`, plus optional `readOnly` (default `false`), `theme` (default
`'light'`) and `language`, which overrides detection. While `readOnly` is set,
`FileEditor` drops calls to `onChange` and `onSave` even if the renderer makes
them.

`detectLanguage(filename)` maps the last extension, ignoring case, to
`javascript`, `jsx`, `typescript`, `tsx`, `json`, `css`, `html` or `markdown`.
Anything else, including a dotfile such as `.gitignore`, is `plaintext`.

### ui-kit CodeEditor

`workbench/code-editor` provides a renderer backed by
[`@jbpark/ui-kit`](https://www.npmjs.com/package/@jbpark/ui-kit)'s CodeMirror
`CodeEditor`. It is a separate entry, so an app that only renders the tree or
brings its own editor never imports these packages. To use it, install the
optional peer dependencies:

```bash
pnpm add @jbpark/ui-kit @uiw/react-codemirror @uiw/codemirror-theme-vscode \
  @codemirror/lang-javascript @codemirror/merge codemirror
```

```tsx
import { FileEditor } from 'workbench';
import { codeEditorRenderer } from 'workbench/code-editor';

<div style={{ height: 400 }}>
  <FileEditor
    filename={file.name}
    content={content}
    onChange={setContent}
    onSave={save}
    renderEditor={codeEditorRenderer}
  />
</div>;
```

`codeEditorRenderer` highlights `javascript`, `jsx`, `typescript` and `tsx`, and
shows every other language as plain text. Add languages with
`createCodeEditorRenderer`, installing the CodeMirror language packages you
pass. Create the renderer once, outside render: a new renderer builds new
language extensions, which reconfigures the editor.

```tsx
import { json } from '@codemirror/lang-json';
import { createCodeEditorRenderer } from 'workbench/code-editor';

const renderEditor = createCodeEditorRenderer({ languages: { json: json() } });
```

Pressing Cmd/Ctrl+S in the editor calls `onSave`. The editor's own look comes
from ui-kit; Workbench imports no ui-kit CSS.

### Another editor

Any function that returns a React node from these props works as
`renderEditor`. It is called during render, so keep editor state inside a
component that it returns:

```tsx
import type { WorkbenchEditorRenderer } from 'workbench';

const renderTextarea: WorkbenchEditorRenderer = ({
  content,
  readOnly,
  onChange,
}) => (
  <textarea
    value={content}
    readOnly={readOnly}
    onChange={event => onChange(event.target.value)}
  />
);
```

| Selector                                 | Meaning                                     |
| ---------------------------------------- | ------------------------------------------- |
| `[data-workbench-editor]`                | Editor wrapper owned by Workbench           |
| `[data-workbench-editor][data-readonly]` | Read-only editor                            |
| `[data-workbench-content]`               | Element that contains the renderer's output |
