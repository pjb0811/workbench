## Development

Use the Node version in `.nvmrc` and pnpm.

| Command            | Use                                             |
| ------------------ | ----------------------------------------------- |
| `pnpm dev`         | Run the demo in `demo/` with Vite               |
| `pnpm build`       | Build the library bundle and types into `dist/` |
| `pnpm check-types` | Type-check every project (`tsc -b`)             |
| `pnpm lint`        | ESLint with no warnings allowed                 |

The pre-commit hook runs `lint-staged`.

## Structure

`src/` follows Feature-Sliced Design layers: `widgets` → `features` → `entities` → `shared`. A layer imports only itself and the layers below it, and only through the target slice's `index.ts` barrel. `eslint-plugin-boundaries` enforces this in `eslint.config.ts`.

## Dependencies

Where a runtime package goes (`peerDependencies`, `dependencies`, or not a dependency at all) and how the bundle keeps it out is fixed in `docs/dependency-policy.md`. Read it before adding a package.

## Comments

Write comments for someone reading the code now: say what the code does first, give a reason only when the code alone would invite the wrong change (as a present-tense constraint), and replace history with an issue number such as `(#N)`. The full rules and examples are in section "C. 주석 작성" of the shared `coding-style` skill.

## Shared skills

Procedures shared by every pjb0811 repository are global Claude Code skills in the private repository `pjb0811/skills`. Agents that can't read them follow the summaries in this file.

| Skill                                 | Use                                                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `commit`, `pr`, `issue`               | Commit messages, PR and issue bodies                                                            |
| `coding-style`                        | Conventions, renames, comments (C), boolean names (D), braces (E), subcomponent file layout (F) |
| `changesets-release`, `publish-check` | Release flow and pre-release checks                                                             |
| `shared-library-first`                | Reusable UI goes to ui-kit and hooks to use-hooks first                                         |
| `ref-verification`                    | Read repository state from git refs, not the worktree                                           |

### Commit messages

- `type(scope): summary`: English imperative, lowercase start, no period, no gitmoji.
- Add a scope only when the change stays in one area. Never use the branch name.
- A breaking change puts `!` after the type or scope (`refactor(api)!: …`).
- The body is `-` bullets saying concretely what changed; for a breaking change, what breaks and what replaces it.
- No trailers such as `Co-Authored-By`.
