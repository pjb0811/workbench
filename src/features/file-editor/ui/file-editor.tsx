import { detectLanguage } from '../lib/detect-language';
import type {
  WorkbenchColorTheme,
  WorkbenchEditorLanguage,
  WorkbenchEditorRenderer,
} from '../model/editor-contract';

export interface FileEditorProps {
  /** Name of the open file. Drives language detection. */
  filename?: string;
  content: string;
  /** Overrides the language detected from `filename`. */
  language?: WorkbenchEditorLanguage;
  readOnly?: boolean;
  theme?: WorkbenchColorTheme;
  onChange: (content: string) => void;
  onSave?: (content: string) => void;
  /**
   * Renders the editor. It is called during render, so keep editor state in a
   * component it returns. `@jbpark/workbench/code-editor` provides the ui-kit
   * CodeEditor renderer.
   */
  renderEditor: WorkbenchEditorRenderer;
}

const ignoreChange = () => {};

export const FileEditor = ({
  filename,
  content,
  language,
  readOnly = false,
  theme = 'light',
  onChange,
  onSave,
  renderEditor,
}: FileEditorProps) => {
  return (
    <div data-workbench-editor data-readonly={readOnly || undefined}>
      <div data-workbench-content>
        {renderEditor({
          filename,
          content,
          language: language ?? detectLanguage(filename),
          readOnly,
          theme,
          // Read-only blocks edits and saves here as well, so a renderer that
          // ignores `readOnly` still cannot change the file.
          onChange: readOnly ? ignoreChange : onChange,
          onSave: readOnly ? undefined : onSave,
        })}
      </div>
    </div>
  );
};
