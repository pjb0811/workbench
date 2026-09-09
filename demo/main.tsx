import { createFsAdapter } from '@/index';
import type { WorkbenchAdapter, WorkbenchNode } from '@/index';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { injectChildren } from '@/shared/lib';

// Temporary verification harness for the fs adapter (#7). The real demo — with
// adapter switching (fs · http) — lands in #16, and a proper tree/editor UI in
// #9–#12; this just proves createFsAdapter round-trips against a real folder:
// open → tree → expand → read → edit → save.
function FsDemo() {
  const [adapter, setAdapter] = useState<WorkbenchAdapter | null>(null);
  const [tree, setTree] = useState<WorkbenchNode[]>([]);
  const [openFile, setOpenFile] = useState<WorkbenchNode | null>(null);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');

  const openFolder = async () => {
    const dirHandle = await window.showDirectoryPicker();
    const next = createFsAdapter(dirHandle);
    setAdapter(next);
    setTree(await next.getTree());
    setOpenFile(null);
    setContent('');
    setStatus(`opened "${dirHandle.name}"`);
  };

  const expand = async (node: WorkbenchNode) => {
    if (!adapter) return;
    const children = await adapter.loadChildren(node);
    setTree(current => injectChildren(current, node.id, children));
  };

  const read = async (node: WorkbenchNode) => {
    if (!adapter) return;
    setOpenFile(node);
    setContent(await adapter.readFile(node));
    setStatus(`read "${node.name}"`);
  };

  const save = async () => {
    if (!adapter || !openFile) return;
    await adapter.writeFile(openFile, content);
    setStatus(`saved "${openFile.name}"`);
  };

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <button onClick={openFolder}>폴더 열기</button> <span>{status}</span>
      <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
        <ul style={{ minWidth: 240 }}>
          {tree.map(node => (
            <TreeRow
              key={node.id}
              node={node}
              onExpand={expand}
              onRead={read}
            />
          ))}
        </ul>
        {openFile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <strong>{openFile.name}</strong>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={20}
              cols={60}
            />
            <button onClick={save}>저장</button>
          </div>
        )}
      </div>
    </div>
  );
}

function TreeRow({
  node,
  onExpand,
  onRead,
}: {
  node: WorkbenchNode;
  onExpand: (node: WorkbenchNode) => void;
  onRead: (node: WorkbenchNode) => void;
}) {
  const isDirectory = node.kind === 'directory';

  return (
    <li>
      <span
        style={{ cursor: 'pointer' }}
        onClick={() => (isDirectory ? onExpand(node) : onRead(node))}
      >
        {isDirectory ? '📁' : '📄'} {node.name}
      </span>
      {node.children && node.children.length > 0 && (
        <ul style={{ paddingLeft: 16 }}>
          {node.children.map(child => (
            <TreeRow
              key={child.id}
              node={child}
              onExpand={onExpand}
              onRead={onRead}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FsDemo />
  </StrictMode>,
);
