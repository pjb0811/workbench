import { useEffect, useId, useRef, useState } from 'react';

import {
  FileEditor,
  type WorkbenchColorTheme,
  type WorkbenchEditorRenderer,
} from '@/features/file-editor';
import { FileTree, type FileTreeIconRenderer } from '@/features/file-tree';

import type { WorkbenchAdapter } from '@/entities/adapter';
import type { WorkbenchNode } from '@/entities/node';

import { useSplitResize } from '@/shared/lib';

import { type OpenTab, closeTab, isDirty, moveTab } from '../model/open-tabs';
import { FileTabs } from './file-tabs';

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
  /** Renders decorative tree and tab icons. None are provided by default. */
  renderIcon?: FileTreeIconRenderer;
  /**
   * Exposed as `data-theme` on the root for consumer CSS, and passed to the
   * editor renderer as `theme`. Defaults to `'dark'`.
   */
  colorTheme?: WorkbenchColorTheme;
}

// Everything that belongs to one adapter. Responses from a replaced adapter
// are dropped by comparing `adapter` before applying them.
interface Session {
  adapter: WorkbenchAdapter;
  nodes: WorkbenchNode[];
  treeLoading: boolean;
  openingId?: string;
  tabs: OpenTab[];
  activeTabId?: string;
  /** Ids of the tabs whose save is in flight. */
  savingIds: string[];
  error?: string;
}

const createSession = (adapter: WorkbenchAdapter): Session => ({
  adapter,
  nodes: [],
  treeLoading: true,
  tabs: [],
  savingIds: [],
});

// Sidebar width limits, in percent of the widget width.
const SIDEBAR_SIZE = { defaultSize: 20, minSize: 15, maxSize: 50 };

const toMessage = (reason: unknown) =>
  reason instanceof Error ? reason.message : String(reason);

export const Workbench = ({
  adapter,
  renderEditor,
  readOnly = false,
  renderIcon,
  colorTheme = 'dark',
}: WorkbenchProps) => {
  const [session, setSession] = useState(() => createSession(adapter));
  const savingRef = useRef(new Set<string>());
  const sidebarId = useId();
  const sidebar = useSplitResize(SIDEBAR_SIZE);

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
    // An open file is only activated; its tab keeps the unsaved edits.
    if (session.tabs.some(tab => tab.node.id === node.id)) {
      setSession(current => ({
        ...current,
        openingId: undefined,
        activeTabId: node.id,
        error: undefined,
      }));

      return;
    }

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
              activeTabId: node.id,
              tabs: current.tabs.some(tab => tab.node.id === node.id)
                ? current.tabs
                : [...current.tabs, { node, content, savedContent: content }],
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

  const updateTab = (
    current: Session,
    id: string,
    change: (tab: OpenTab) => OpenTab,
  ): Session => ({
    ...current,
    tabs: current.tabs.map(tab => (tab.node.id === id ? change(tab) : tab)),
  });

  const changeContent = (id: string, content: string) => {
    if (readOnly) {
      return;
    }

    setSession(current => updateTab(current, id, tab => ({ ...tab, content })));
  };

  // The save button and the editor's save shortcut both land here; the
  // shortcut passes the editor's latest text. Saves are keyed by tab, so
  // switching tabs mid-save still marks the right file as saved.
  const save = async (id: string, content: string) => {
    const tab = session.tabs.find(item => item.node.id === id);

    if (
      readOnly ||
      !tab ||
      savingRef.current.has(id) ||
      content === tab.savedContent
    ) {
      return;
    }

    const withoutSaving = (current: Session) =>
      current.savingIds.filter(savingId => savingId !== id);

    savingRef.current.add(id);
    setSession(current => ({
      ...current,
      savingIds: [...current.savingIds, id],
      error: undefined,
    }));

    try {
      await adapter.writeFile(tab.node, content);

      update(adapter, current => ({
        ...updateTab(current, id, saved => ({
          ...saved,
          savedContent: content,
        })),
        savingIds: withoutSaving(current),
      }));
    } catch (reason) {
      update(adapter, current => ({
        ...current,
        savingIds: withoutSaving(current),
        error: toMessage(reason),
      }));
    } finally {
      savingRef.current.delete(id);
    }
  };

  const { tabs, activeTabId, error } = session;
  const activeTab = tabs.find(tab => tab.node.id === activeTabId);
  const isActiveDirty = activeTab !== undefined && isDirty(activeTab);

  return (
    <div
      ref={sidebar.containerRef}
      data-workbench
      data-theme={colorTheme}
      data-readonly={readOnly || undefined}
      data-resizing={sidebar.isResizing || undefined}
    >
      <div
        id={sidebarId}
        data-workbench-sidebar
        // The width is the resize state itself, so it is set here rather than
        // left to consumer CSS.
        style={{ width: `${sidebar.size}%`, flexShrink: 0 }}
      >
        <FileTree
          nodes={session.nodes}
          selectedId={session.openingId ?? activeTabId}
          loading={session.treeLoading}
          renderIcon={renderIcon}
          onSelect={node => void openFile(node)}
          onExpand={node => adapter.loadChildren(node)}
          onError={reason =>
            setSession(current => ({ ...current, error: reason.message }))
          }
        />
      </div>
      <div
        {...sidebar.separatorProps}
        aria-label="Resize file tree"
        aria-controls={sidebarId}
        data-workbench-resize-handle
        data-dragging={sidebar.isResizing || undefined}
        // Without it, a touch drag scrolls the page instead of resizing.
        style={{ touchAction: 'none' }}
      />
      <div data-workbench-main aria-busy={session.openingId !== undefined}>
        {tabs.length > 0 && (
          <FileTabs
            tabs={tabs.map(tab => ({
              node: tab.node,
              dirty: !readOnly && isDirty(tab),
            }))}
            activeTabId={activeTabId}
            renderIcon={renderIcon}
            onActivate={id =>
              setSession(current => ({ ...current, activeTabId: id }))
            }
            onClose={id =>
              setSession(current => ({
                ...current,
                ...closeTab(current.tabs, current.activeTabId, id),
              }))
            }
            onReorder={(fromId, toId) =>
              setSession(current => ({
                ...current,
                tabs: moveTab(current.tabs, fromId, toId),
              }))
            }
          />
        )}
        {!readOnly && activeTab && (
          <button
            type="button"
            data-workbench-save
            data-dirty={isActiveDirty || undefined}
            disabled={
              !isActiveDirty || session.savingIds.includes(activeTab.node.id)
            }
            onClick={() => void save(activeTab.node.id, activeTab.content)}
          >
            Save
          </button>
        )}
        {error && (
          <div role="alert" data-workbench-error>
            {error}
          </div>
        )}
        {activeTab ? (
          <FileEditor
            // A new editor per tab, so undo history never crosses files.
            key={activeTab.node.id}
            filename={activeTab.node.name}
            content={activeTab.content}
            readOnly={readOnly}
            theme={colorTheme}
            onChange={content => changeContent(activeTab.node.id, content)}
            onSave={content => void save(activeTab.node.id, content)}
            renderEditor={renderEditor}
          />
        ) : (
          <div data-workbench-empty>Select a file to open it.</div>
        )}
      </div>
    </div>
  );
};
