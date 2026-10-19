import type { ReactNode } from 'react';

/**
 * Engine-neutral language of an open file. Each editor integration maps it to
 * its own language setting, and maps a value it does not support to plain
 * text.
 */
export type WorkbenchEditorLanguage =
  | 'javascript'
  | 'jsx'
  | 'typescript'
  | 'tsx'
  | 'json'
  | 'css'
  | 'html'
  | 'markdown'
  | 'plaintext';

/** Color scheme of the widget and the editor inside it. */
export type WorkbenchColorTheme = 'dark' | 'light';

/**
 * Props every editor renderer receives. Engine-specific options stay in the
 * renderer's closure, so this contract carries no CodeMirror or Monaco types.
 */
export interface WorkbenchEditorProps {
  /** Name of the open file, used for display and language detection. */
  filename?: string;
  content: string;
  /** Detected from `filename` by the widget. */
  language: WorkbenchEditorLanguage;
  /** While true, the renderer must not call `onChange` or `onSave`. */
  readOnly: boolean;
  theme: WorkbenchColorTheme;
  onChange: (content: string) => void;
  /** Called with the latest text when the user asks to save. */
  onSave?: (content: string) => void;
}

export type WorkbenchEditorRenderer = (
  props: WorkbenchEditorProps,
) => ReactNode;
