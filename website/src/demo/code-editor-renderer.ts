import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { createCodeEditorRenderer } from '@jbpark/workbench/code-editor';

// Created once at module scope: a new renderer builds new language
// extensions, which reconfigures the editor.
export const renderCodeEditor = createCodeEditorRenderer({
  languages: { json: json(), markdown: markdown() },
});
