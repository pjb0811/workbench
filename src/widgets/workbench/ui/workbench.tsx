import { useEffect, useRef, useState } from 'react';

import {
  FileEditor,
  type WorkbenchEditorRenderer,
} from '@/features/file-editor';
import { FileTree, type FileTreeIconRenderer } from '@/features/file-tree';

import type { WorkbenchAdapter } from '@/entities/adapter';
import type { WorkbenchNode } from '@/entities/node';

export interface WorkbenchProps {
  /** Data source for the tree and the files. Replacing it reloads the tree. */
  adapter: WorkbenchAdapter;
  /**
   * Renders the editor. `workbench/code-editor` provides the ui-kit
   * CodeEditor renderer.
   */
  renderEditor: WorkbenchEditorRenderer;
  /**
   * Opens files without accepting edits: no save button is rendered and
   * `adapter.writeFile` is never called.
   */
  readOnly?: boolean;
  /** Renders decorative tree icons. None are provided by default. */
  renderIcon?: FileTreeIconRenderer;
}

interface OpenFile {
  node: WorkbenchNode;
  content: string;
  savedContent: string;
}

// Everything that belongs to one adapter. Responses from a replaced adapter
// are dropped by comparing `adapter` before applying them.
interface Session {
  adapter: WorkbenchAdapter;
  nodes: WorkbenchNode[];
  treeLoading: boolean;
  openingId?: string;
  file?: OpenFile;
  saving: boolean;
  error?: string;
}

const createSession = (adapter: WorkbenchAdapter): Session => ({
  adapter,
  nodes: [],
  treeLoading: true,
  saving: false,
});

const toMessage = (reason: unknown) =>
  reason instanceof Error ? reason.message : String(reason);

export const Workbench = ({
  adapter,
  renderEditor,
  readOnly = false,
  renderIcon,
}: WorkbenchProps) => {
  const [session, setSession] = useState(() => createSession(adapter));
  const savingRef = useRef(false);

  if (session.adapter !== adapter) {
    setSession(createSession(adapter));
  }

  // Applies an update only while `requested` is still the current adapter.
  const update = (
    requested: WorkbenchAdapter,
    change: (current: Session) => Session,
  ) => {
    setSession(current =>
      current.adapter === requested ? change(current) : current,
    );
  };

  useEffect(() => {
    let cancelled = false;

    // `cancelled` drops a response that arrives after the adapter was
    // replaced or the widget unmounted.
    adapter.getTree().then(
      nodes => {
        if (!cancelled) {
          setSession(current => ({ ...current, nodes, treeLoading: false }));
        }
      },
      (reason: unknown) => {
        if (!cancelled) {
          setSession(current => ({
            ...current,
            treeLoading: false,
            error: toMessage(reason),
          }));
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [adapter]);

  const openFile = async (node: WorkbenchNode) => {
    setSession(current => ({
      ...current,
      openingId: node.id,
      error: undefined,
    }));

    // Only the most recent selection may land, so a slow read cannot replace
    // a file the user opened after it.
    const isLatest = (current: Session) => current.openingId === node.id;

    try {
      const content = await adapter.readFile(node);

      update(adapter, current =>
        isLatest(current)
          ? {
              ...current,
              openingId: undefined,
              file: { node, content, savedContent: content },
            }
          : current,
      );
    } catch (reason) {
      update(adapter, current =>
        isLatest(current)
          ? { ...current, openingId: undefined, error: toMessage(reason) }
          : current,
      );
    }
  };

  const changeContent = (content: string) => {
    if (readOnly) {
      return;
    }

    setSession(current =>
      current.file
        ? { ...current, file: { ...current.file, content } }
        : current,
    );
  };

  // The save button and the editor's save shortcut both land here; the
  // shortcut passes the editor's latest text.
  const save = async (content: string) => {
    const file = session.file;

    if (
      readOnly ||
      !file ||
      savingRef.current ||
      content === file.savedContent
    ) {
      return;
    }

    const { node } = file;
    const isSameFile = (current: Session) => current.file?.node.id === node.id;

    savingRef.current = true;
    setSession(current => ({ ...current, saving: true, error: undefined }));

    try {
      await adapter.writeFile(node, content);

      update(adapter, current => ({
        ...current,
        saving: false,
        file:
          current.file && isSameFile(current)
            ? { ...current.file, savedContent: content }
            : current.file,
      }));
    } catch (reason) {
      update(adapter, current => ({
        ...current,
        saving: false,
        error: toMessage(reason),
      }));
    } finally {
      savingRef.current = false;
    }
  };

  const { file, error } = session;
  const isDirty = file !== undefined && file.content !== file.savedContent;

  return (
    <div data-workbench data-readonly={readOnly || undefined}>
      <div data-workbench-sidebar>
        <FileTree
          nodes={session.nodes}
          selectedId={session.openingId ?? file?.node.id}
          loading={session.treeLoading}
          renderIcon={renderIcon}
          onSelect={node => void openFile(node)}
          onExpand={node => adapter.loadChildren(node)}
          onError={reason =>
            setSession(current => ({ ...current, error: reason.message }))
          }
        />
      </div>
      <div data-workbench-main aria-busy={session.openingId !== undefined}>
        {!readOnly && file && (
          <button
            type="button"
            data-workbench-save
            data-dirty={isDirty || undefined}
            disabled={!isDirty || session.saving}
            onClick={() => void save(file.content)}
          >
            Save
          </button>
        )}
        {error && (
          <div role="alert" data-workbench-error>
            {error}
          </div>
        )}
        {file ? (
          <FileEditor
            // A new editor per file, so undo history never crosses files.
            key={file.node.id}
            filename={file.node.name}
            content={file.content}
            readOnly={readOnly}
            onChange={changeContent}
            onSave={content => void save(content)}
            renderEditor={renderEditor}
          />
        ) : (
          <div data-workbench-empty>Select a file to open it.</div>
        )}
      </div>
    </div>
  );
};
