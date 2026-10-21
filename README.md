# workbench

[![npm](https://img.shields.io/npm/v/@jbpark/workbench.svg?style=flat-square&color=black&labelColor=eeeeee)](https://www.npmjs.com/package/@jbpark/workbench)

[English](README.md) | [한국어](README.ko.md)

A headless React file tree and editor. `Workbench` shows a lazily loaded, virtualized file tree next to tabbed editors and gets its files from a swappable `WorkbenchAdapter`, so the same widget works over a local folder, a REST API or any other source.

**Documentation and live demos: https://workbench-guide.vercel.app**

## Features

- **Any data source.** Four adapter methods (`getTree`, `loadChildren`, `readFile`, `writeFile`) connect a local folder (`createFsAdapter`), a REST API (`createHttpAdapter`) or your own store. Directories load one level at a time.
- **Any editor.** File tabs, unsaved state and saving work through an engine-neutral renderer contract. Use the CodeMirror editor from `@jbpark/workbench/code-editor` or bring your own.
- **Headless.** No CSS and no class names: every region and state is a `data-*` attribute.
- **A complete widget.** Drag-sortable tabs, a resizable sidebar, read-only mode, and dark and light themes.

## Installation

```bash
pnpm add @jbpark/workbench
```

React 19.1.1 or later is a peer dependency. The default editor is a separate entry with optional peers:

```bash
pnpm add @jbpark/ui-kit @uiw/react-codemirror @uiw/codemirror-theme-vscode \
  @codemirror/lang-javascript @codemirror/merge codemirror
```

## Usage

```tsx
import { useState } from 'react';

import {
  Workbench,
  type WorkbenchAdapter,
  createFsAdapter,
} from '@jbpark/workbench';
import { codeEditorRenderer } from '@jbpark/workbench/code-editor';

export function App() {
  const [adapter, setAdapter] = useState<WorkbenchAdapter>();

  const openFolder = async () => {
    // The File System Access API: Chromium-based browsers, HTTPS or localhost.
    const directory = await window.showDirectoryPicker({ mode: 'readwrite' });

    setAdapter(createFsAdapter(directory));
  };

  if (!adapter) {
    return <button onClick={openFolder}>Open folder</button>;
  }

  // The widget fills its parent, which must have a height.
  return (
    <div style={{ height: '100vh' }}>
      <Workbench adapter={adapter} renderEditor={codeEditorRenderer} />
    </div>
  );
}
```

Workbench renders unstyled markup until you add styles. The [Styling](https://workbench-guide.vercel.app/docs/styling) page lists every attribute and has a complete Tailwind CSS v4 stylesheet.

| Guide                                                              | Covers                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| [Workbench](https://workbench-guide.vercel.app/docs/workbench)     | Props, saving, tabs, read-only, theme, resizing                           |
| [File tree](https://workbench-guide.vercel.app/docs/file-tree)     | `FileTree` on its own, lazy loading, icons                                |
| [File editor](https://workbench-guide.vercel.app/docs/file-editor) | `FileEditor`, the renderer contract, the CodeMirror entry, custom editors |
| [Adapters](https://workbench-guide.vercel.app/docs/adapters)       | `createFsAdapter`, `createHttpAdapter`, writing your own                  |
| [Styling](https://workbench-guide.vercel.app/docs/styling)         | Every `data-*` attribute, inline styles, a Tailwind CSS v4 stylesheet     |

## Package entries

| Entry                           | Contents                                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `@jbpark/workbench`             | `Workbench`, `FileTree`, `FileEditor`, `createFsAdapter`, `createHttpAdapter`, `detectLanguage` and their types |
| `@jbpark/workbench/code-editor` | `codeEditorRenderer` and `createCodeEditorRenderer`, backed by `@jbpark/ui-kit`'s CodeMirror editor             |

## Development

Use the Node version in `.nvmrc` and pnpm.

```bash
pnpm install
pnpm dev                    # demo app in demo/ (local folder or mock HTTP source)
pnpm build                  # library bundle and types into dist/
pnpm lint
pnpm check-types
pnpm test
pnpm check-declarations     # built declarations without demo globals

pnpm --dir website install  # the docs site is a separate pnpm project
pnpm --dir website start    # builds the library, then serves the site
```

How runtime dependencies are split between `peerDependencies`, `dependencies` and the consumer is fixed in [docs/dependency-policy.md](docs/dependency-policy.md).

Releases use [changesets](https://github.com/changesets/changesets): add one with `pnpm changeset` in any pull request that changes the published package.

## License

[MIT](LICENSE)
