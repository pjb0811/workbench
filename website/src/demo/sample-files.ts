// A small project for the demos. Paths are adapter ids.
export const sampleFiles: Record<string, string> = {
  'README.md':
    '# Sample project\n\nOpen a file from the tree, edit it, and press Ctrl+S (Cmd+S on macOS) to save.\n',
  'package.json':
    '{\n  "name": "sample-project",\n  "private": true,\n  "type": "module"\n}\n',
  'src/index.ts':
    "export { greet } from './greet';\nexport { App } from './app';\n",
  'src/greet.ts': 'export const greet = (name: string) => `Hello, ${name}!`;\n',
  'src/app.tsx':
    "import { greet } from './greet';\n\nexport const App = () => <h1>{greet('workbench')}</h1>;\n",
  'src/styles/app.css': 'h1 {\n  font-family: system-ui, sans-serif;\n}\n',
  'docs/a-file-with-a-name-long-enough-to-truncate-in-the-tree.md':
    '# Long names\n\nThe tree truncates long names with an ellipsis.\n',
  '.gitignore': 'node_modules\ndist\n',
};
