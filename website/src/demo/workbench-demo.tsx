import { useRef, useState } from 'react';

import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';
import { Workbench } from '@jbpark/workbench';

import { renderCodeEditor } from './code-editor-renderer';
import { createMemoryAdapter } from './memory-adapter';
import { renderFileIcon } from './render-file-icon';
import { sampleFiles } from './sample-files';

function WorkbenchPlayground() {
  const { colorMode } = useColorMode();
  const [readOnly, setReadOnly] = useState(false);
  const [failWrites, setFailWrites] = useState(false);
  const [lastWrite, setLastWrite] = useState<string>();
  // Read when a save runs, so toggling "Fail saves" applies to the next save.
  const failWritesRef = useRef(false);

  const createAdapter = () =>
    createMemoryAdapter(sampleFiles, {
      failWrites: () => failWritesRef.current,
      onWrite: path => setLastWrite(`Saved ${path}`),
    });

  // A new adapter resets the widget, which is what "Reset" relies on.
  const [adapter, setAdapter] = useState(createAdapter);

  return (
    <div className="demo-workbench">
      <div className="demo-workbench-controls">
        <label>
          <input
            type="checkbox"
            checked={readOnly}
            onChange={event => setReadOnly(event.target.checked)}
          />{' '}
          Read-only
        </label>
        <label>
          <input
            type="checkbox"
            checked={failWrites}
            onChange={event => {
              failWritesRef.current = event.target.checked;
              setFailWrites(event.target.checked);
            }}
          />{' '}
          Fail saves
        </label>
        <button
          type="button"
          onClick={() => {
            setLastWrite(undefined);
            setAdapter(createAdapter());
          }}
        >
          Reset
        </button>
      </div>
      <div className="demo-workbench-frame">
        <Workbench
          adapter={adapter}
          renderEditor={renderCodeEditor}
          renderIcon={renderFileIcon}
          readOnly={readOnly}
          colorTheme={colorMode}
        />
      </div>
      <p className="demo-workbench-log" aria-live="polite">
        {lastWrite ?? 'Edits stay in memory and reset with the page.'}
      </p>
    </div>
  );
}

export default function WorkbenchDemo() {
  return (
    <BrowserOnly fallback={<div className="demo-workbench-frame" />}>
      {() => <WorkbenchPlayground />}
    </BrowserOnly>
  );
}
