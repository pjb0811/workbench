import { useState } from 'react';

import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';
import { FileEditor, type WorkbenchEditorRenderer } from '@jbpark/workbench';

import { renderCodeEditor } from './code-editor-renderer';

// A whole editor in a few lines: the contract is enough to edit, save and
// honor read-only.
const renderTextarea: WorkbenchEditorRenderer = ({
  filename,
  content,
  readOnly,
  onChange,
  onSave,
}) => (
  <textarea
    className="demo-textarea"
    aria-label={filename}
    value={content}
    readOnly={readOnly}
    spellCheck={false}
    onChange={event => onChange(event.target.value)}
    onKeyDown={event => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        onSave?.(event.currentTarget.value);
      }
    }}
  />
);

const renderers = { codemirror: renderCodeEditor, textarea: renderTextarea };

function FileEditorPlayground() {
  const { colorMode } = useColorMode();
  const [renderer, setRenderer] =
    useState<keyof typeof renderers>('codemirror');
  const [filename, setFilename] = useState('greet.ts');
  const [content, setContent] = useState(
    'export const greet = (name: string) => `Hello, ${name}!`;\n',
  );
  const [readOnly, setReadOnly] = useState(false);
  const [saved, setSaved] = useState<string>();

  return (
    <div className="demo-workbench">
      <div className="demo-workbench-controls">
        <label>
          Renderer{' '}
          <select
            value={renderer}
            onChange={event =>
              setRenderer(event.target.value as keyof typeof renderers)
            }
          >
            <option value="codemirror">codeEditorRenderer (ui-kit)</option>
            <option value="textarea">Custom textarea</option>
          </select>
        </label>
        <label>
          Filename{' '}
          <select
            value={filename}
            onChange={event => setFilename(event.target.value)}
          >
            <option>greet.ts</option>
            <option>notes.md</option>
            <option>config.json</option>
            <option>Makefile</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={readOnly}
            onChange={event => setReadOnly(event.target.checked)}
          />{' '}
          Read-only
        </label>
      </div>
      <div className="demo-workbench-frame demo-workbench-frame--short">
        <FileEditor
          key={renderer}
          filename={filename}
          content={content}
          readOnly={readOnly}
          theme={colorMode}
          onChange={setContent}
          onSave={text => setSaved(`onSave: ${text.length} characters`)}
          renderEditor={renderers[renderer]}
        />
      </div>
      <p className="demo-workbench-log" aria-live="polite">
        {saved ?? 'Press Ctrl+S (Cmd+S on macOS) in the editor to save.'}
      </p>
    </div>
  );
}

export default function FileEditorDemo() {
  return (
    <BrowserOnly
      fallback={
        <div className="demo-workbench-frame demo-workbench-frame--short" />
      }
    >
      {() => <FileEditorPlayground />}
    </BrowserOnly>
  );
}
