import { useEffect, useMemo, useState } from 'react';

import BrowserOnly from '@docusaurus/BrowserOnly';
import { FileTree, type WorkbenchNode } from '@jbpark/workbench';

import { createMemoryAdapter } from './memory-adapter';
import { renderFileIcon } from './render-file-icon';
import { sampleFiles } from './sample-files';

function FileTreePlayground() {
  const adapter = useMemo(() => createMemoryAdapter(sampleFiles), []);
  const [nodes, setNodes] = useState<WorkbenchNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<WorkbenchNode>();

  useEffect(() => {
    let cancelled = false;

    void adapter.getTree().then(root => {
      if (!cancelled) {
        setNodes(root);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [adapter]);

  return (
    <div className="demo-workbench">
      <div className="demo-workbench-frame demo-workbench-frame--short">
        <FileTree
          nodes={nodes}
          loading={isLoading}
          selectedId={selected?.id}
          renderIcon={renderFileIcon}
          onSelect={setSelected}
          onExpand={node => adapter.loadChildren(node)}
        />
      </div>
      <p className="demo-workbench-log" aria-live="polite">
        {selected ? `onSelect: ${selected.id}` : 'Select a file.'}
      </p>
    </div>
  );
}

export default function FileTreeDemo() {
  return (
    <BrowserOnly
      fallback={
        <div className="demo-workbench-frame demo-workbench-frame--short" />
      }
    >
      {() => <FileTreePlayground />}
    </BrowserOnly>
  );
}
