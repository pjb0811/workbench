---
sidebar_position: 1
title: Overview
---

# workbench

A headless React file tree and editor. `Workbench` shows a lazily loaded,
virtualized file tree next to tabbed editors, and gets its files from a
`WorkbenchAdapter`, so the same widget works over a local folder, a REST API or
any other source. It ships no CSS: every element exposes `data-*` attributes
for your own styles.

## Install

```bash
pnpm add @jbpark/workbench
```

React 19.1.1 or later is a peer dependency. The default editor, a CodeMirror
editor from [`@jbpark/ui-kit`](https://www.npmjs.com/package/@jbpark/ui-kit),
is a separate entry with its own optional peers; see
[File editor](./file-editor.mdx).

## Quick start

Open a local folder in a Chromium-based browser and edit it:

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

Then add styles: Workbench renders unstyled markup until you do. The
[Styling](./styling.mdx) page has a complete stylesheet to start from.

## Pages

| Page                             | Covers                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| [Workbench](./workbench.mdx)     | The composite widget: props, saving, tabs, read-only, theme, resizing. Live demo                   |
| [File tree](./file-tree.mdx)     | `FileTree` on its own: lazy loading, selection, icons. Live demo                                   |
| [File editor](./file-editor.mdx) | `FileEditor`, the editor renderer contract, the ui-kit CodeEditor entry, custom editors. Live demo |
| [Adapters](./adapters.mdx)       | `createFsAdapter`, `createHttpAdapter`, and writing your own `WorkbenchAdapter`                    |
| [Styling](./styling.mdx)         | The headless styling surface, every `data-*` attribute, and a complete Tailwind CSS v4 stylesheet  |

## Links

- [GitHub](https://github.com/pjb0811/workbench)
- [npm](https://www.npmjs.com/package/@jbpark/workbench)
