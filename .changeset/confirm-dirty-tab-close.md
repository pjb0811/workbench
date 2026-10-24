---
'@jbpark/workbench': minor
---

Add `onBeforeCloseTab` to `Workbench`, so a consumer can confirm or cancel closing a tab with unsaved edits. Without it, closing still discards the edits as before.
