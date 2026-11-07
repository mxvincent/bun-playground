# Commits and branches

The unit of work is a **GitHub issue**. One issue produces one branch, one commit and one pull
request. When a feature is too large for that, it is split into several issues whose branches form a
**stack**.

The tooling is `git` and the GitHub CLI. Nothing else — no Graphite, no custom wrapper.

```bash
gh extension install github/gh-stack
git config rerere.enabled true   # remember conflict resolutions across rebases
```

## Issues

- Every change MUST have an issue, opened before the branch. This includes fixes and chores; the
  issue is the unit of traceability, not a formality reserved for features.
- An issue MUST describe one task, sized so that its resolution fits in a single commit. If the
  description needs the word "and" to hold together, it is two issues.
- The title MUST state the outcome, not the implementation: *Cursor pagination drops rows with a
  null sort value*, not *Fix pagination*.
- A feature that cannot fit in one commit MUST be decomposed into an ordered set of issues, one per
  reviewable layer, before any code is written. See [Stacks](#stacks).

## Branches

- A branch MUST be created from an up-to-date `main`:
  ```bash
  git fetch origin
  git switch -c 42-cursor-null-sort-values origin/main
  ```
- A branch name MUST be `<issue-number>-<slug>`, where the slug is a short `kebab-case` summary of
  the issue. This is the name GitHub itself proposes from an issue.
  ✅ `42-cursor-null-sort-values`, `57-rate-limiting-rules-api`
  ❌ `fix/pagination`, `max/wip`, `patch-1`
- A branch MUST carry exactly one issue's worth of work. Unrelated fixes noticed along the way get
  their own issue and their own branch.
- `main` is protected. It MUST NOT be pushed to directly, and MUST NOT be force-pushed under any
  circumstance.
- `main` MUST NOT be merged into a branch. Rebase instead:
  ```bash
  git fetch origin && git rebase origin/main
  ```

## One commit per branch

A branch MUST contain exactly one commit at all times, including while the work is in progress. New
work on the branch amends that commit rather than adding to it.

```bash
git fetch origin
git status                          # check the state of the working tree and the branch
git rebase --autostash origin/main
git add -A
git commit --amend --no-edit        # or --amend to revise the message
git push --force-with-lease
```

- Before every commit and every push, the branch MUST be rebased on an up-to-date `origin/main`, and
  the state of the repository MUST be checked: working tree, commits ahead and behind `origin/main`,
  and open pull requests that touch the same files. A conflict is resolved locally, never discovered
  on the pull request.
- `--force-with-lease` MUST be used instead of `--force`. It refuses to overwrite commits pushed by
  someone else in the meantime.
- Force-pushing a feature branch is expected and normal here. Force-pushing `main` is never
  acceptable.
- If a branch has accumulated several commits, squash before opening the pull request:
  ```bash
  git reset --soft origin/main && git commit
  ```

The single commit is the reason review is legible: the pull request diff, the commit diff and the
change that lands on `main` are the same object.

## Commit messages

Commits MUST follow [Conventional Commits](https://www.conventionalcommits.org/). `commitlint`
enforces the format.

```
<type>(<scope>): <subject>

<body>

Closes #<issue>
```

### Type

| Type | Use for |
| --- | --- |
| `feat` | A new capability |
| `fix` | A behaviour correction |
| `refactor` | A change that alters no observable behaviour |
| `perf` | A change made for performance, with a measurable effect |
| `test` | Adding or reworking tests only |
| `docs` | Documentation only |
| `build` | Build tooling, Docker, CI, dependencies |
| `chore` | Everything else, and nothing a reader of the changelog cares about |
| `release` | Reserved for the automated release commit. MUST NOT be used by hand |

### Scope

- The scope MUST be the workspace directory name, without its npm scope prefix:
  `fix(typeorm):`, `fix(query-params):`, `feat(account):`.
- The scope MUST be omitted when a change spans several workspaces or touches the repository root.
- The scope MAY be a subsystem name for changes that are not workspace-shaped: `fix(changeset):`.

### Subject

- Imperative mood, lower case, no trailing period, under 72 characters.
  ✅ `refactor(typeorm): move sort from constructor to getPage`
  ❌ `Moved sort`, `moves sort.`, `fix stuff`
- The body SHOULD explain *why* when the reason is not evident from the diff. It is the only place
  that survives in `main`'s history — pull request comments do not.

### Footer

- The commit MUST end with `Closes #<issue>`, referencing the issue it resolves.
- Because branches are merged by rebase, this commit lands verbatim on `main` and GitHub closes the
  issue at that moment. The keyword in the commit is the source of truth; `gh stack submit` carries
  it into the generated pull request body, where a reader sees it before the merge.
- In a stack, an upper pull request targets its parent branch rather than `main`, so its keyword
  does nothing on its own. Merging bottom to top — which `gh stack merge` enforces — retargets each
  pull request onto `main` as the one below it lands, and each issue closes in turn.

## Pull requests

- One pull request per branch, therefore one per issue.
- The title MUST be the commit subject, unchanged.
- The person who opens the pull request MUST assign themselves to it. The assignee is the owner who
  takes it to merge.
- `.github/workflows/pull-request.yml` runs type-checking, linting and the full test suite against
  Postgres and RabbitMQ. All three MUST be green before merge.
- A pull request that changes a versioned workspace MUST include a changeset. See
  [versioning.md](./versioning.md).

```bash
gh pr create --fill --base main --assignee @me   # single branch
gh stack submit --auto                           # stack: pushes every branch, opens draft PRs
gh stack submit --auto --open                    # same, ready for review instead of draft
```

`gh stack` generates pull request titles and bodies. Adjust them afterwards with `gh pr edit`.
`gh stack submit` does not set an assignee: add it with `gh pr edit <pr> --add-assignee @me`.

## Merging

**Rebase is the default.** A branch holds exactly one commit, so rebasing lands it on `main`
unchanged: the reviewed diff and the merged commit are the same object, and `main`'s history stays a
linear sequence of single-commit changes, each traceable to an issue.

```bash
gh pr merge <pr> --rebase             # single branch
gh stack merge <pr> --yes --rebase    # that PR and every unmerged PR below it
```

`gh stack merge` is all-or-nothing: if any pull request in the selected set cannot merge, none do.

**Squash is kept enabled as a fallback**, for two cases and no others:

1. **A branch that reached review with more than one commit.** The fix is to squash locally
   (`git reset --soft origin/main && git commit`); squash-merging is the escape hatch when that did
   not happen.
2. **Collapsing an entire stack into one change**, when the layers only ever made sense together and
   splitting the history on `main` buys nothing. Retarget the top pull request onto `main` and
   squash it — its diff then covers every layer below:
   ```bash
   gh pr edit <top-pr> --base main
   gh pr merge <top-pr> --squash
   ```

Merge commits are disabled at the repository level and MUST NOT be re-enabled.

### Consequences of a squash

- The squash commit is a **new** commit; the branch's originals never reach `main`. Any stack layer
  above it is now based on commits that no longer exist upstream. `gh stack sync` detects exactly
  this, rebases with `--onto` against the right target and skips the merged branch — run it before
  touching the stack again. No manual fix-up is needed.
- A squash message is composed by GitHub from the commits it absorbs. When collapsing a stack, that
  message MUST carry the `Closes #<issue>` line of **every** layer it absorbs, otherwise those
  issues stay open. Check the message in the merge dialog before confirming.
- The lower pull requests of a collapsed stack do not close by themselves — what landed no longer
  matches their commits — and MUST be closed by hand once the squash is merged.

## Stacks

A stack is an ordered chain of branches rooted on `main`, each based on the one below, each with its
own pull request. A reviewer sees only that layer's diff.

```
(main) <- 42-domain-schemas <- 43-repository <- 44-endpoints
```

Left is the bottom and merges first; right is the top.

### When to use one

- Use a stack when a feature is too large for one reviewable commit. Splitting is the norm for
  anything crossing more than one workspace.
- Do NOT build everything on one branch and split it afterwards. Decompose into issues first, then
  create the layers as you go.
- A layer MUST be one dependent concern, and each layer MUST leave the repository green — type-check
  and tests pass at every level. Foundational work goes at the bottom: domain types, then
  persistence, then the endpoint that exposes it.
- Stacks are strictly linear. Parallel work belongs in separate stacks.

### Working in a stack

```bash
gh stack init 42-domain-schemas    # create the stack, check out its branch
git add -A && git commit -m "feat(account): add organization member schema

Closes #42"
gh stack add 43-repository         # next layer, branched from the current one
git add -A && git commit -m "..."
gh stack submit --auto
gh stack view --json               # inspect state; plain `view` opens a TUI
```

- To change a lower layer, check it out first — a lower layer's concern MUST NOT be committed on the
  branch above it:
  ```bash
  gh stack checkout 42-domain-schemas
  git add -A && git commit --amend --no-edit
  gh stack rebase --upstack          # replay every branch above onto the change
  gh stack top
  gh stack push
  ```
- Resynchronise with GitHub before resuming work on an existing stack:
  ```bash
  gh stack sync            # fetch, rebase, push, refresh PR state
  gh stack sync --prune    # also drop local branches whose PR has merged
  ```
- On a rebase conflict, resolve the files, `git add` them, then `gh stack rebase --continue`.
  `gh stack rebase --abort` restores the stack. With `rerere.enabled`, a conflict resolved once is
  replayed automatically on later rebases.
