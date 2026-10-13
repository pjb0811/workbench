// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { WorkbenchNode } from '@/entities/node';

import { FileTree } from './file-tree';

const observers: ResizeObserverMock[] = [];

class ResizeObserverMock {
  target?: Element;
  disconnect = vi.fn();

  constructor(private callback: ResizeObserverCallback) {
    observers.push(this);
  }

  observe(target: Element) {
    this.target = target;
    this.resize(220);
  }

  resize(height: number) {
    this.callback(
      [{ target: this.target, contentRect: { height } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

const file = (id: string): WorkbenchNode => ({ id, name: id, kind: 'file' });
const directory = (): WorkbenchNode => ({
  id: 'directory',
  name: 'directory',
  kind: 'directory',
});

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('FileTree', () => {
  it('renders directory arrows without default icons', () => {
    const view = render(<FileTree nodes={[directory(), file('index.ts')]} />);
    const dir = screen.getByRole('treeitem', { name: 'directory' });
    const arrow = dir.querySelector('[data-workbench-node-arrow]')!;

    expect(arrow.textContent).toBe('›');
    expect(arrow.getAttribute('aria-hidden')).toBe('true');
    expect(arrow.hasAttribute('data-open')).toBe(false);
    expect(dir.getAttribute('aria-expanded')).toBe('false');
    expect(dir.getAttribute('data-kind')).toBe('directory');
    expect(
      view.container.querySelector('[data-workbench-node-icon]'),
    ).toBeNull();
    expect(
      screen
        .getByRole('treeitem', { name: 'index.ts' })
        .querySelector('[data-workbench-node-arrow]'),
    ).toBeNull();

    fireEvent.click(arrow);

    expect(arrow.textContent).toBe('⌄');
    expect(arrow.getAttribute('data-open')).toBe('true');
    expect(dir.getAttribute('data-expanded')).toBe('true');
    expect(dir.getAttribute('data-selected')).toBe('true');
    expect(dir.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(arrow);

    expect(arrow.textContent).toBe('›');
    expect(dir.hasAttribute('data-expanded')).toBe(false);
  });

  it('renders consumer icons and updates them on keyboard expansion', () => {
    const nodes = [{ ...directory(), children: [file('index.ts')] }];
    const renderIcon = vi.fn(({ node, expanded }) => (
      <svg
        data-testid={`icon-${node.id}`}
        data-icon={
          node.kind === 'directory'
            ? expanded
              ? 'folder-open'
              : 'folder'
            : 'typescript'
        }
      >
        <title>Decorative icon</title>
      </svg>
    ));

    render(<FileTree nodes={nodes} renderIcon={renderIcon} />);

    expect(screen.getByTestId('icon-directory').getAttribute('data-icon')).toBe(
      'folder',
    );
    expect(screen.getByRole('treeitem', { name: 'directory' })).toBeTruthy();
    expect(screen.queryByRole('treeitem', { name: /Decorative/ })).toBeNull();
    fireEvent.focus(screen.getByRole('tree'));
    fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowRight' });

    expect(screen.getByTestId('icon-directory').getAttribute('data-icon')).toBe(
      'folder-open',
    );
    expect(screen.getByTestId('icon-index.ts').getAttribute('data-icon')).toBe(
      'typescript',
    );
    expect(renderIcon).toHaveBeenCalledWith({
      node: nodes[0].children[0],
      expanded: false,
    });
    expect(
      screen
        .getByRole('treeitem', { name: 'index.ts' })
        .getAttribute('data-kind'),
    ).toBe('file');
  });

  it('updates the icon renderer without resetting expansion and omits null icons', () => {
    const nodes = [{ ...directory(), children: [file('child')] }];
    const view = render(
      <FileTree nodes={nodes} renderIcon={() => 'old-icon'} />,
    );

    fireEvent.click(screen.getByText('directory'));
    view.rerender(
      <FileTree
        nodes={nodes}
        renderIcon={({ node }) =>
          node.kind === 'file' ? null : <svg data-testid="replacement-icon" />
        }
      />,
    );

    expect(screen.queryByText('old-icon')).toBeNull();
    expect(screen.getByTestId('replacement-icon')).toBeTruthy();
    expect(screen.getByText('child')).toBeTruthy();
    expect(
      view.container.querySelectorAll('[data-workbench-node-icon]'),
    ).toHaveLength(1);

    view.rerender(<FileTree nodes={nodes} />);

    expect(
      view.container.querySelector('[data-workbench-node-icon]'),
    ).toBeNull();
    expect(screen.getByText('child')).toBeTruthy();
  });

  it('virtualizes 10,000 files and updates its viewport on resize', async () => {
    const nodes = Array.from({ length: 10_000 }, (_, index) =>
      file(`file-${index}`),
    );
    const view = render(<FileTree nodes={nodes} />);

    expect(screen.getAllByRole('treeitem').length).toBeLessThan(30);
    expect(screen.queryByText('file-9999')).toBeNull();

    const viewport = screen.getByRole('tree');

    expect(viewport.style.height).toBe('220px');
    const scrollContainer = viewport.firstElementChild!;

    Object.defineProperties(scrollContainer, {
      clientHeight: { value: 220 },
      scrollHeight: { value: 220_000 },
    });
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 22_000 } });

    await waitFor(() => expect(screen.getByText('file-1000')).toBeTruthy());

    act(() => observers[0].resize(440));

    expect(viewport.style.height).toBe('440px');
    expect(screen.getAllByRole('treeitem').length).toBeLessThan(40);
    view.unmount();

    expect(observers[0].disconnect).toHaveBeenCalledOnce();
  });

  it('deduplicates pending loads and merges children without mutating input', async () => {
    const dir = directory();
    let resolve!: (children: WorkbenchNode[]) => void;
    const onExpand = vi.fn(
      () =>
        new Promise<WorkbenchNode[]>(done => {
          resolve = done;
        }),
    );
    const onSelect = vi.fn();

    render(<FileTree nodes={[dir]} onExpand={onExpand} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('directory'));
    fireEvent.click(screen.getByText('directory'));
    fireEvent.click(screen.getByText('directory'));

    expect(onExpand).toHaveBeenCalledOnce();
    expect(onSelect).not.toHaveBeenCalled();

    await act(async () => resolve([file('child')]));

    expect(screen.getByText('child')).toBeTruthy();
    expect(dir.children).toBeUndefined();
    fireEvent.click(screen.getByText('directory'));
    fireEvent.click(screen.getByText('directory'));

    expect(onExpand).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('child'));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(file('child'));
  });

  it('caches empty directories and skips directories already loaded by the consumer', async () => {
    const empty: WorkbenchNode = {
      id: 'empty',
      name: 'empty',
      kind: 'directory',
      children: [],
    };
    const onExpand = vi.fn(async () => []);

    render(<FileTree nodes={[directory(), empty]} onExpand={onExpand} />);
    fireEvent.click(screen.getByText('empty'));

    expect(onExpand).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('directory'));

    await waitFor(() => expect(onExpand).toHaveBeenCalledOnce());
    await act(async () => {});
    fireEvent.click(screen.getByText('directory'));
    fireEvent.click(screen.getByText('directory'));

    expect(onExpand).toHaveBeenCalledOnce();
  });

  it('reports a failed load and allows retrying on the next expansion', async () => {
    const onExpand = vi
      .fn()
      .mockRejectedValueOnce(new Error('network failed'))
      .mockResolvedValueOnce([file('retried')]);

    render(<FileTree nodes={[directory()]} onExpand={onExpand} />);
    fireEvent.click(screen.getByText('directory'));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'network failed',
    );
    fireEvent.click(screen.getByText('directory'));
    fireEvent.click(screen.getByText('directory'));

    expect(await screen.findByText('retried')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onExpand).toHaveBeenCalledTimes(2);
  });

  it('routes load failures to the consumer when an error handler is provided', async () => {
    const dir = directory();
    const error = new Error('denied');
    const onError = vi.fn();

    render(
      <FileTree
        nodes={[dir]}
        onExpand={async () => {
          throw error;
        }}
        onError={onError}
      />,
    );
    fireEvent.click(screen.getByText('directory'));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledExactlyOnceWith(error, dir),
    );

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('discards old responses after the root nodes are replaced', async () => {
    let resolve!: (children: WorkbenchNode[]) => void;
    const onExpand = vi.fn(
      () =>
        new Promise<WorkbenchNode[]>(done => {
          resolve = done;
        }),
    );
    const view = render(<FileTree nodes={[directory()]} onExpand={onExpand} />);

    fireEvent.click(screen.getByText('directory'));
    view.rerender(
      <FileTree nodes={[directory(), file('new-root')]} onExpand={onExpand} />,
    );

    await act(async () => resolve([file('stale-child')]));

    expect(screen.queryByText('stale-child')).toBeNull();
    expect(screen.getByText('new-root')).toBeTruthy();
    fireEvent.click(screen.getByText('directory'));
    fireEvent.click(screen.getByText('directory'));

    expect(onExpand).toHaveBeenCalledTimes(2);
  });

  it('accepts consumer-managed children when onExpand returns void', async () => {
    const onExpand = vi.fn(async () => {});
    const view = render(<FileTree nodes={[directory()]} onExpand={onExpand} />);

    fireEvent.click(screen.getByText('directory'));

    await waitFor(() => expect(onExpand).toHaveBeenCalledOnce());
    view.rerender(
      <FileTree
        nodes={[{ ...directory(), children: [file('external-child')] }]}
        onExpand={onExpand}
      />,
    );

    expect(screen.getByText('external-child')).toBeTruthy();
    fireEvent.click(screen.getByText('directory'));
    fireEvent.click(screen.getByText('directory'));

    expect(onExpand).toHaveBeenCalledOnce();
  });

  it('supports keyboard expansion and does not activate directories', async () => {
    const onExpand = vi.fn(async () => [file('keyboard-child')]);
    const onSelect = vi.fn();

    render(
      <FileTree
        nodes={[directory()]}
        onExpand={onExpand}
        onSelect={onSelect}
      />,
    );
    fireEvent.focus(screen.getByRole('tree'));
    fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowRight' });

    expect(await screen.findByText('keyboard-child')).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('ignores file child metadata and blocks activation while loading', () => {
    const onSelect = vi.fn();

    render(
      <FileTree
        nodes={[{ ...file('file'), children: [file('invalid-child')] }]}
        loading
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText('file'));

    expect(screen.queryByText('invalid-child')).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('navigation').getAttribute('aria-busy')).toBe(
      'true',
    );
  });
});
