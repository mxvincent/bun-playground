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
| [commits-and-branches.md](./commits-and-branches.md) | Language on GitHub, issues, branches, commits on a branch, squash merge, commit messages, pull requests, stacked pull requests |
| [versioning.md](./versioning.md) | Public surface, semver policy, changesets, release pipeline, Docker image versions |

## Reading the rules

- **MUST** — enforced. A violation is a review blocker; most are also caught by Biome, `tsc` or CI.
- **SHOULD** — the default. Deviating is allowed but must be justified in the pull request.
- **MAY** — explicitly permitted, no preference.

## What is enforced automatically

Biome formats and lints the files listed in `files.includes` of `biome.json`: `**/src/**`,
`**/test-helpers/**`, `packages/kubernetes/**` and `scripts/**`. TypeScript type-checks every
workspace in strict mode, and Bun runs the tests.

On every pull request, CI runs:

- `.github/workflows/code-quality.yaml`: type-checking, `biome lint` in each workspace, and the
  tests. Formatting is not checked by CI, and `scripts/` is not linted by CI because it is not a
  workspace: run `bun run format:fix` and `bunx biome check scripts/` before pushing.
- `.github/workflows/pull-request-conventions.yml`: the title, body, labels and changesets of the
  pull request. See [commits-and-branches.md](./commits-and-branches.md#pull-requests).

The `main` ruleset makes these checks required before merge. See
[commits-and-branches.md](./commits-and-branches.md#branches).

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
