---
'@jbpark/workbench': minor
---

Add sidebar size props and `renderLayout` to `Workbench`. `defaultSidebarSize`, `minSidebarSize` and `maxSidebarSize` set the sidebar width and its limits in percent (20, 15 and 50 by default), and `onSidebarResize` reports the width when a drag or key press that changed it ends, e.g. to persist it. `renderLayout({ sidebar, main, sidebarId })` arranges the tree and editor regions instead of the built-in side-by-side layout, for example stacked on a narrow screen. The sidebar separator now comes from `useSplitResize` in `@jbpark/use-hooks`.
