import { StrictMode, useState } from 'react';

import { createRoot } from 'react-dom/client';

import { codeEditorRenderer } from '@/code-editor';
import {
  Workbench,
  type WorkbenchAdapter,
  type WorkbenchColorTheme,
  createFsAdapter,
  createHttpAdapter,
} from '@/index';

import { renderFileIcon } from './file-icon';
import './style.css';

// Uses only the package entries (`@/index`, `@/code-editor`), the same API a
// consumer imports.

interface Connection {
  adapter: WorkbenchAdapter;
  label: string;
  /** The source cannot be written, so the widget opens read-only. */
  readOnly: boolean;
}

const canOpenFolder =
  typeof window !== 'undefined' && 'showDirectoryPicker' in window;

// Served by scripts/demo-mock-api.ts on the dev server.
const connectMockHttp = (): Connection => ({
  adapter: createHttpAdapter({
    treeUrl: '/mock-api/tree',
    fileUrl: '/mock-api/files/{id}',
  }),
  label: 'HTTP (mock)',
  readOnly: true,
});

function Demo() {
  const [connection, setConnection] = useState<Connection>();
  const [colorTheme, setColorTheme] = useState<WorkbenchColorTheme>('dark');
  const [error, setError] = useState<string>();

  const openFolder = async () => {
    setError(undefined);

    try {
      const directory = await window.showDirectoryPicker({ mode: 'readwrite' });

      setConnection({
        adapter: createFsAdapter(directory),
        label: `Local folder: ${directory.name}`,
        readOnly: false,
      });
    } catch (reason) {
      // Closing the picker rejects with AbortError; that is not an error.
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
        setError(reason instanceof Error ? reason.message : String(reason));
      }
    }
  };

  return (
    <div className="demo" data-theme={colorTheme}>
      <header className="demo-header">
        <strong>workbench demo</strong>
        {connection && (
          <>
            <span className="demo-badge">
              {connection.label}
              {connection.readOnly && ' · read-only'}
            </span>
            <button
              type="button"
              className="demo-button"
              onClick={() => setConnection(undefined)}
            >
              Close
            </button>
          </>
        )}
        <span className="demo-header-spacer" />
        <button
          type="button"
          className="demo-button"
          onClick={() =>
            setColorTheme(theme => (theme === 'dark' ? 'light' : 'dark'))
          }
        >
          {colorTheme === 'dark' ? 'Light theme' : 'Dark theme'}
        </button>
      </header>
      {connection ? (
        <main className="demo-body">
          <Workbench
            adapter={connection.adapter}
            renderEditor={codeEditorRenderer}
            renderIcon={renderFileIcon}
            readOnly={connection.readOnly}
            colorTheme={colorTheme}
          />
        </main>
      ) : (
        <main className="demo-start">
          <button
            type="button"
            className="demo-button"
            disabled={!canOpenFolder}
            onClick={() => void openFolder()}
          >
            Open local folder
          </button>
          {!canOpenFolder && (
            <p>
              The File System Access API is only available in Chromium-based
              browsers, on HTTPS or localhost.
            </p>
          )}
          <button
            type="button"
            className="demo-button"
            onClick={() => setConnection(connectMockHttp())}
          >
            HTTP adapter (mock)
          </button>
          {error && <p role="alert">{error}</p>}
        </main>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
