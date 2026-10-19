import type { Plugin } from 'vite';

// Serves a small fake repository for the demo's HTTP adapter, in the shape
// `createHttpAdapter` expects:
//   GET /mock-api/tree             → root nodes
//   GET /mock-api/tree?parentId=x  → children of directory x
//   GET /mock-api/files/:id        → file text
// Ids are paths. Directories are returned without `children`, so the tree
// loads each level lazily.

const files: Record<string, string> = {
  'README.md': '# Mock repository\n\nServed by the demo dev server.\n',
  'package.json': '{\n  "name": "mock-repository",\n  "private": true\n}\n',
  'src/index.ts':
    "export { greet } from './greet';\nexport { App } from './app';\n",
  'src/greet.ts': 'export const greet = (name: string) => `Hello, ${name}`;\n',
  'src/app.tsx': 'export const App = () => <h1>Hello</h1>;\n',
  'src/styles/app.css': 'h1 {\n  color: rebeccapurple;\n}\n',
  'public/index.html': '<!doctype html>\n<div id="root"></div>\n',
  ...Object.fromEntries(
    Array.from({ length: 200 }, (_, index) => [
      `generated/file-${String(index + 1).padStart(3, '0')}.ts`,
      `export const value = ${index + 1};\n`,
    ]),
  ),
};

const childrenOf = (parent: string) => {
  const prefix = parent ? `${parent}/` : '';
  const names = new Map<string, 'file' | 'directory'>();

  for (const path of Object.keys(files)) {
    if (!path.startsWith(prefix)) {
      continue;
    }

    const [name, ...rest] = path.slice(prefix.length).split('/');

    names.set(name, rest.length > 0 ? 'directory' : 'file');
  }

  return [...names]
    .map(([name, kind]) => ({ id: `${prefix}${name}`, name, kind }))
    .sort((a, b) =>
      a.kind === b.kind
        ? a.name.localeCompare(b.name)
        : a.kind === 'directory'
          ? -1
          : 1,
    );
};

// Enough latency to show the tree's loading state.
const delay = () => new Promise(resolve => setTimeout(resolve, 150));

export const demoMockApi = (): Plugin => ({
  name: 'workbench-demo-mock-api',
  configureServer(server) {
    server.middlewares.use('/mock-api', async (req, res, next) => {
      const url = new URL(req.url ?? '/', 'http://localhost');

      await delay();

      if (url.pathname === '/tree') {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify(childrenOf(url.searchParams.get('parentId') ?? '')),
        );

        return;
      }

      if (url.pathname.startsWith('/files/')) {
        const id = decodeURIComponent(url.pathname.slice('/files/'.length));

        if (!(id in files)) {
          res.statusCode = 404;
          res.end();

          return;
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(files[id]);

        return;
      }

      next();
    });
  },
});
