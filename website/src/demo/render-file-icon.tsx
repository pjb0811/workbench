import type { FileTreeIconRenderer } from '@jbpark/workbench';
import {
  File,
  FileCode,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react';

// Workbench ships no icons; a consumer maps names to its own. This one uses
// lucide-react, which the site already depends on.
export const renderFileIcon: FileTreeIconRenderer = ({ node, expanded }) => {
  if (node.kind === 'directory') {
    return expanded ? <FolderOpen size={14} /> : <Folder size={14} />;
  }

  const extension = node.name.split('.').at(-1);

  if (extension === 'json') {
    return <FileJson size={14} />;
  }

  if (extension === 'md') {
    return <FileText size={14} />;
  }

  if (['ts', 'tsx', 'js', 'jsx', 'css'].includes(extension ?? '')) {
    return <FileCode size={14} />;
  }

  return <File size={14} />;
};
