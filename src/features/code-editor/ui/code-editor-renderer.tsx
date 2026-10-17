import { javascript } from '@codemirror/lang-javascript';
import CodeEditor from '@jbpark/ui-kit/CodeEditor';
import type { Extension } from '@uiw/react-codemirror';

import type {
  WorkbenchEditorLanguage,
  WorkbenchEditorRenderer,
} from '@/features/file-editor';

/** CodeMirror language extensions keyed by Workbench language. */
export type CodeEditorLanguages = Partial<
  Record<WorkbenchEditorLanguage, Extension>
>;

export interface CodeEditorRendererOptions {
  /**
   * Extensions for languages beyond JS/TS, such as `json()` from
   * `@codemirror/lang-json`, merged over the built-in ones. A language with
   * no extension renders as plain text.
   */
  languages?: CodeEditorLanguages;
}

/**
 * Creates a renderer backed by `@jbpark/ui-kit/CodeEditor`. Create it once,
 * outside render: each call builds new language extensions, and a new
 * extension reconfigures the editor.
 */
export function createCodeEditorRenderer({
  languages,
}: CodeEditorRendererOptions = {}): WorkbenchEditorRenderer {
  const extensions: CodeEditorLanguages = {
    javascript: javascript(),
    jsx: javascript({ jsx: true }),
    typescript: javascript({ typescript: true }),
    tsx: javascript({ jsx: true, typescript: true }),
    ...languages,
  };

  return ({ content, language, readOnly, theme, onChange, onSave }) => (
    <CodeEditor
      value={content}
      language={extensions[language] ?? null}
      readOnly={readOnly}
      editable={!readOnly}
      theme={theme}
      height="100%"
      onChange={onChange}
      onSave={onSave}
    />
  );
}

/** The ui-kit CodeEditor renderer with JS/TS highlighting only. */
export const codeEditorRenderer = createCodeEditorRenderer();
