// @vitest-environment jsdom
import { useState } from 'react';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { WorkbenchEditorRenderer } from '@/features/file-editor';

import type { WorkbenchAdapter } from '@/entities/adapter';
import type { WorkbenchNode } from '@/entities/node';

import { Workbench } from './workbench';

class ResizeObserverMock {
  constructor(private callback: ResizeObserverCallback) {}

  observe(target: Element) {
    this.callback(
      [{ target, contentRect: { height: 220 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }

  disconnect() {}
}

// A replacement editor that edits through the contract and saves on Ctrl+S.
const renderTextarea: WorkbenchEditorRenderer = ({
  filename,
  content,
  readOnly,
  onChange,
  onSave,
}) => (
  <textarea
    aria-label={filename}
    readOnly={readOnly}
    value={content}
    onChange={event => onChange(event.target.value)}
    onKeyDown={event => {
      if (event.ctrlKey && event.key === 's') {
        onSave?.(event.currentTarget.value);
      }
    }}
  />
);

const file = (name: string): WorkbenchNode => ({
  id: name,
  name,
  kind: 'file',
});

const createAdapter = (
  files: Record<string, string>,
  overrides: Partial<WorkbenchAdapter> = {},
) => ({
  getTree: vi.fn(async () => Object.keys(files).map(file)),
  loadChildren: vi.fn(async () => []),
  readFile: vi.fn(async (node: WorkbenchNode) => files[node.id]),
  writeFile: vi.fn(async (node: WorkbenchNode, content: string) => {
    files[node.id] = content;
  }),
  ...overrides,
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });

  return { promise, resolve };
};

const openFile = async (name: string) => {
  fireEvent.click(await screen.findByText(name));

  return screen.findByRole('textbox', { name });
};

const saveButton = () => screen.getByRole('button', { name: 'Save' });

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Workbench', () => {
  it('shows the empty state until a file is opened', async () => {
    const adapter = createAdapter({ 'a.ts': 'a' });
    const view = render(
      <Workbench adapter={adapter} renderEditor={renderTextarea} />,
    );

    expect(await screen.findByText('a.ts')).toBeTruthy();
    expect(view.container.querySelector('[data-workbench-empty]')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });

  it('opens, edits and saves a file with the save button', async () => {
    const adapter = createAdapter({ 'a.ts': 'a' });

    render(<Workbench adapter={adapter} renderEditor={renderTextarea} />);

    const editor = await openFile('a.ts');

    expect(editor).toHaveProperty('value', 'a');
    expect(saveButton()).toHaveProperty('disabled', true);
    expect(saveButton().hasAttribute('data-dirty')).toBe(false);

    fireEvent.change(editor, { target: { value: 'ab' } });

    expect(saveButton()).toHaveProperty('disabled', false);
    expect(saveButton().getAttribute('data-dirty')).toBe('true');

    fireEvent.click(saveButton());

    await waitFor(() => expect(saveButton()).toHaveProperty('disabled', true));
    expect(adapter.writeFile).toHaveBeenCalledExactlyOnceWith(
      file('a.ts'),
      'ab',
    );
    expect(saveButton().hasAttribute('data-dirty')).toBe(false);
  });

  it('saves the latest text from the editor shortcut and skips clean saves', async () => {
    const adapter = createAdapter({ 'a.ts': 'a' });

    render(<Workbench adapter={adapter} renderEditor={renderTextarea} />);

    const editor = await openFile('a.ts');

    fireEvent.keyDown(editor, { key: 's', ctrlKey: true });

    expect(adapter.writeFile).not.toHaveBeenCalled();

    fireEvent.change(editor, { target: { value: 'abc' } });
    fireEvent.keyDown(editor, { key: 's', ctrlKey: true });

    await waitFor(() =>
      expect(adapter.writeFile).toHaveBeenCalledExactlyOnceWith(
        file('a.ts'),
        'abc',
      ),
    );
  });

  it('keeps the file dirty and shows the adapter message when saving fails', async () => {
    const adapter = createAdapter(
      { 'a.ts': 'a' },
      { writeFile: vi.fn(async () => Promise.reject(new Error('disk full'))) },
    );

    render(<Workbench adapter={adapter} renderEditor={renderTextarea} />);

    const editor = await openFile('a.ts');

    fireEvent.change(editor, { target: { value: 'ab' } });
    fireEvent.click(saveButton());

    expect((await screen.findByRole('alert')).textContent).toBe('disk full');
    expect(saveButton().getAttribute('data-dirty')).toBe('true');
    expect(saveButton()).toHaveProperty('disabled', false);
    expect(editor).toHaveProperty('value', 'ab');
  });

  it('shows read and tree errors', async () => {
    const adapter = createAdapter(
      { 'a.ts': 'a' },
      { readFile: vi.fn(async () => Promise.reject(new Error('no access'))) },
    );
    const view = render(
      <Workbench adapter={adapter} renderEditor={renderTextarea} />,
    );

    fireEvent.click(await screen.findByText('a.ts'));

    expect((await screen.findByRole('alert')).textContent).toBe('no access');
    expect(view.container.querySelector('[data-workbench-empty]')).toBeTruthy();

    cleanup();
    render(
      <Workbench
        adapter={createAdapter(
          {},
          { getTree: vi.fn(async () => Promise.reject(new Error('offline'))) },
        )}
        renderEditor={renderTextarea}
      />,
    );

    expect((await screen.findByRole('alert')).textContent).toBe('offline');
  });

  it('loads directory children through the adapter', async () => {
    const directory: WorkbenchNode = {
      id: 'src',
      name: 'src',
      kind: 'directory',
    };
    const adapter = createAdapter(
      { 'src/b.ts': 'b' },
      {
        getTree: vi.fn(async () => [directory]),
        loadChildren: vi.fn(async () => [
          { id: 'src/b.ts', name: 'b.ts', kind: 'file' as const },
        ]),
      },
    );

    render(<Workbench adapter={adapter} renderEditor={renderTextarea} />);
    fireEvent.click(await screen.findByText('src'));

    expect(await openFile('b.ts')).toHaveProperty('value', 'b');
    expect(adapter.loadChildren).toHaveBeenCalledExactlyOnceWith(directory);
  });

  it('opens only the most recently selected file', async () => {
    const slow = deferred<string>();
    const adapter = createAdapter(
      { 'a.ts': 'a', 'b.ts': 'b' },
      {
        readFile: vi.fn(async (node: WorkbenchNode) =>
          node.id === 'a.ts' ? slow.promise : 'b',
        ),
      },
    );

    render(<Workbench adapter={adapter} renderEditor={renderTextarea} />);
    fireEvent.click(await screen.findByText('a.ts'));
    fireEvent.click(screen.getByText('b.ts'));

    expect(await screen.findByRole('textbox', { name: 'b.ts' })).toBeTruthy();

    await act(async () => slow.resolve('a'));

    expect(screen.queryByRole('textbox', { name: 'a.ts' })).toBeNull();
    expect(screen.getByRole('textbox', { name: 'b.ts' })).toBeTruthy();
  });

  it('reloads the tree for a new adapter and ignores the old one', async () => {
    const oldTree = deferred<WorkbenchNode[]>();
    const first = createAdapter(
      { 'old.ts': 'old' },
      { getTree: vi.fn(() => oldTree.promise) },
    );
    const second = createAdapter({ 'new.ts': 'new' });

    const Harness = () => {
      const [adapter, setAdapter] = useState<WorkbenchAdapter>(first);

      return (
        <>
          <button type="button" onClick={() => setAdapter(second)}>
            Switch
          </button>
          <Workbench adapter={adapter} renderEditor={renderTextarea} />
        </>
      );
    };

    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Switch' }));

    expect(await screen.findByText('new.ts')).toBeTruthy();

    await act(async () => oldTree.resolve([file('old.ts')]));

    expect(screen.queryByText('old.ts')).toBeNull();
    expect(screen.getByText('new.ts')).toBeTruthy();
  });

  it('renders a resize handle that controls the sidebar width', async () => {
    const view = render(
      <Workbench
        adapter={createAdapter({ 'a.ts': 'a' })}
        renderEditor={renderTextarea}
      />,
    );

    await screen.findByText('a.ts');

    const handle = screen.getByRole('separator', { name: 'Resize file tree' });
    const sidebar = view.container.querySelector<HTMLElement>(
      '[data-workbench-sidebar]',
    )!;

    expect(handle.hasAttribute('data-workbench-resize-handle')).toBe(true);
    expect(handle.getAttribute('aria-controls')).toBe(sidebar.id);
    expect(sidebar.style.width).toBe('20%');

    fireEvent.keyDown(handle, { key: 'End' });

    expect(sidebar.style.width).toBe('50%');
    expect(handle.getAttribute('aria-valuenow')).toBe('50');

    fireEvent.keyDown(handle, { key: 'Home' });

    expect(sidebar.style.width).toBe('15%');
  });

  it('defaults to the dark theme and switches the root and editor together', async () => {
    const adapter = createAdapter({ 'a.ts': 'a' });
    const renderEditor = vi.fn<WorkbenchEditorRenderer>(props => (
      <textarea
        aria-label={props.filename}
        data-theme={props.theme}
        value={props.content}
        onChange={event => props.onChange(event.target.value)}
      />
    ));
    const view = render(
      <Workbench adapter={adapter} renderEditor={renderEditor} />,
    );
    const root = () => view.container.querySelector('[data-workbench]')!;

    expect(root().getAttribute('data-theme')).toBe('dark');

    const editor = await openFile('a.ts');

    expect(editor.getAttribute('data-theme')).toBe('dark');

    fireEvent.change(editor, { target: { value: 'a2' } });
    view.rerender(
      <Workbench
        adapter={adapter}
        renderEditor={renderEditor}
        colorTheme="light"
      />,
    );

    const switched = screen.getByRole('textbox', { name: 'a.ts' });

    expect(root().getAttribute('data-theme')).toBe('light');
    expect(switched.getAttribute('data-theme')).toBe('light');
    // Switching themes keeps the open tab and its unsaved edit.
    expect(switched).toBe(editor);
    expect(switched).toHaveProperty('value', 'a2');
    expect(saveButton().getAttribute('data-dirty')).toBe('true');
  });

  describe('tabs', () => {
    const tabNames = () =>
      screen.getAllByRole('tab').map(tab => tab.textContent);
    const activeTab = () =>
      screen
        .getAllByRole('tab')
        .find(tab => tab.getAttribute('aria-selected') === 'true')?.textContent;
    const tabFor = (name: string) =>
      screen.getByRole('tab', { name }).closest('[data-workbench-tab]')!;

    it('keeps each tab open with its own content and dirty state', async () => {
      const adapter = createAdapter({ 'a.ts': 'a', 'b.ts': 'b' });

      render(<Workbench adapter={adapter} renderEditor={renderTextarea} />);

      fireEvent.change(await openFile('a.ts'), { target: { value: 'a2' } });
      await openFile('b.ts');

      expect(tabNames()).toEqual(['a.ts', 'b.ts']);
      expect(activeTab()).toBe('b.ts');
      expect(tabFor('a.ts').getAttribute('data-dirty')).toBe('true');
      expect(tabFor('b.ts').hasAttribute('data-dirty')).toBe(false);
      expect(tabFor('b.ts').getAttribute('data-active')).toBe('true');

      fireEvent.click(screen.getByRole('tab', { name: 'a.ts' }));

      expect(screen.getByRole('textbox', { name: 'a.ts' })).toHaveProperty(
        'value',
        'a2',
      );
      expect(saveButton().getAttribute('data-dirty')).toBe('true');
    });

    it('activates an open file from the tree without reading it again', async () => {
      const adapter = createAdapter({ 'a.ts': 'a', 'b.ts': 'b' });

      render(<Workbench adapter={adapter} renderEditor={renderTextarea} />);

      fireEvent.change(await openFile('a.ts'), { target: { value: 'a2' } });
      await openFile('b.ts');
      fireEvent.click(
        screen.getByText('a.ts', { selector: '[data-workbench-node-name]' }),
      );

      expect(
        await screen.findByRole('textbox', { name: 'a.ts' }),
      ).toHaveProperty('value', 'a2');
      expect(adapter.readFile).toHaveBeenCalledTimes(2);
      expect(tabNames()).toEqual(['a.ts', 'b.ts']);
    });

    it('saves the file of the tab that asked, after switching tabs', async () => {
      const write = deferred<void>();
      const adapter = createAdapter(
        { 'a.ts': 'a', 'b.ts': 'b' },
        { writeFile: vi.fn(() => write.promise) },
      );

      render(<Workbench adapter={adapter} renderEditor={renderTextarea} />);

      const a = await openFile('a.ts');

      fireEvent.change(a, { target: { value: 'a2' } });
      fireEvent.keyDown(a, { key: 's', ctrlKey: true });
      await openFile('b.ts');
      await act(async () => write.resolve());

      expect(adapter.writeFile).toHaveBeenCalledExactlyOnceWith(
        file('a.ts'),
        'a2',
      );
      expect(tabFor('a.ts').hasAttribute('data-dirty')).toBe(false);
      expect(activeTab()).toBe('b.ts');
    });

    it('activates the right neighbor, then the left, when the active tab closes', async () => {
      const adapter = createAdapter({ 'a.ts': 'a', 'b.ts': 'b', 'c.ts': 'c' });
      const view = render(
        <Workbench adapter={adapter} renderEditor={renderTextarea} />,
      );

      await openFile('a.ts');
      await openFile('b.ts');
      await openFile('c.ts');
      fireEvent.click(screen.getByRole('tab', { name: 'b.ts' }));
      fireEvent.click(screen.getByRole('button', { name: 'Close b.ts' }));

      expect(tabNames()).toEqual(['a.ts', 'c.ts']);
      expect(activeTab()).toBe('c.ts');

      fireEvent.click(screen.getByRole('button', { name: 'Close c.ts' }));

      expect(activeTab()).toBe('a.ts');
      expect(screen.getByRole('textbox', { name: 'a.ts' })).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: 'Close a.ts' }));

      expect(screen.queryByRole('tablist')).toBeNull();
      expect(
        view.container.querySelector('[data-workbench-empty]'),
      ).toBeTruthy();
    });

    describe('onBeforeCloseTab', () => {
      const closeButton = (name: string) =>
        screen.getByRole('button', { name: `Close ${name} (unsaved)` });

      it('keeps a dirty tab open when it returns false', async () => {
        const adapter = createAdapter({ 'a.ts': 'a' });
        const onBeforeCloseTab = vi.fn(() => false);

        render(
          <Workbench
            adapter={adapter}
            renderEditor={renderTextarea}
            onBeforeCloseTab={onBeforeCloseTab}
          />,
        );

        fireEvent.change(await openFile('a.ts'), { target: { value: 'a2' } });
        fireEvent.click(closeButton('a.ts'));
        fireEvent(
          screen.getByRole('tab', { name: 'a.ts' }),
          new MouseEvent('auxclick', { bubbles: true, button: 1 }),
        );

        expect(onBeforeCloseTab).toHaveBeenCalledTimes(2);
        expect(onBeforeCloseTab).toHaveBeenCalledWith({
          node: file('a.ts'),
          content: 'a2',
        });
        expect(tabNames()).toEqual(['a.ts']);
        expect(tabFor('a.ts').getAttribute('data-dirty')).toBe('true');
        expect(screen.getByRole('textbox', { name: 'a.ts' })).toHaveProperty(
          'value',
          'a2',
        );
      });

      it('waits for a promise once, then closes and activates the neighbor', async () => {
        const answer = deferred<boolean>();
        const adapter = createAdapter({ 'a.ts': 'a', 'b.ts': 'b' });
        const onBeforeCloseTab = vi.fn(() => answer.promise);

        render(
          <Workbench
            adapter={adapter}
            renderEditor={renderTextarea}
            onBeforeCloseTab={onBeforeCloseTab}
          />,
        );

        await openFile('a.ts');
        fireEvent.change(await openFile('b.ts'), {
          target: { value: 'b2' },
        });
        fireEvent.click(screen.getByRole('tab', { name: 'a.ts' }));
        fireEvent.click(screen.getByRole('tab', { name: 'b.ts' }));
        fireEvent.click(closeButton('b.ts'));
        fireEvent.click(closeButton('b.ts'));

        expect(onBeforeCloseTab).toHaveBeenCalledOnce();
        expect(tabNames()).toEqual(['a.ts', 'b.ts']);

        await act(async () => answer.resolve(true));

        expect(tabNames()).toEqual(['a.ts']);
        expect(activeTab()).toBe('a.ts');
      });

      it('closes clean tabs without asking', async () => {
        const adapter = createAdapter({ 'a.ts': 'a' });
        const onBeforeCloseTab = vi.fn(() => false);

        render(
          <Workbench
            adapter={adapter}
            renderEditor={renderTextarea}
            onBeforeCloseTab={onBeforeCloseTab}
          />,
        );

        await openFile('a.ts');
        fireEvent.click(screen.getByRole('button', { name: 'Close a.ts' }));

        expect(onBeforeCloseTab).not.toHaveBeenCalled();
        expect(screen.queryByRole('tablist')).toBeNull();
      });

      it('keeps the tab open and shows the message when it rejects', async () => {
        const adapter = createAdapter({ 'a.ts': 'a' });

        render(
          <Workbench
            adapter={adapter}
            renderEditor={renderTextarea}
            onBeforeCloseTab={() => Promise.reject(new Error('prompt failed'))}
          />,
        );

        fireEvent.change(await openFile('a.ts'), { target: { value: 'a2' } });
        fireEvent.click(closeButton('a.ts'));

        expect((await screen.findByRole('alert')).textContent).toBe(
          'prompt failed',
        );
        expect(tabNames()).toEqual(['a.ts']);
      });
    });

    it('reorders tabs by dragging one onto another', async () => {
      const adapter = createAdapter({ 'a.ts': 'a', 'b.ts': 'b', 'c.ts': 'c' });

      render(<Workbench adapter={adapter} renderEditor={renderTextarea} />);

      await openFile('a.ts');
      await openFile('b.ts');
      await openFile('c.ts');

      const dataTransfer = {
        setData: vi.fn(),
        effectAllowed: '',
        dropEffect: '',
      };

      fireEvent.dragStart(tabFor('a.ts'), { dataTransfer });

      expect(tabFor('a.ts').getAttribute('data-dragging')).toBe('true');

      fireEvent.dragOver(tabFor('c.ts'), { dataTransfer });

      expect(tabFor('c.ts').getAttribute('data-drop-target')).toBe('true');

      fireEvent.drop(tabFor('c.ts'), { dataTransfer });

      expect(tabNames()).toEqual(['b.ts', 'c.ts', 'a.ts']);
      expect(activeTab()).toBe('c.ts');
      expect(tabFor('a.ts').hasAttribute('data-dragging')).toBe(false);
      expect(tabFor('c.ts').hasAttribute('data-drop-target')).toBe(false);
    });

    it('labels the close button of a dirty tab and renders tab icons', async () => {
      const adapter = createAdapter({ 'a.ts': 'a' });

      render(
        <Workbench
          adapter={adapter}
          renderEditor={renderTextarea}
          renderIcon={({ node }) => <i data-testid={`icon-${node.id}`} />}
        />,
      );

      fireEvent.change(await openFile('a.ts'), { target: { value: 'a2' } });

      expect(
        screen.getByRole('button', { name: 'Close a.ts (unsaved)' }),
      ).toBeTruthy();
      expect(
        tabFor('a.ts').querySelector('[data-workbench-tab-icon] i'),
      ).toBeTruthy();
    });
  });

