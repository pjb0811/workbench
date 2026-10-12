import { describe, expect, it } from 'vitest';

import { injectChildren } from './inject-children';

interface TestNode {
  id: string;
  children?: TestNode[];
}

describe('injectChildren', () => {
  it('replaces children without mutating the original directory', () => {
    const previous = [{ id: 'old' }];
    const directory: TestNode = { id: 'directory', children: previous };
    const children: TestNode[] = [{ id: 'new' }];
    const tree = [directory];

    const result = injectChildren(tree, directory.id, children);

    expect(result).not.toBe(tree);
    expect(result[0]).not.toBe(directory);
    expect(result[0].children).toBe(children);
    expect(directory.children).toBe(previous);
  });

  it('distinguishes loaded empty directories from unloaded directories', () => {
    const unloaded: TestNode = { id: 'unloaded' };
    const target: TestNode = { id: 'target' };

    const result = injectChildren([target, unloaded], target.id, []);

    expect(result[0].children).toEqual([]);
    expect(result[0].children).not.toBeUndefined();
    expect(result[1]).toBe(unloaded);
    expect(result[1].children).toBeUndefined();
    expect(target.children).toBeUndefined();
  });

  it('copies only ancestors of a nested target and preserves unrelated branches', () => {
    const untouchedLeaf: TestNode = { id: 'untouched-leaf' };
    const untouchedChildren = [untouchedLeaf];
    const untouched: TestNode = {
      id: 'untouched',
      children: untouchedChildren,
    };
    const sibling: TestNode = { id: 'sibling', children: [] };
    const target: TestNode = { id: 'target' };
    const parent: TestNode = { id: 'parent', children: [target, sibling] };
    const root: TestNode = { id: 'root', children: [parent] };
    const children: TestNode[] = [{ id: 'loaded-child' }];

    const result = injectChildren([root, untouched], target.id, children);
    const nextParent = result[0].children![0];

    expect(result[0]).not.toBe(root);
    expect(nextParent).not.toBe(parent);
    expect(nextParent.children![0]).not.toBe(target);
    expect(nextParent.children![0].children).toBe(children);
    expect(nextParent.children![1]).toBe(sibling);
    expect(result[1]).toBe(untouched);
    expect(result[1].children).toBe(untouchedChildren);
    expect(result[1].children![0]).toBe(untouchedLeaf);
    expect(target.children).toBeUndefined();
  });

  it('preserves every node reference when the target is absent', () => {
    const child: TestNode = { id: 'child', children: [] };
    const root: TestNode = { id: 'root', children: [child] };
    const tree = [root];

    const result = injectChildren(tree, 'missing', [{ id: 'new' }]);

    expect(result).toEqual(tree);
    expect(result[0]).toBe(root);
    expect(result[0].children).toBe(root.children);
    expect(result[0].children![0]).toBe(child);
  });

  it('handles an empty tree', () => {
    expect(injectChildren<TestNode>([], 'missing', [])).toEqual([]);
  });
});
