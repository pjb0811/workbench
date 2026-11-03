# @jbpark/workbench

## 0.3.0

### Minor Changes

- 4469e1f: Add sidebar size props and `renderLayout` to `Workbench`. `defaultSidebarSize`, `minSidebarSize` and `maxSidebarSize` set the sidebar width and its limits in percent (20, 15 and 50 by default), and `onSidebarResize` reports the width when a drag or key press that changed it ends, e.g. to persist it. `renderLayout({ sidebar, main, sidebarId })` arranges the tree and editor regions instead of the built-in side-by-side layout, for example stacked on a narrow screen. The sidebar separator now comes from `useSplitResize` in `@jbpark/use-hooks`.

## 0.2.0

### Minor Changes

- 057c96e: Add `onBeforeCloseTab` to `Workbench`, so a consumer can confirm or cancel closing a tab with unsaved edits. Without it, closing still discards the edits as before.

## 0.1.0

### Minor Changes

- 1bd7bb2: First release of `@jbpark/workbench`: a headless React file tree and editor widget backed by a swappable `WorkbenchAdapter`. It ships `Workbench` (lazy, virtualized tree; drag-sortable tabs; resizable sidebar; read-only mode; dark and light themes), `FileTree`, `FileEditor` with an engine-neutral editor renderer contract, `createFsAdapter`, `createHttpAdapter`, and a ui-kit CodeEditor renderer in `@jbpark/workbench/code-editor`.
