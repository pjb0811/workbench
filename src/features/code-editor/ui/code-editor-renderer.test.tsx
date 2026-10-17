// @vitest-environment jsdom
import type { ComponentProps } from 'react';

import { json } from '@codemirror/lang-json';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { WorkbenchEditorProps } from '@/features/file-editor';

import {
  codeEditorRenderer,
  createCodeEditorRenderer,
} from './code-editor-renderer';

type CodeEditorProps = ComponentProps<
  typeof import('@jbpark/ui-kit/CodeEditor').default
>;

const received = vi.hoisted(() => [] as CodeEditorProps[]);

vi.mock('@jbpark/ui-kit/CodeEditor', () => ({
  default: (props: CodeEditorProps) => {
    received.push(props);

    return null;
  },
}));

const props = (
  overrides: Partial<WorkbenchEditorProps> = {},
): WorkbenchEditorProps => ({
  content: 'content',
  language: 'typescript',
  readOnly: false,
  theme: 'dark',
  onChange: () => {},
  ...overrides,
});

const renderWith = (
  renderer: typeof codeEditorRenderer,
  overrides?: Partial<WorkbenchEditorProps>,
) => {
  received.length = 0;
  render(<>{renderer(props(overrides))}</>);

  return received.at(-1)!;
};

afterEach(cleanup);

describe('codeEditorRenderer', () => {
  it('maps the contract onto CodeEditor props', () => {
    const onChange = vi.fn();
    const onSave = vi.fn();
    const editor = renderWith(codeEditorRenderer, { onChange, onSave });

    expect(editor).toMatchObject({
      value: 'content',
      readOnly: false,
      editable: true,
      theme: 'dark',
      height: '100%',
      onChange,
      onSave,
    });
  });

  it('makes the editor read-only and not editable', () => {
    const editor = renderWith(codeEditorRenderer, { readOnly: true });

    expect(editor.readOnly).toBe(true);
    expect(editor.editable).toBe(false);
  });

  it('highlights the JS/TS family and renders other languages as plain text', () => {
    for (const language of [
      'javascript',
      'jsx',
      'typescript',
      'tsx',
    ] as const) {
      expect(
        renderWith(codeEditorRenderer, { language }).language,
      ).toBeTruthy();
    }

    for (const language of ['json', 'markdown', 'plaintext'] as const) {
      expect(renderWith(codeEditorRenderer, { language }).language).toBeNull();
    }
  });

  it('keeps language extensions stable across renders', () => {
    const first = renderWith(codeEditorRenderer).language;

    expect(renderWith(codeEditorRenderer).language).toBe(first);
  });

  it('uses extensions the consumer adds for other languages', () => {
    const jsonLanguage = json();
    const renderer = createCodeEditorRenderer({
      languages: { json: jsonLanguage },
    });

    expect(renderWith(renderer, { language: 'json' }).language).toBe(
      jsonLanguage,
    );
    expect(renderWith(renderer, { language: 'tsx' }).language).toBeTruthy();
  });
});
