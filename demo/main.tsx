import { StrictMode, useState } from 'react';

import { createRoot } from 'react-dom/client';

import { codeEditorRenderer } from '@/code-editor';
import { Workbench, createFsAdapter } from '@/index';
import type { WorkbenchAdapter, WorkbenchNode } from '@/index';

// Temporary harness for the Workbench widget (#12). The real demo, with
// adapter switching and styling, lands in #16.

const sampleFiles: Record<string, string> = {
  'README.md': '# Sample\n\nOpen a file from the tree and edit it.\n',
  'src/index.ts': 'export const greet = (name: string) => `Hello, ${name}`;\n',
  'src/app.tsx': 'export const App = () => <h1>Hello</h1>;\n',
};

// Keeps edits in memory so the demo works before a folder is opened.
const createSampleAdapter = (): WorkbenchAdapter => {
  const files = { ...sampleFiles };
  const toNode = (id: string): WorkbenchNode => ({
    id,
    name: id.split('/').at(-1)!,
    kind: 'file',
  });

  return {
    getTree: async () => [
      { id: 'src', name: 'src', kind: 'directory' },
      toNode('README.md'),
    ],
    loadChildren: async node =>
      Object.keys(files)
        .filter(id => id.startsWith(`${node.id}/`))
        .map(toNode),
    readFile: async node => files[node.id],
    writeFile: async (node, content) => {
      files[node.id] = content;
    },
  };
};

function Demo() {
  const [adapter, setAdapter] = useState(createSampleAdapter);
  const [readOnly, setReadOnly] = useState(false);

  const openFolder = async () => {
    setAdapter(createFsAdapter(await window.showDirectoryPicker()));
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height: '100vh',
        padding: 16,
        boxSizing: 'border-box',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={openFolder}>
          Open folder
        </button>
        <label>
          <input
            type="checkbox"
            checked={readOnly}
            onChange={event => setReadOnly(event.target.checked)}
          />{' '}
          Read-only
        </label>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <style>{`
          [data-workbench] { display: flex; gap: 16px; height: 100%; }
          [data-workbench-sidebar] { width: 240px; flex: none; }
          [data-workbench-main] {
            display: flex; flex-direction: column; gap: 8px;
            flex: 1; min-width: 0;
          }
          [data-workbench-save] { align-self: flex-start; }
          [data-workbench-error] { color: crimson; }
          [data-workbench-editor], [data-workbench-content] {
            flex: 1; min-height: 0;
          }
          [data-workbench-editor] { display: flex; border: 1px solid #ccc; }
          [data-workbench-node][data-selected] { background: #e8f0fe; }
          [data-workbench-tabs] { display: flex; gap: 2px; overflow-x: auto; }
          [data-workbench-tab] {
            display: flex; align-items: center;
            border: 1px solid #ccc; border-bottom: none; background: #f4f4f4;
          }
          [data-workbench-tab][data-active] { background: #fff; }
          [data-workbench-tab][data-dragging] { opacity: 0.5; }
          [data-workbench-tab][data-drop-target] { box-shadow: inset 2px 0 #1a73e8; }
          [data-workbench-tab] button { border: none; background: none; }
          [data-workbench-tab][data-dirty] [data-workbench-tab-name]::after {
            content: ' ●';
          }
        `}</style>
        <Workbench
          adapter={adapter}
          renderEditor={codeEditorRenderer}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
