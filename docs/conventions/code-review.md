# Code review

A review reads a pull request in five passes, in this order: structure, correctness, performance,
readability, then conventions. Each pass looks for what CI cannot see. Formatting, lint, import
order, types and the title and labels of the pull request are checked by tools (see
[README.md](./README.md)) and MUST NOT be raised in a review.

## Passes

### 1. Structure and organization

Read the pull request as a whole before reading any line.

- Each change MUST sit in the workspace and the layer that own it, and dependencies MUST follow the
  [dependency direction](./workspace-structure.md#dependency-direction).
- Files MUST follow the layout of their workspace ([package](./workspace-structure.md#layout-of-a-package),
  [application](./workspace-structure.md#layout-of-an-application)), and only the public surface goes
  through the [barrel](./workspace-structure.md#barrel-files).
- A module SHOULD have one responsibility. Flag a new module that duplicates one that already exists.
- The pull request MUST hold one concern, the one of its issue. Unrelated changes go to their own
  issue (see [commits-and-branches.md](./commits-and-branches.md#issues)).

### 2. Bugs and edge cases

Read each changed function for the inputs and states it must handle.

- Edge inputs: empty collections, `undefined` and `null`, zero and negative numbers, boundaries of
  pagination and ranges, duplicated values.
- Failure paths: every error is a typed error with its code (see
  [code-style.md](./code-style.md#errors)); no error is swallowed; a partial write is rolled back by a
  transaction.
- Concurrency: two requests or two consumers running the same code at the same time, a message
  delivered twice.
- Tests: the changed behavior MUST be covered by a test that fails without the change (see
  [testing.md](./testing.md#what-to-test)). Exhaustive test matrices are welcome; a duplicated test
  — two tests that check the same behavior — is not.

### 3. Performance

Read each changed path for the data volume and the load it will meet in production.

- Event loop: a request or a message handler MUST NOT block the event loop. Flag synchronous I/O
  (`readFileSync`, `Bun.spawnSync`, synchronous crypto), CPU-heavy loops, and `JSON.parse` or
  `JSON.stringify` of an unbounded payload on a hot path.
- Database: flag a query inside a loop (N+1), a query on an unbounded result set without
  pagination, and a filter or a sort on a column without an index.
- Concurrency: independent `await`s run one after the other SHOULD run together with
  `Promise.all`; a `Promise.all` over an unbounded list MUST limit its concurrency.
- Memory: flag a whole table, file or queue loaded in memory where a stream or a page would do, and
  a cache or a map that grows without bound.
- A finding states the volume that makes it a problem: "10,000 rows load in one query" is a
  finding, "this could be slow" is not.

### 4. Readability and maintainability

- Names MUST state what a value means, not its type or how it is computed (see
  [naming.md](./naming.md)).
- Prefer the simplest code that does the job: flag dead code, needless indirection, a reimplemented
  helper that the repository already provides, and a comment that repeats the code.
- A suggestion in this pass is a SHOULD: the author MAY decline it with a reason.

### 5. Adherence to the conventions

Check the rules of [`docs/conventions/`](./README.md) that no tool enforces, in the documents that
govern the changed files. A violation of a MUST rule is a blocker; a deviation from a SHOULD rule
MUST be justified in the pull request.

## Rounds

A pull request, or each pull request of a stack, goes through the same rounds. Agents run them; the
author of the pull request drives them and merges.

1. **Review.** Two reviewers read the pull request in parallel, each through every pass. They work
   independently: neither sees the findings of the other.
2. **Verification.** The findings of both reviewers are merged, and a finding raised twice is kept
   once. Each finding then goes to three skeptic agents, who try to refute it against the code: they
   look for the input or state that triggers it and check that the stated result is the actual one.
   A finding is kept when at least two of the three skeptics confirm it. A skeptic MUST NOT add a
   finding of their own.
3. **Publication.** The kept findings are posted on GitHub as one review per pull request, one
   inline comment per finding, in the [format below](#comments). GitHub does not let the author of a
   pull request approve it or request changes on it, so the review is posted as a comment
   (`event: COMMENT`); the `blocker:` prefix carries the severity.
4. **Fix.** The author answers every comment: a fix, or the reason to decline it. All the fixes of
   the round go in one commit on the branch (see
   [commits-and-branches.md](./commits-and-branches.md#commits-on-a-branch)), and each reply names
   the commit that fixes it. In a stack, a fix is committed on the layer it belongs to, and the
   layers above are rebased.
5. **Re-review.** A reviewer reads only the changes since the review — `git diff <reviewed>..HEAD`
   on each branch — and checks that each fix resolves its finding and introduces no new one through
   the passes. Resolved threads are closed. A new blocker starts another round from step 2.
6. **Merge.** Once no thread is open, the stack is rebased, pushed, its checks are green, and it is
   merged (see [commits-and-branches.md](./commits-and-branches.md#merging)).

### Run by the local agent

When a pull request or a stack is ready, the local Claude Code agent MAY run every round, from the
review to the merge, without handing back between steps. It runs the steps in parallel wherever they
do not depend on each other:

- **Review**: the two reviewers of every pull request of the stack start at once.
- **Verification** of a pull request starts as soon as its two reviews end, without waiting for the
  other pull requests. The three skeptics of every finding run at once.
- **Publication** of a pull request follows its verification.
- **Fix**: one agent per pull request, each in its own worktree, prepares the fixes of its layer at
  the same time. Their commits are then applied bottom to top, and the layers above are rebased
  after each one.
- **Re-review**: every layer at once.
- **Merge**: the whole stack at once, with `gh stack merge`.

The agent stops and hands back to the author when a finding needs a product decision, when a
conflict or a red check resists a fix, or when a third round still raises a blocker. The release
pull request is out of this flow: the repository admin merges it (see
[versioning.md](./versioning.md#release-pipeline)).

## Comments

- Comments MUST be in English (see [commits-and-branches.md](./commits-and-branches.md#language)).
- Each comment MUST sit on the line it is about and state the problem with a concrete case: the
  input or state, and the wrong result. "This could break" is not a finding.
- Each comment MUST start with its severity:
  - `blocker:` a bug, or a violation of a MUST rule. The pull request does not merge until it is
    fixed.
  - `suggestion:` an improvement or a SHOULD rule. The author decides.
  - `question:` the reviewer needs an answer before judging.
- The author answers every comment, with a fix or a reason. The reviewer resolves the thread once
  satisfied (see [Rounds](#rounds)).
