import type { WorkbenchEditorLanguage } from '../model/editor-contract';

const languageByExtension: Record<string, WorkbenchEditorLanguage> = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  tsx: 'tsx',
  json: 'json',
  css: 'css',
  html: 'html',
  htm: 'html',
  md: 'markdown',
  markdown: 'markdown',
};

/**
 * Returns the language for a filename by its last extension, case-insensitive.
 * A name with no extension, including a dotfile such as `.gitignore`, and an
 * unknown extension are plain text.
 */
export function detectLanguage(filename?: string): WorkbenchEditorLanguage {
  const dot = filename?.lastIndexOf('.') ?? -1;

  if (!filename || dot <= 0) {
    return 'plaintext';
  }

  const extension = filename.slice(dot + 1).toLowerCase();

  return Object.hasOwn(languageByExtension, extension)
    ? languageByExtension[extension]
    : 'plaintext';
}
