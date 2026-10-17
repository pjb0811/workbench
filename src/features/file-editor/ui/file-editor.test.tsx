// @vitest-environment jsdom
import { useState } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  WorkbenchEditorProps,
  WorkbenchEditorRenderer,
} from '../model/editor-contract';
import { FileEditor } from './file-editor';

// A minimal replacement editor: the contract alone must be enough to edit,
// save, and honor read-only and theme.
const renderTextarea: WorkbenchEditorRenderer = ({
  filename,
  content,
  language,
  readOnly,
  theme,
  onChange,
  onSave,
}: WorkbenchEditorProps) => (
  <textarea
    aria-label={filename}
    data-language={language}
    data-theme={theme}
    readOnly={readOnly}
    value={content}
    onChange={event => onChange(event.target.value)}
    onKeyDown={event => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        onSave?.(event.currentTarget.value);
      }
    }}
  />
);

afterEach(cleanup);

describe('FileEditor', () => {
  it('passes content, detected language, and theme to the renderer', () => {
    render(
      <FileEditor
        filename="app.tsx"
        content="export {};"
        theme="dark"
        onChange={() => {}}
        renderEditor={renderTextarea}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'app.tsx' });

    expect(editor).toHaveProperty('value', 'export {};');
    expect(editor.dataset.language).toBe('tsx');
    expect(editor.dataset.theme).toBe('dark');
  });

  it('defaults to a light, editable plain text editor', () => {
    const renderEditor = vi.fn<WorkbenchEditorRenderer>(() => null);

    render(
      <FileEditor content="" onChange={() => {}} renderEditor={renderEditor} />,
    );

    expect(renderEditor).toHaveBeenLastCalledWith(
      expect.objectContaining({
        language: 'plaintext',
        readOnly: false,
        theme: 'light',
      }),
    );
  });

  it('lets an explicit language override detection', () => {
    render(
      <FileEditor
        filename="notes.txt"
        content=""
        language="markdown"
        onChange={() => {}}
        renderEditor={renderTextarea}
      />,
    );

    expect(
      screen.getByRole('textbox', { name: 'notes.txt' }).dataset.language,
    ).toBe('markdown');
  });

  it('forwards edits and saves the latest text', () => {
    const onChange = vi.fn();
    const onSave = vi.fn();

    // Owns the content the way the Workbench widget will.
    const Harness = () => {
      const [content, setContent] = useState('a');

      return (
        <FileEditor
          filename="index.ts"
          content={content}
          onChange={next => {
            onChange(next);
            setContent(next);
          }}
          onSave={onSave}
          renderEditor={renderTextarea}
        />
      );
    };

    render(<Harness />);

    const editor = screen.getByRole('textbox', { name: 'index.ts' });

    fireEvent.change(editor, { target: { value: 'ab' } });
    fireEvent.keyDown(editor, { key: 's', ctrlKey: true });

    expect(onChange).toHaveBeenCalledWith('ab');
    expect(onSave).toHaveBeenCalledWith('ab');
  });

  it('blocks changes and saves while read-only, even if the renderer calls them', () => {
    const onChange = vi.fn();
    const onSave = vi.fn();
    const renderEditor = vi.fn<WorkbenchEditorRenderer>(props => {
      props.onChange('changed');
      props.onSave?.('changed');

      return null;
    });

    const view = render(
      <FileEditor
        content="a"
        readOnly
        onChange={onChange}
        onSave={onSave}
        renderEditor={renderEditor}
      />,
    );

    expect(renderEditor).toHaveBeenLastCalledWith(
      expect.objectContaining({ readOnly: true, onSave: undefined }),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
    expect(
      view.container
        .querySelector('[data-workbench-editor]')
        ?.getAttribute('data-readonly'),
    ).toBe('true');
  });

  it('wraps the renderer output in workbench-owned elements', () => {
    const view = render(
      <FileEditor
        content=""
        onChange={() => {}}
        renderEditor={() => <span data-testid="custom" />}
      />,
    );

    const wrapper = view.container.querySelector('[data-workbench-editor]')!;
    const content = wrapper.querySelector('[data-workbench-content]')!;

    expect(wrapper.hasAttribute('data-readonly')).toBe(false);
    expect(content.contains(screen.getByTestId('custom'))).toBe(true);
  });
});
