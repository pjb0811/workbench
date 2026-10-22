import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'workbench',
    {
      type: 'category',
      label: 'Building blocks',
      collapsed: false,
      items: ['file-tree', 'file-editor', 'adapters'],
    },
    'styling',
  ],
};

export default sidebars;
