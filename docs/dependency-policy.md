# Dependency and bundling policy

`workbench` ships a library bundle, so every runtime package it pulls in is a
package its consumers pay for. This document fixes where each dependency goes
and how the bundle keeps them out. It is the answer to #23 and the rule that
#9, #10, #11, #13 and #2 are expected to follow.

## The three buckets

### 1. `peerDependencies` — the consumer owns it

Packages a consumer very likely already has, or must be able to control the
version and the global wiring of. They are installed by the consumer and are
**never** part of the bundle.

| Package                | Why                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react`, `react-dom`   | A second React copy breaks hooks outright                                                                                                           |
| `monaco-editor`        | Multi-MB, and consumers routinely run their own instance. Two copies means two TypeScript language services, each with its own diagnostics settings |
| `@monaco-editor/react` | Binds to the `monaco-editor` instance above; splitting them across bundles would defeat the point                                                   |

Monaco is declared `peerDependenciesMeta.optional` when it lands (#11): the
file tree works without an editor, and a consumer that only renders the tree
should not be nagged into installing Monaco.

### 2. `dependencies` — the library owns it

Small, self-contained packages with no global state, where the consumer has no
reason to care about the exact version. The consumer's package manager dedupes
them normally.

| Package                                                    | Arrives with |
| ---------------------------------------------------------- | ------------ |
| `react-arborist`                                           | #9           |
| `react-resizable-panels`                                   | #13          |
| `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | #2           |

### 3. Not a dependency at all — the consumer supplies it

Icon data (#10) is not shipped. The tree accepts an icon renderer through
props and renders nothing by default, which is the same rule as the rest of
the library: the package ships no CSS and no visual assets, only `data-*`
attributes and structure.

This keeps `@iconify/react` and `@iconify-json/vscode-icons` out of the
dependency list entirely. The reference implementation imported
`@iconify-json/vscode-icons/icons.json` and called `addCollection` at module
scope, which is both non-tree-shakeable and a side effect on import. The demo
app (#16) is where a vscode-icons renderer gets wired up, so the default look
is still demonstrated — it is just not the library's decision.

## Keeping `external` in sync

`rollupOptions.external` is derived from `peerDependencies` in
`vite.config.ts` rather than maintained as a literal list, so adding a peer
dependency is a one-line change in `package.json` and nothing else.

Subpaths are matched by prefix, not by exact name: `react/jsx-runtime` and
`monaco-editor/esm/vs/language/typescript/ts.worker` are both external because
their package name is. A bare string list would miss them and silently inline
the worker entry points.

## No side effects at module scope

Nothing in `src/` may mutate global state as a consequence of being imported.
Concretely, that rules out writing `window.MonacoEnvironment`, calling
`loader.config({ monaco })`, or registering an icon collection at module
scope. Anything of that shape belongs in an initializer the consumer calls.

Importing a file tree must not reconfigure a consumer's existing Monaco
instance. This also makes the `sideEffects: false` declaration tracked in #28
honest rather than a lie a bundler will act on.

## Verifying a change

After adding a runtime package, check that the policy actually held:

```bash
pnpm build

# Bundle size — tens of KB, never MB.
node -e "console.log((require('fs').statSync('dist/index.js').size / 1024).toFixed(0) + ' KB')"

# Externals appear as imports, never as inlined module bodies.
node -e "console.log(require('fs').readFileSync('dist/index.js', 'utf8').match(/^import .*/gm))"

# 0 once Monaco is external and its setup is opt-in.
grep -c "MonacoEnvironment" dist/index.js
```
