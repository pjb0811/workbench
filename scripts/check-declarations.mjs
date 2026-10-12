import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const declarations = readFileSync(join(root, 'dist/index.d.ts'), 'utf8');
const forbidden =
  /wicg-file-system-access|\b(?:DirectoryPickerOptions|WellKnownDirectory|FileSystemHandlePermissionDescriptor)\b/;

if (forbidden.test(declarations)) {
  throw new Error(
    'Published declarations reference demo-only file system types.',
  );
}

const scratch = mkdtempSync(join(tmpdir(), 'workbench-declarations-'));

try {
  cpSync(join(root, 'dist/index.d.ts'), join(scratch, 'index.d.ts'));
  cpSync(
    join(root, 'scripts/fixtures/declarations/consumer.ts'),
    join(scratch, 'consumer.ts'),
  );

  const program = ts.createProgram([join(scratch, 'consumer.ts')], {
    target: ts.ScriptTarget.ES2022,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    types: [],
    typeRoots: [],
    paths: {
      workbench: [join(scratch, 'index.d.ts')],
      react: [
        join(
          dirname(require.resolve('@types/react/package.json')),
          'index.d.ts',
        ),
      ],
    },
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);

  if (diagnostics.length > 0) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: path => path,
        getCurrentDirectory: () => scratch,
        getNewLine: () => '\n',
      }),
    );
  }

  console.log('Consumer declarations pass with DOM types and no demo globals.');
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
