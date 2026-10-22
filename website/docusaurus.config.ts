import type * as Preset from '@docusaurus/preset-classic';
import type { Config, Plugin } from '@docusaurus/types';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const dirname = path.dirname(fileURLToPath(import.meta.url));

// `@jbpark/workbench` is `link:..` (see package.json), so the demos run the
// repository's own build (`dist/`, made by `prebuild`), imported the same way
// a consumer imports the package. A linked package resolves its imports from
// its real path, the repository root, which would load the root project's
// copies of its peers (React, ui-kit, CodeMirror) next to this site's: two
// Reacts ("Invalid hook call") and two CodeMirrors whose extensions reject
// each other. Looking in this site's node_modules first sends every such
// import to this site's single copy; everything else the library uses is
// bundled into `dist/`.
const dedupePlugin = (): Plugin => ({
  name: 'resolve-linked-workbench-from-site',
  // `prepend`: Docusaurus appends plugin arrays by default, which would put
  // this lookup after the hierarchical one and never reach it.
  configureWebpack: () => ({
    mergeStrategy: { 'resolve.modules': 'prepend' },
    resolve: {
      modules: [path.resolve(dirname, 'node_modules')],
    },
  }),
});

const config: Config = {
  title: 'workbench',
  tagline:
    'A headless React file tree and editor, backed by a swappable data source adapter',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // Vercel is the deploy target (see ../vercel.json). `url` + `baseUrl` must
  // match it, since canonical <link> tags, sitemap.xml, and Open Graph URLs
  // are all derived from them.
  url: 'https://workbench-guide.vercel.app',
  baseUrl: '/',

  organizationName: 'pjb0811',
  projectName: 'workbench',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [dedupePlugin],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/pjb0811/workbench/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'workbench',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/pjb0811/workbench',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/@jbpark/workbench',
          label: 'npm',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Overview', to: '/docs/intro' },
            { label: 'Workbench', to: '/docs/workbench' },
            { label: 'Adapters', to: '/docs/adapters' },
            { label: 'Styling', to: '/docs/styling' },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/pjb0811/workbench',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/@jbpark/workbench',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} jbpark · workbench`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
