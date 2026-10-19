import vscodeIcons from '@iconify-json/vscode-icons/icons.json';
import { Icon, addCollection } from '@iconify/react';

import type { FileTreeIconRenderer } from '@/index';

// The library ships no icons (docs/dependency-policy.md); the demo maps names
// to a few VSCode icons and registers only those, offline.
const byExtension: Record<string, string> = {
  ts: 'file-type-typescript',
  tsx: 'file-type-reactts',
  js: 'file-type-js',
  jsx: 'file-type-reactjs',
  json: 'file-type-json',
  md: 'file-type-markdown',
  css: 'file-type-css',
  html: 'file-type-html',
  yaml: 'file-type-yaml',
  yml: 'file-type-yaml',
  txt: 'file-type-text',
};

const used = [
  'default-file',
  'default-folder',
  'default-folder-opened',
  'folder-type-src',
  'folder-type-src-opened',
  ...new Set(Object.values(byExtension)),
];

addCollection({
  prefix: 'vscode-icons',
  width: vscodeIcons.width,
  height: vscodeIcons.height,
  icons: Object.fromEntries(
    used.map(name => [
      name,
      vscodeIcons.icons[name as keyof typeof vscodeIcons.icons],
    ]),
  ),
});

const iconName = (name: string, kind: string, expanded: boolean) => {
  if (kind === 'directory') {
    const folder = name === 'src' ? 'folder-type-src' : 'default-folder';

    return expanded ? `${folder}-opened` : folder;
  }

  const extension = name.split('.').at(-1)?.toLowerCase() ?? '';

  return byExtension[extension] ?? 'default-file';
};

export const renderFileIcon: FileTreeIconRenderer = ({ node, expanded }) => (
  <Icon
    icon={`vscode-icons:${iconName(node.name, node.kind, expanded)}`}
    width={16}
    height={16}
  />
);
