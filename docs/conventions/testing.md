# Testing

The test runner is Bun's built-in runner. There is no Jest, no Vitest.

```bash
bun run turbo:test                          # every workspace
bun test --filter=@package/core             # one workspace
bun test packages/core/src/auth/jwt.test.ts # one file
```

## Placement

- A test file MUST sit next to the module it tests, named `<module>.test.ts`.
  ✅ `src/auth/jwt.ts` → `src/auth/jwt.test.ts`
  ❌ `test/auth/jwt.test.ts`, `src/__tests__/jwt.test.ts`
- A separate `test/` directory MUST NOT be created.
- Shared fixtures, factories and lifecycle helpers MUST live in a `test-helpers/` directory at the
  root of the workspace, imported through the `#test-helpers/*` alias.
  ```ts
  import { useDatabaseContext, useDatabaseTransaction } from '#test-helpers/database'
  import { factories } from '#test-helpers/factories'
  ```
- `test-helpers/` is linted and formatted like `src/` and MUST NOT be exported from the package
  barrel.

## Structure

- Use `describe` and `test` from `bun:test`. `it` MUST NOT be used.
- The outer `describe` names the subject under test. For a method, name it `Subject.method()`:
  ```ts
  describe('DrizzleCursorPager.getPage()', () => { /* … */ })
  describe('RateLimitingService', () => {
  	describe('enableLimiter()', () => { /* … */ })
  })
  ```
- A `test` name MUST describe the observable behaviour in the present tense, without `should`:
  ```ts
  test('returns null when no row matches', () => { /* … */ })
  test('rejects a cursor pointing at a deleted row', () => { /* … */ })
  ```
  ❌ `test('should return null')`, `test('works')`, `test('test create')`
- Nesting SHOULD stay at two `describe` levels: subject, then method or scenario group.
- A test SHOULD assert one behaviour. A test asserting five unrelated things is five tests.

### Parameterised tests

Use `describe.each` / `test.each` with a typed table and a `description` field rendered in the
title, rather than a hand-rolled loop:

```ts
describe.each<{ rawDataset: AuthorRecord[]; description: string }>([
	{ rawDataset: factories.createAuthors({ collectionSize, useSequentialIds: true }), description: `sequential ids` },
	{ rawDataset: factories.createAuthors({ collectionSize, useSequentialIds: false }), description: `random ids` }
])('[DATASET] $description', ({ rawDataset }) => { /* … */ })
```

## Data

- Test data MUST come from a factory, not from hand-written literals repeated across tests. Domain
  factories live in `domains/<name>/src/factories/`; test-only factories in
  `<workspace>/test-helpers/factories.ts`.
- A factory MUST accept partial overrides and fill the rest with sensible or random values, so a
  test states only what it cares about.
- Fixed values that a test asserts against MUST be module-level constants in
  `SCREAMING_SNAKE_CASE`:
  ```ts
  const ORGANIZATION_A = '6878ebebc9f3536e5920853c'
  ```

## Database-backed tests

Tests that touch Postgres are first-class here — repositories and pagination are not meaningfully
covered by mocks.

- A workspace needing a database MUST declare its schema bootstrap in `test-helpers/setup.ts` and
  preload it, either through `bunfig.toml`:
  ```toml
  [test]
  preload = ["./test-helpers/setup.ts"]
  ```
  or in the `test` script (`bun test --preload ./test-helpers/setup.ts`). Prefer `bunfig.toml`, so
  that `bun test <file>` behaves the same as `bun run test`.
- Each such workspace MUST use its own database, named `test_<workspace>` and created by the setup
  file if absent. Workspaces MUST NOT share a test database.
- Every test MUST run inside a transaction that is rolled back afterwards. Use the shared hooks
  rather than cleaning up by hand:
  ```ts
  const database = useDatabaseContext()          // per-test isolation by default
  useDatabaseTransaction(database, 'group')      // or per-describe, for a shared dataset
  ```
- Connection settings MUST be read through `EnvValue` with local defaults, never hard-coded.
- Any environment variable a test needs MUST be listed in the `test` task's `env` array in
  `turbo.json`, otherwise Turborepo's cache will not invalidate on it, and it MUST be provided by
  the `test` job in `.github/workflows/code-quality.yaml`.

## What to test

- A package MUST cover its public surface — everything re-exported from `src/index.ts`.
- Edge cases that have previously broken MUST get a regression test in the same commit as the fix.
  Pagination cursors, null handling and boundary values have earned this.
- A domain has no I/O and SHOULD be covered through its factories and any pure logic it holds. An
  in-memory adapter (`adapters/fake-*.ts`) MAY be provided so applications can test against the port.
- A workspace with no tests yet MUST still define `"test": "bun test --pass-with-no-tests"` so that
  `turbo run test` stays green.

## What not to do

- Do not mock what you own. Test the real repository against the real database; use the in-memory
  adapter when the subject is a consumer of the port, not the port itself.
- Do not assert on log output.
- Do not depend on test execution order, or on state left behind by another test file.
- Do not use `sleep` to wait for asynchronous work. Await the promise, or use the helper that does.
