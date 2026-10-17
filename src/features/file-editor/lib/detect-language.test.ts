import { describe, expect, it } from 'vitest';

import { detectLanguage } from './detect-language';

describe('detectLanguage', () => {
  it.each([
    ['index.js', 'javascript'],
    ['config.mjs', 'javascript'],
    ['config.cjs', 'javascript'],
    ['app.jsx', 'jsx'],
    ['index.ts', 'typescript'],
    ['config.mts', 'typescript'],
    ['config.cts', 'typescript'],
    ['app.tsx', 'tsx'],
    ['package.json', 'json'],
    ['styles.css', 'css'],
    ['index.html', 'html'],
    ['index.htm', 'html'],
    ['README.md', 'markdown'],
    ['notes.markdown', 'markdown'],
  ] as const)('maps %s to %s', (filename, language) => {
    expect(detectLanguage(filename)).toBe(language);
  });

  it('ignores the case of the extension', () => {
    expect(detectLanguage('README.MD')).toBe('markdown');
    expect(detectLanguage('App.TSX')).toBe('tsx');
  });

  it('uses only the last extension of a multi-dot name', () => {
    expect(detectLanguage('app.test.tsx')).toBe('tsx');
    expect(detectLanguage('index.d.ts')).toBe('typescript');
    expect(detectLanguage('.eslintrc.json')).toBe('json');
  });

  it('falls back to plain text', () => {
    expect(detectLanguage(undefined)).toBe('plaintext');
    expect(detectLanguage('')).toBe('plaintext');
    expect(detectLanguage('Makefile')).toBe('plaintext');
    expect(detectLanguage('.gitignore')).toBe('plaintext');
    expect(detectLanguage('archive.')).toBe('plaintext');
    expect(detectLanguage('image.png')).toBe('plaintext');
  });

  it('does not treat Object.prototype keys as extensions', () => {
    expect(detectLanguage('file.constructor')).toBe('plaintext');
    expect(detectLanguage('file.__proto__')).toBe('plaintext');
  });
});
