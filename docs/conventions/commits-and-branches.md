# Commits and branches

The unit of work is a **GitHub issue**. One issue produces one branch, one pull request and, once
squash-merged, one commit on `main`. When a subject is too large for that, a parent issue documents
it, and it is split into **sub-issues** whose branches form a **stack** when they depend on each
other.

The tooling is `git`, the GitHub CLI and its `gh stack` extension. Nothing else, no custom wrapper.

```bash
gh extension install github/gh-stack
git config rerere.enabled true   # remember conflict resolutions across rebases
```

## Language

Everything written on GitHub MUST be in English, with American spelling, like the code (see
[naming.md](./naming.md#language-and-spelling)): issue and pull request titles and bodies, review
comments, replies to review comments, and discussions. This holds even when the conversation that led
to the change took place in another language.

## Issues

- Every change MUST have an issue, opened before the branch. This includes fixes and chores; the
  issue is the unit of traceability, not a formality reserved for features.
- Starting a new subject MUST begin with a search of the existing issues, open and closed:
  ```bash
  gh issue list --state all --search "<keywords>"
  ```
  - An open issue documents the subject: reuse it. Do not open a duplicate.
  - Only a closed issue documents it: the work it tracked has shipped. Open a new issue that links
    to it.
  - No issue documents it: open one.
- The author of the work MUST assign themselves to the issue.
- An issue MUST describe one task, sized so that its resolution fits in a single pull request. If the
  description needs the word "and" to hold together, it is two issues.
- The title MUST state the outcome, not the implementation: *Cursor pagination drops rows with a
  null sort value*, not *Fix pagination*.
- The title MUST start with an upper case letter, unless its first word is code. Code — a function,
  a variable, a type, a path, a package — keeps its case and is written as inline code with
  backticks. The title carries no scope prefix: the `pkg/` label holds the scope.
  ✅ `` `isSort` returns false for `Sort` instances ``, `` Rename `removeUndefined` to `stripUndefinedValues` ``
  ❌ `isSort returns false for Sort instances`, `query-params: isSort returns false`, `fix sort guard`
- The issue MUST carry its labels. See [Labels](#labels).
- A subject that cannot fit in one pull request MUST be split with sub-issues, before any code is
  written:
  - The **parent issue** documents the subject as a whole: the problem, the goal, the decisions. It
    stays the reference for the topic and carries no branch of its own.
  - Each **sub-issue** is one step that fits in one pull request, with its own branch and pull
    request, and follows every rule above. Steps that depend on each other form a stack, in the
    order of the sub-issues. See [Stacks](#stacks).
  - The parent issue MUST be closed by hand once its last sub-issue is done: no commit references it.
  ```bash
  gh issue create --assignee @me --label pkg/core --title "..." --body "..."           # parent: #42
  gh issue create --assignee @me --label pkg/core --parent 42 --title "..." --body "..." # step
  gh issue edit 42 --add-sub-issue 43,44     # attach existing issues as steps
  ```

## Labels

Issues and pull requests MUST carry two kinds of labels:

- **Kind**, one or more: `bug`, `test`, `performance`, `refactor`, `documentation`, `enhancement`.
- **Scope**, one `pkg/<workspace>` label per package concerned, named after the workspace
  directory: `pkg/core`, `pkg/json-schema`, `pkg/query-params-serializer`. A change that spans
  several packages carries one label for each.

Release pull requests, and changes limited to the repository root (docs, tooling), carry no `pkg/`
label.

```bash
gh issue create --assignee @me --label bug --label pkg/core --title "..." --body "..."
gh pr edit <pr> --add-label bug --add-label pkg/core
```

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

## Commits on a branch

A branch MAY hold several commits: the work in progress, then one commit per round of review. They
never reach `main` as such, because the pull request is squash-merged into one commit (see
[Merging](#merging)). Adding a commit rather than amending lets a reviewer see what changed since
their last pass; amending stays allowed.

```bash
git add <paths>
git commit -m "fix(drizzle): roll back the levels a failing callback left open"

# before pushing
git fetch origin
git status                          # check the state of the working tree and the branch
git rebase --autostash origin/main
git push --force-with-lease
```

- The state of the repository MUST be checked at two moments: when starting work on a new subject
  (a new branch, therefore a new pull request), and before every push. Checking means: working tree,
  commits ahead and behind `origin/main`, and open pull requests that touch the same files. Before a
  push, the branch MUST also be rebased on an up-to-date `origin/main`, so a conflict is resolved
  locally, never discovered on the pull request.
- Local commits in between do not require the check.
- `--force-with-lease` MUST be used instead of `--force`. It refuses to overwrite commits pushed by
  someone else in the meantime.
- Force-pushing a feature branch after a rebase or an amend is expected and normal here.
  Force-pushing `main` is never acceptable.
- The commits of a branch SHOULD follow the [commit message](#commit-messages) format.
- The **first commit** of a branch MUST carry the subject of the pull request title, `Closes #<issue>`
  and, for a breaking change, the `BREAKING CHANGE:` footer. GitHub's atomic stack merge composes
  the squash message itself, and may build it from the commit messages rather than from the pull
  request: the first commit then still brings the issue link and the breaking change to `main`.

## Commit messages

The commit that lands on `main` MUST follow
[Conventional Commits](https://www.conventionalcommits.org/). A squash merge builds it from the pull
request: its title becomes the subject and its body the commit body (the repository sets
`squash_merge_commit_title` to `PR_TITLE` and `squash_merge_commit_message` to `PR_BODY`). The rules
below therefore apply to the pull request title and body, and SHOULD apply to the commits of the
branch too.

```
<type>(<scope>): <subject>

Closes #<issue>

<body>

BREAKING CHANGE: <description>   # only for a breaking change
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

### Issue link and footer

- The pull request body MUST start with `Closes #<issue>`, referencing the issue it resolves. The
  squash commit carries it to `main`, and GitHub closes the issue at that moment.
- A breaking change MUST be declared with a `BREAKING CHANGE: <what breaks and what to change>`
  footer at the end of the pull request body, never with a `!` after the type or scope. The changeset
  still describes it for the changelog (see [versioning.md](./versioning.md)).
  ✅ `build(typeorm): upgrade typeorm to 1.1` with a `BREAKING CHANGE: ...` footer
  ❌ `build(typeorm)!: upgrade typeorm to 1.1`
- In a stack, an upper pull request targets its parent branch rather than `main`, so its keyword
  does nothing on its own. Merging bottom to top — which `gh stack merge` enforces — retargets each
  pull request onto `main` as the one below it lands, and each issue closes in turn.

## Pull requests

- One pull request per branch, therefore one per issue.
- The title MUST follow the [commit message](#commit-messages) format: it becomes the subject of the
  commit on `main`.
- The body MUST start with `Closes #<issue>` and explain *why*: it becomes the body of the commit on
  `main`.
- The person who opens the pull request MUST assign themselves to it. The assignee is the owner who
  takes it to merge.
- The pull request MUST carry the labels of its issue. See [Labels](#labels).
- `.github/workflows/pull-request.yml` runs type-checking, linting and the full test suite against
  Postgres and RabbitMQ. All three MUST be green before merge.
- A pull request that changes a versioned workspace MUST include a changeset. See
  [versioning.md](./versioning.md).

```bash
gh pr create --fill-first --base main --assignee @me --label bug --label pkg/core   # single branch
gh stack submit --auto                           # stack: pushes every branch, opens draft PRs
gh stack submit --auto --open                    # same, ready for review instead of draft
```

`--fill-first` and `gh stack` take the title and body from the first commit of the branch (plain
`--fill` lists every commit once there are several). Adjust them afterwards with `gh pr edit`.
`gh stack submit` sets neither an assignee nor labels: add them with
`gh pr edit <pr> --add-assignee @me --add-label <label>`.

## Merging

**Squash is the merge method.** It turns each pull request into exactly one commit on `main`, built
from the pull request title and body, whatever the number of commits on the branch: `main`'s
history stays a linear sequence of one commit per pull request, each traceable to its issue.

```bash
gh pr merge <pr> --squash             # single branch
gh stack merge <pr> --yes --squash    # that PR and every unmerged PR below it
```

- Before merging, the branch, or every branch of the stack, MUST be rebased on an up-to-date
  `origin/main` and pushed, and the checks of each pull request MUST be green on the rebased commits:
  ```bash
  gh stack rebase && gh stack push                          # stack
  git rebase origin/main && git push --force-with-lease     # single branch
  gh pr checks <pr> --watch                                 # each pull request
  ```
  A check shown green can come from the run of a previous commit when the run of the latest one
  failed to start: confirm with `gh run list --commit <sha>` when a pull request has fewer checks
  than the others.
- `gh stack merge` is all-or-nothing: if any pull request in the selected set cannot merge, none do.
- A stack squash-merges each pull request on its own: merging `n` pull requests creates `n` commits
  on `main`. A stack MUST NOT be collapsed into a single commit, for example by retargeting its top
  pull request onto `main` and squashing it.
- Before confirming, check the title and body of each pull request: they become the commits on
  `main`. `gh stack merge` cannot edit the squash message, so the first commit of each branch MUST
  already carry what `main` needs (see [Commits on a branch](#commits-on-a-branch)).
- After merging the lower part of a stack, the remaining layers are based on commits that never
  reached `main`: run `gh stack sync` before working on them again. It rebases them onto the squash
  commits and skips the merged layers.
- **Rebase is kept enabled as a fallback**, for when a squash is not possible. It replays every
  commit of the branch, so the branch MUST first be reduced to one commit whose message is the pull
  request title and body (`git reset --soft origin/main && git commit`).
- Merge commits are disabled at the repository level and MUST NOT be re-enabled.

## Stacks

A stack is an ordered chain of branches rooted on `main`, each based on the one below, each with its
own pull request. A reviewer sees only that layer's diff.

```
(main) <- 42-domain-schemas <- 43-repository <- 44-endpoints
```

Left is the bottom and merges first; right is the top.

### When to use one

- Use a stack when a feature is too large for one reviewable pull request. Splitting is the norm for
  anything crossing more than one workspace.
- Do NOT build everything on one branch and split it afterwards. Decompose into sub-issues of a
  parent issue first, then create the layers as you go: one layer per sub-issue.
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
  git add <paths> && git commit -m "..."
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
