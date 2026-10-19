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
| `colorTheme`   | `'dark' \| 'light'`       | Color scheme; defaults to `'dark'`                              |

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
- **Theme.** `colorTheme` sets `data-theme` on the root and is passed to the
  editor renderer as `theme`, so the tree, tabs and editor switch together.
  Workbench defines no colors: write them under `[data-theme='dark']` and
  `[data-theme='light']`. `codeEditorRenderer` switches ui-kit `CodeEditor`
  between its VSCode dark and light themes; another renderer maps `theme` to
  its own engine. Changing the theme keeps open tabs and unsaved edits.
- **Resizing.** A separator between the tree and the editor resizes the
  sidebar. Drag it with a mouse, touch or pen, or focus it and use the arrow
  keys (1% per press), Home (narrowest) and End (widest). The sidebar starts
  at 20% of the widget width and stays between 15% and 50%. Its width is set
  inline, so consumer CSS should not set one.

Workbench ships no CSS. Give it a parent with a height and style it through
its `data-*` attributes; see [Styling](#styling).

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

The tree's attributes are listed under [Styling](#styling).

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

The editor wrappers are listed under [Styling](#styling).

## Styling

Workbench is headless. It ships and imports no CSS, gives its elements no class
names, and exposes structure and state as `data-*` attributes instead, so any
styling tool works. Boolean attributes are present (as `"true"`) when active
and absent otherwise. The editor's interior belongs to the editor renderer:
ui-kit `CodeEditor` brings its own CodeMirror styles and themes, and
Workbench's selectors stop at `[data-workbench-content]`.

### Inline styles

Only styles that the behavior itself depends on are inline. Inline styles win
over stylesheet rules, so override them only with `!important`.

| Element                          | Inline style                                                          | Why                                                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[data-workbench-sidebar]`       | `width: N%`, `flex-shrink: 0`                                         | The width is the resize state                                                                                                                        |
| `[data-workbench-resize-handle]` | `touch-action: none`                                                  | A touch drag would scroll the page instead                                                                                                           |
| `[data-workbench-tree]`          | `height: 100%`, `width: 100%`, `min-height: 0`                        | The virtualized tree measures this box                                                                                                               |
| `[data-workbench-node]`          | `position`, `top`, `height` (22px), `width`, `min-width: max-content` | Set by react-arborist for virtualization. `min-width: max-content` makes long names scroll sideways; the example below overrides it to truncate them |
| `[data-workbench-node-content]`  | `padding-left` (16px per level)                                       | Indentation by depth, set by react-arborist                                                                                                          |

### Attributes

| Selector                          | Meaning                                                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `[data-workbench]`                | Widget root                                                                                                           |
| `[data-workbench][data-theme]`    | `dark` or `light`, from `colorTheme`                                                                                  |
| `[data-workbench][data-readonly]` | Read-only widget                                                                                                      |
| `[data-workbench][data-resizing]` | Present while the sidebar is being resized                                                                            |
| `[data-workbench-sidebar]`        | Region that holds the tree                                                                                            |
| `[data-workbench-resize-handle]`  | Sidebar separator (`role="separator"`); `data-dragging` while dragged                                                 |
| `[data-workbench-main]`           | Region that holds the tabs and the editor; `aria-busy` while a file opens                                             |
| `[data-workbench-tree]`           | Tree `<nav>`; `data-loading` while the root loads                                                                     |
| `[data-workbench-tree-error]`     | Load error inside a standalone `FileTree` without `onError`; `Workbench` shows it in `[data-workbench-error]` instead |
| `[data-workbench-node]`           | Tree row (`role="treeitem"`); `data-kind` is `file` or `directory`, plus `data-selected` and `data-expanded`          |
| `[data-workbench-node-content]`   | Row content, indented by depth                                                                                        |
| `[data-workbench-node-arrow]`     | Directory disclosure arrow; `data-open` while expanded                                                                |
| `[data-workbench-node-icon]`      | Consumer icon wrapper, omitted when `renderIcon` returns nothing                                                      |
| `[data-workbench-node-name]`      | File or directory name                                                                                                |
| `[data-workbench-tabs]`           | Tab list (`role="tablist"`)                                                                                           |
| `[data-workbench-tab]`            | One tab; `data-active`, `data-dirty`, `data-dragging` and `data-drop-target` reflect its state                        |
| `[data-workbench-tab-label]`      | Button that activates the tab (`role="tab"`)                                                                          |
| `[data-workbench-tab-icon]`       | Consumer icon wrapper, omitted when `renderIcon` returns nothing                                                      |
| `[data-workbench-tab-name]`       | File name                                                                                                             |
| `[data-workbench-tab-close]`      | Close button                                                                                                          |
| `[data-workbench-save]`           | Save button for the active tab; `data-dirty` while it has unsaved edits                                               |
| `[data-workbench-error]`          | Error message (`role="alert"`)                                                                                        |
| `[data-workbench-empty]`          | Shown while no file is open                                                                                           |
| `[data-workbench-editor]`         | Editor wrapper owned by Workbench; `data-readonly` when read-only                                                     |
| `[data-workbench-content]`        | Element that contains the renderer's output                                                                           |

`data-dirty` is a shared state attribute: it appears on both the save button
and a tab.

### Tailwind CSS v4 example

A complete stylesheet for Tailwind CSS v4 with `@tailwindcss/vite` or
`@tailwindcss/postcss`. Import it once in the app; it styles the tree, tabs,
separator, save button, messages and editor area in both themes. The
`wb-dark` variant keys dark colors on Workbench's own `data-theme`, so it does
not depend on how the app handles dark mode.

```css
@import 'tailwindcss';

/* Matches elements inside a Workbench whose colorTheme is 'dark'. */
@custom-variant wb-dark (&:where([data-workbench][data-theme='dark'], [data-workbench][data-theme='dark'] *));

@layer components {
  /* Layout. The widget fills its parent, which must have a height. */
  [data-workbench] {
    @apply flex h-full bg-white text-sm text-zinc-800 wb-dark:bg-zinc-900 wb-dark:text-zinc-200;
  }
  [data-workbench][data-resizing] {
    @apply cursor-col-resize select-none;
  }
  [data-workbench-sidebar] {
    @apply min-w-0 py-1;
  }
  [data-workbench-resize-handle] {
    @apply w-1 shrink-0 cursor-col-resize bg-zinc-200 outline-none hover:bg-sky-500 focus-visible:bg-sky-500 wb-dark:bg-zinc-700;
  }
  [data-workbench-resize-handle][data-dragging] {
    @apply bg-sky-500;
  }
  [data-workbench-main] {
    @apply flex min-w-0 flex-1 flex-col;
  }

  /* Tree. Row position, height and indentation are inline styles. */
  [data-workbench-node] {
    @apply cursor-pointer outline-none hover:bg-zinc-100 wb-dark:hover:bg-zinc-800;
    /* Rows are inline min-width: max-content, which scrolls long names
       sideways. Overriding it truncates them instead. */
    min-width: 0 !important;
  }
  [data-workbench-node][data-selected] {
    @apply bg-sky-100 wb-dark:bg-sky-900/60;
  }
  [data-workbench-node]:focus-visible {
    @apply ring-1 ring-sky-500 ring-inset;
  }
  [data-workbench-node-content] {
    @apply flex h-full min-w-0 items-center gap-1.5 overflow-hidden pr-2 whitespace-nowrap;
  }
  /* Indentation is an inline padding-left, so files line up with directory
     names through a margin instead. */
  [data-workbench-node][data-kind='file'] [data-workbench-node-name] {
    @apply ml-4;
  }
  [data-workbench-node-arrow] {
    @apply w-2.5 text-center text-zinc-500;
  }
  [data-workbench-node-name] {
    @apply min-w-0 truncate;
  }
  [data-workbench-tree][data-loading] {
    @apply opacity-60;
  }

  /* Tabs. */
  [data-workbench-tabs] {
    @apply flex overflow-x-auto border-b border-zinc-200 bg-zinc-50 wb-dark:border-zinc-700 wb-dark:bg-zinc-800;
  }
  [data-workbench-tab] {
    @apply flex shrink-0 items-center border-r border-zinc-200 text-zinc-500 wb-dark:border-zinc-700;
  }
  [data-workbench-tab][data-active] {
    @apply bg-white text-zinc-900 wb-dark:bg-zinc-900 wb-dark:text-zinc-100;
  }
  [data-workbench-tab][data-dragging] {
    @apply opacity-50;
  }
  [data-workbench-tab][data-drop-target] {
    @apply border-l-2 border-l-sky-500;
  }
  [data-workbench-tab-label] {
    @apply flex items-center gap-1.5 py-1.5 pr-1 pl-3;
  }
  [data-workbench-tab-close] {
    @apply mr-1 rounded px-1 leading-none opacity-60 hover:bg-zinc-200 hover:opacity-100 wb-dark:hover:bg-zinc-700;
  }
  /* A dot replaces the close mark on unsaved tabs until hovered. */
  [data-workbench-tab][data-dirty]:not(:hover) [data-workbench-tab-close] {
    @apply text-[0px] before:text-sm before:content-['●'];
  }

  /* Save button, messages and the editor. */
  [data-workbench-save] {
    @apply m-2 self-start rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent wb-dark:border-zinc-600 wb-dark:hover:bg-zinc-800;
  }
  [data-workbench-save][data-dirty] {
    @apply border-sky-500 text-sky-600 wb-dark:text-sky-400;
  }
  [data-workbench-error] {
    @apply mx-2 rounded bg-red-50 px-3 py-2 text-red-700 wb-dark:bg-red-950 wb-dark:text-red-300;
  }
  [data-workbench-empty] {
    @apply m-auto text-zinc-400;
  }
  [data-workbench-editor],
  [data-workbench-content] {
    @apply flex min-h-0 flex-1 flex-col;
  }
  [data-workbench-content] > * {
    @apply min-h-0 flex-1;
  }
}
```