  describe('read-only', () => {
    it('opens files without a save button, edits or writes', async () => {
      const adapter = createAdapter({ 'a.ts': 'a' });
      const view = render(
        <Workbench adapter={adapter} renderEditor={renderTextarea} readOnly />,
      );

      const editor = await openFile('a.ts');

      expect(
        view.container.firstElementChild?.getAttribute('data-readonly'),
      ).toBe('true');
      expect(editor).toHaveProperty('readOnly', true);
      expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();

      fireEvent.change(editor, { target: { value: 'ab' } });
      fireEvent.keyDown(editor, { key: 's', ctrlKey: true });

      expect(editor).toHaveProperty('value', 'a');
      expect(adapter.writeFile).not.toHaveBeenCalled();
    });

    it('blocks a renderer that ignores readOnly', async () => {
      const adapter = createAdapter({ 'a.ts': 'a' });
      const renderEditor = vi.fn<WorkbenchEditorRenderer>(props => {
        props.onChange('changed');
        props.onSave?.('changed');

        return <span>{props.content}</span>;
      });

      render(
        <Workbench adapter={adapter} renderEditor={renderEditor} readOnly />,
      );
      fireEvent.click(await screen.findByText('a.ts'));

      await waitFor(() => expect(renderEditor).toHaveBeenCalled());
      expect(screen.getByText('a')).toBeTruthy();
      expect(adapter.writeFile).not.toHaveBeenCalled();
    });

    it('carries no data-readonly when omitted', async () => {
      const view = render(
        <Workbench
          adapter={createAdapter({ 'a.ts': 'a' })}
          renderEditor={renderTextarea}
        />,
      );

      await screen.findByText('a.ts');

      expect(
        view.container.firstElementChild?.hasAttribute('data-readonly'),
      ).toBe(false);
    });
  });
});
