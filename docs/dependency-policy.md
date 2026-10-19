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

| Package                                                                                                                   | Why                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react`, `react-dom`                                                                                                      | A second React copy breaks hooks outright                                                                                                                                                                                         |
| `@jbpark/ui-kit`                                                                                                          | Provides `CodeEditor` for `workbench/code-editor` (#11). The consumer usually uses ui-kit already, and two copies would mean two `Config` contexts                                                                                |
| `@uiw/react-codemirror`, `@uiw/codemirror-theme-vscode`, `@codemirror/lang-javascript`, `@codemirror/merge`, `codemirror` | ui-kit's own optional peers for `CodeEditor`. Declared here as well because ui-kit marks them optional, so nothing else tells the consumer to install them. Two CodeMirror copies break its extensions, which compare by instance |

The React range starts at `^19.1.1` because `@jbpark/use-hooks` declares that
peer range; a lower floor would give React 19.0.x consumers a peer warning
(#48).

Every editor package is `peerDependenciesMeta.optional`: the file tree works
without an editor, and a consumer that only renders the tree or injects its own
`renderEditor` should not be asked to install them. Only the
`workbench/code-editor` entry imports them, and the main entry never imports
that one, so leaving them uninstalled breaks neither resolution nor the build.
Workbench adds no Monaco packages, workers, CDN loader or global diagnostics
settings.

Other CodeMirror language packages (`@codemirror/lang-json` and so on) are not
peers at all. A consumer that wants them installs them and passes their
extensions to `createCodeEditorRenderer`.

### 2. `dependencies` — the library owns it

Small, self-contained packages with no global state, where the consumer has no
reason to care about the exact version. The consumer's package manager dedupes
them normally.

| Package             | Arrives with |
| ------------------- | ------------ |
| `react-arborist`    | #9           |
| `@jbpark/use-hooks` | #48          |

Tab reordering (#2) uses native HTML drag and drop instead of a drag library.
`@dnd-kit` would have added about 58 kB (17 kB gzip) to the main entry for that
one interaction.

Sidebar resizing (#13) is likewise a pointer and keyboard separator in
`src/shared/lib/use-split-resize` instead of `react-resizable-panels`, which
ships 97 kB (27 kB gzip) unminified.

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
`@jbpark/ui-kit/CodeEditor` are both external because their package name is. A
bare string list would miss them and silently inline the subpath.

## No side effects at module scope

Nothing in `src/` may mutate global state as a consequence of being imported.
Concretely, that rules out configuring an editor engine globally or
registering an icon collection at module scope. Anything of that shape belongs
in an initializer the consumer calls.

Importing a file tree must not reconfigure an editor the consumer already runs.
This also makes the `sideEffects: false` declaration tracked in #28 honest
rather than a lie a bundler will act on.

## Verifying a change

After adding a runtime package, check that the policy actually held:

```bash
pnpm build

# Bundle size — tens of KB, never MB.
node -e "console.log((require('fs').statSync('dist/index.js').size / 1024).toFixed(0) + ' KB')"

# Externals appear as imports, never as inlined module bodies.
node -e "console.log(require('fs').readFileSync('dist/index.js', 'utf8').match(/^import .*/gm))"

# 0: the main entry never imports an editor peer.
grep -c -E "@jbpark/ui-kit|codemirror" dist/index.js
```

`pnpm check-declarations` also fails when `dist/index.d.ts` imports an editor
peer.
