// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FileEditor } from '@/features/file-editor';

import { codeEditorRenderer } from './code-editor-renderer';

afterEach(cleanup);

describe('codeEditorRenderer in FileEditor', () => {
  it('renders the file in ui-kit CodeEditor and saves with Ctrl+S', () => {
    const onSave = vi.fn();
    const view = render(
      <FileEditor
        filename="index.ts"
        content="const a = 1;"
        onChange={() => {}}
        onSave={onSave}
        renderEditor={codeEditorRenderer}
      />,
    );
    const content = view.container.querySelector(
      '[data-workbench-content] .cm-content',
    )!;

    expect(content.textContent).toBe('const a = 1;');
    expect(content.getAttribute('contenteditable')).toBe('true');

    fireEvent.keyDown(content, { key: 's', ctrlKey: true });

    expect(onSave).toHaveBeenCalledWith('const a = 1;');
  });

  it('is not editable while read-only', () => {
    const view = render(
      <FileEditor
        content="text"
        readOnly
        onChange={() => {}}
        renderEditor={codeEditorRenderer}
      />,
    );

    expect(
      view.container
        .querySelector('.cm-content')
        ?.getAttribute('contenteditable'),
    ).toBe('false');
  });
});
