# Code conventions

These documents define how code is written in this monorepo. They are **normative**: each rule
states the target, not the current state of the repository. Where existing code diverges, the
document wins and the code is aligned when it is next touched.

## Documents

| Document | Scope |
| --- | --- |
| [workspace-structure.md](./workspace-structure.md) | Workspace categories, directory layout, `package.json`, `tsconfig.json`, path aliases, barrels |
| [naming.md](./naming.md) | Files, directories, TypeScript identifiers, reserved suffixes, database objects, HTTP endpoints, environment variables |
| [code-style.md](./code-style.md) | Formatting, TypeScript language rules, functions and classes, errors, schemas, configuration, logging |
| [testing.md](./testing.md) | Test placement, structure, helpers, database-backed tests |
| [commits-and-branches.md](./commits-and-branches.md) | Language on GitHub, issues, branches, single-commit rule, commit messages, pull requests, stacked pull requests |
| [versioning.md](./versioning.md) | Public surface, semver policy, changesets, release pipeline, Docker image versions |

## Reading the rules

- **MUST** — enforced. A violation is a review blocker; most are also caught by Biome, `tsc` or CI.
- **SHOULD** — the default. Deviating is allowed but must be justified in the pull request.
- **MAY** — explicitly permitted, no preference.

## What is enforced automatically

Everything under `**/src/**` and `**/test-helpers/**` is formatted and linted by Biome, type-checked
by TypeScript in strict mode, and tested by Bun. CI runs all three on every pull request
(`.github/workflows/code-quality.yaml`).

```bash
bun run format:fix     # apply formatting
bun run turbo:lint     # lint all workspaces
bun run turbo:typecheck
bun run turbo:test
```

Rules that a tool can check are stated here for context only — Biome and `tsc` are the source of
truth. The rules worth reading are the ones no tool can enforce: naming, layering, and structure.

## Changing a rule

Conventions are versioned with the code. Open a pull request that changes the document and the code
it affects in the same change set, so the repository never contradicts its own documentation.
