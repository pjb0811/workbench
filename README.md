# workbench

## Workbench

`Workbench` combines the file tree, file tabs and the file editor around one
adapter. It loads the tree, opens each selected file in a tab, tracks unsaved
edits per tab, and saves through the adapter.

```tsx
import { Workbench } from 'workbench';
import { codeEditorRenderer } from 'workbench/code-editor';

<Workbench adapter={adapter} renderEditor={codeEditorRenderer} />;
```

| Prop           | Type                      | Meaning                                                         |
| -------------- | ------------------------- | --------------------------------------------------------------- |
| `adapter`      | `WorkbenchAdapter`        | Data source. Replacing it reloads the tree and closes every tab |
| `renderEditor` | `WorkbenchEditorRenderer` | Editor to render; see [File editor](#file-editor)               |
| `readOnly`     | `boolean`                 | View files without editing; defaults to `false`                 |
| `renderIcon`   | `FileTreeIconRenderer`    | Tree and tab icons; see [File tree icons](#file-tree-icons)     |

- **Saving.** The save button saves the active tab and is enabled while it has
  unsaved edits. Cmd/Ctrl+S in the editor saves the editor's latest text through
  the same path. A save stays tied to its tab even if you switch tabs while it
  runs. A successful `adapter.writeFile` clears the unsaved state; a
  failed one keeps it and shows the error.
- **Errors.** Failures from `getTree`, `loadChildren`, `readFile` and
  `writeFile` show the adapter's message in `[data-workbench-error]` with
  `role="alert"`. The message is cleared when the next file is opened or saved.
- **Read-only.** With `readOnly`, files still open, but the editor receives
  `readOnly: true`, no save button is rendered, edits and save shortcuts are
  ignored even from an editor that does not honor `readOnly`, and
  `adapter.writeFile` is never called. Use it for sources that cannot be
  written, such as `createHttpAdapter`.
- **Tabs.** Each opened file gets a tab that keeps its own content and unsaved
  edits. Selecting a file that is already open activates its tab without
  reading it again. Closing the active tab activates the tab to its right, or
  to its left when it was last. Closing a tab discards its unsaved edits. Drag
  a tab onto another to move it there (native HTML drag and drop); a middle click closes it. Tab icons come from
  `renderIcon`, called with `expanded: false`.
- **Resizing.** A separator between the tree and the editor resizes the
  sidebar. Drag it with a mouse, touch or pen, or focus it and use the arrow
  keys (1% per press), Home (narrowest) and End (widest). The sidebar starts
  at 20% of the widget width and stays between 15% and 50%. Its width is set
  inline, so consumer CSS should not set one.

Workbench ships no CSS. The tree only renders with a bounded height, so give
the widget a height and lay out its regions yourself, for example:

```css
[data-workbench] {
  display: flex;
  height: 100%;
}
[data-workbench-resize-handle] {
  width: 4px;
  cursor: col-resize;
}
[data-workbench][data-resizing] {
  cursor: col-resize;
  user-select: none;
}
[data-workbench-main] {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}
[data-workbench-editor],
[data-workbench-content] {
  flex: 1;
  min-height: 0;
}
```

| Selector                          | Meaning                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| `[data-workbench]`                | Widget root                                                                                    |
| `[data-workbench][data-readonly]` | Read-only widget                                                                               |
| `[data-workbench][data-resizing]` | Present while the sidebar is being resized                                                     |
| `[data-workbench-sidebar]`        | Region that holds the tree; its width is set inline                                            |
| `[data-workbench-resize-handle]`  | Separator that resizes the sidebar (`role="separator"`); `data-dragging` while dragged         |
| `[data-workbench-main]`           | Region that holds the editor; `aria-busy` while a file opens                                   |
| `[data-workbench-tabs]`           | Tab list (`role="tablist"`)                                                                    |
| `[data-workbench-tab]`            | One tab; `data-active`, `data-dirty`, `data-dragging` and `data-drop-target` reflect its state |
| `[data-workbench-tab-label]`      | Button that activates the tab (`role="tab"`)                                                   |
| `[data-workbench-tab-icon]`       | Consumer icon wrapper, omitted when no icon is returned                                        |
| `[data-workbench-tab-name]`       | File name                                                                                      |
| `[data-workbench-tab-close]`      | Close button                                                                                   |
| `[data-workbench-save]`           | Save button for the active tab; `data-dirty` while it has unsaved edits                        |
| `[data-workbench-error]`          | Error message                                                                                  |
| `[data-workbench-empty]`          | Shown while no file is open                                                                    |

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
