# @package/drizzle

## 0.2.0

### Minor Changes

- [#213](https://github.com/mxvincent/bun-playground/pull/213) [`9a4db13`](https://github.com/mxvincent/bun-playground/commit/9a4db13e21e251eff4e8eef08df747dd4c6d7f61) Thanks [@mxvincent](https://github.com/mxvincent)! - `DrizzleDatabaseContext.transaction(callback)` runs the callback in a transaction, like `TypeormDatabaseContext.transaction`: it commits when the callback resolves, rolls back and rethrows when it rejects, and nested calls run in savepoints. Prefer it to pairing `startTransaction`, `commitTransaction` and `rollbackTransaction` by hand.

### Patch Changes

- [#210](https://github.com/mxvincent/bun-playground/pull/210) [`876fcab`](https://github.com/mxvincent/bun-playground/commit/876fcabd54b1a12d7e210a4c7435ef72a7cd3e53) Thanks [@mxvincent](https://github.com/mxvincent)! - `DrizzleDatabaseContext.commitTransaction` throws when PostgreSQL rolls the transaction back because one of its statements failed. PostgreSQL answers `COMMIT` with `ROLLBACK` without an error, so the commit resolved while nothing was persisted.

- [#145](https://github.com/mxvincent/bun-playground/pull/145) [`28febe5`](https://github.com/mxvincent/bun-playground/commit/28febe553a4bf258af5b5573bfb2f312504d2c82) Thanks [@mxvincent](https://github.com/mxvincent)! - `DrizzleDatabaseContext.commitTransaction` and `rollbackTransaction` no longer change the transaction depth without transaction. They decremented it below zero, so the next transaction tried to create `SAVEPOINT sp_-1`.

- [#209](https://github.com/mxvincent/bun-playground/pull/209) [`033a7d9`](https://github.com/mxvincent/bun-playground/commit/033a7d9716ebd69b194ffff25a500ab2ecc51a60) Thanks [@mxvincent](https://github.com/mxvincent)! - `DrizzleDatabaseContext.commitTransaction` only lowers the transaction depth once its `RELEASE SAVEPOINT` succeeds. A failed release left the depth one level too low: the following rollback ended the whole transaction instead of its savepoint, and the outer commit silently did nothing. A failed top-level `COMMIT` still ends the transaction, as it does in PostgreSQL.

- [#212](https://github.com/mxvincent/bun-playground/pull/212) [`dfac374`](https://github.com/mxvincent/bun-playground/commit/dfac374268bd93adde14ad67080b05e39369aa82) Thanks [@mxvincent](https://github.com/mxvincent)! - `DrizzleDatabaseContext.commitTransaction` and `rollbackTransaction` warn (`There is no transaction to commit.` / `to rollback.`) when no transaction is active, instead of returning silently: unbalanced calls in the calling code become visible.

- [#144](https://github.com/mxvincent/bun-playground/pull/144) [`8831ef2`](https://github.com/mxvincent/bun-playground/commit/8831ef2df76ee4431c6df8f747656a022e801b3c) Thanks [@mxvincent](https://github.com/mxvincent)! - `transformFilter` supports the `match` and `insensitiveMatch` filters, translated to the POSIX regular expression operators `~` and `~*` on the text form of the column, like `@package/typeorm`. They threw `Filter is not configured`.

- [#141](https://github.com/mxvincent/bun-playground/pull/141) [`9c06e5c`](https://github.com/mxvincent/bun-playground/commit/9c06e5c0e3f01f29efe2191aa016966d16a24ebc) Thanks [@mxvincent](https://github.com/mxvincent)! - `DrizzleCursorPager` cursors hold the value of every sort column, encoded with `PaginationCursorTransformer` like `@package/typeorm`. They only held the primary key, so a sort by another column threw on the second page. Cursors issued before this change are no longer valid.

- [#140](https://github.com/mxvincent/bun-playground/pull/140) [`ffe9392`](https://github.com/mxvincent/bun-playground/commit/ffe9392760039ab2f21d21176b1bb4e26c6e361d) Thanks [@mxvincent](https://github.com/mxvincent)! - `DrizzleCursorPager.getPage` applies the filters on every page. They were only applied together with the cursor, so the first page was not filtered.

- [#142](https://github.com/mxvincent/bun-playground/pull/142) [`58d7c2b`](https://github.com/mxvincent/bun-playground/commit/58d7c2bd917f005b1fb2ec1e2ad0743355d37a0e) Thanks [@mxvincent](https://github.com/mxvincent)! - `DrizzleCursorPager` paginates over sort columns holding null values: the order is explicit (NULLS LAST in asc, NULLS FIRST in desc) and the cursor condition handles null values, like `@package/typeorm`. Comparisons with a null cursor value evaluated to NULL, so rows after the cursor were skipped.

- [#143](https://github.com/mxvincent/bun-playground/pull/143) [`32f6764`](https://github.com/mxvincent/bun-playground/commit/32f6764d443d60d100aacf35c42f9ac10ed56002) Thanks [@mxvincent](https://github.com/mxvincent)! - `DrizzleCursorPager.getPage` no longer modifies the given sorts: the primary key tie-breaker is added to a copy. It was pushed into the caller's array on every call.

- [#211](https://github.com/mxvincent/bun-playground/pull/211) [`fe0d728`](https://github.com/mxvincent/bun-playground/commit/fe0d728020ccc7a2d84815b17d0a1eb7764b4a8e) Thanks [@mxvincent](https://github.com/mxvincent)! - `DrizzleDatabaseContext.rollbackTransaction` logs a failed rollback instead of throwing, like `@package/typeorm`, and leaves the level in any case. In `catch (error) { await context.rollbackTransaction(); throw error }`, a failing rollback replaced the original error.

- Updated dependencies [[`5b364a5`](https://github.com/mxvincent/bun-playground/commit/5b364a5ffe8e118ec28f54011b13fd170b898f8c), [`b8d8304`](https://github.com/mxvincent/bun-playground/commit/b8d83041f296ee7cfd3f672502478017c8f1bb22), [`e54b6e7`](https://github.com/mxvincent/bun-playground/commit/e54b6e730e9cdd3231492a67eeb781cf03da7ebd), [`5f49412`](https://github.com/mxvincent/bun-playground/commit/5f494125741d52c374841be34b2566a673041c87), [`23af85d`](https://github.com/mxvincent/bun-playground/commit/23af85dfca984aa4832011a95f9bacfacfdee00d), [`f811014`](https://github.com/mxvincent/bun-playground/commit/f811014b8d8d5ba9e7668f477ec17b136e9c088a), [`e94fb89`](https://github.com/mxvincent/bun-playground/commit/e94fb89a58b4c022177b528e6a25a48abee75f6f), [`9e32a91`](https://github.com/mxvincent/bun-playground/commit/9e32a9102ee7715963dd4b19e9347616ccba6e52), [`38871ac`](https://github.com/mxvincent/bun-playground/commit/38871ac84b7f1d22f68829abe76b3950e8120bdf), [`619a029`](https://github.com/mxvincent/bun-playground/commit/619a029b01880732f70e253cbc716a8dcda99f37), [`8fe4c30`](https://github.com/mxvincent/bun-playground/commit/8fe4c30c7e2e423cbc8be04d44915569bec5d7b8), [`eb8becf`](https://github.com/mxvincent/bun-playground/commit/eb8becf51aab8199a15bbaf678f20b4e23ae49c5), [`804fdd9`](https://github.com/mxvincent/bun-playground/commit/804fdd9b46dd44d3b0ba606cafa4fc9edc9b9fd1), [`154d4c5`](https://github.com/mxvincent/bun-playground/commit/154d4c5fc5f11fe247aaaca72438b73edcba9dc9), [`310e137`](https://github.com/mxvincent/bun-playground/commit/310e137ea472f766e390e1df85563bab65a46227), [`8275fc8`](https://github.com/mxvincent/bun-playground/commit/8275fc86c0fe5b4edd5024866dc90c702acf1120), [`5c5791a`](https://github.com/mxvincent/bun-playground/commit/5c5791a7e738295f900d4e4b0ece962ed5bfbc0e), [`43283c2`](https://github.com/mxvincent/bun-playground/commit/43283c2d938a23c611288285276911532065ceec), [`c075972`](https://github.com/mxvincent/bun-playground/commit/c0759722329429ea3e18a3dbd18417c63627dc95), [`e9be0d8`](https://github.com/mxvincent/bun-playground/commit/e9be0d8903e98444281ef3abf2981e75dc007fd3), [`b1a58dd`](https://github.com/mxvincent/bun-playground/commit/b1a58dd576130c21cc25547e8012b9e6881ef44b), [`2736e1b`](https://github.com/mxvincent/bun-playground/commit/2736e1b9c24419f43c4a3e7e62a892eb1aca11c7), [`96d326a`](https://github.com/mxvincent/bun-playground/commit/96d326a3319c4db27f3dadfc02c388c9bbe2106d), [`1476111`](https://github.com/mxvincent/bun-playground/commit/14761117ec7a38a4d0c45fcae50218349fd6cb32), [`058dd92`](https://github.com/mxvincent/bun-playground/commit/058dd92925cd8cb2f69644c6a1db8506eb3da78f), [`d9631ae`](https://github.com/mxvincent/bun-playground/commit/d9631aee093dd1244617064d14e828cf721e6f53), [`71a878c`](https://github.com/mxvincent/bun-playground/commit/71a878c9cac3244e10b8ac9701555d620c3cde96)]:
  - @package/core@0.2.0
  - @package/database@0.3.0
  - @package/query-params@0.1.2
  - @package/query-params-serializer@1.1.0
  - @package/telemetry@0.2.0

## 0.1.1

### Patch Changes

- [#5](https://github.com/mxvincent/bun-playground/pull/5) [`d5721ff`](https://github.com/mxvincent/bun-playground/commit/d5721ffca1e36957cf3166697521fe29321b3058) Thanks [@mxvincent](https://github.com/mxvincent)! - Improve testing and create DatabaseContext adapter

- Updated dependencies [[`d5721ff`](https://github.com/mxvincent/bun-playground/commit/d5721ffca1e36957cf3166697521fe29321b3058), [`e84cc5c`](https://github.com/mxvincent/bun-playground/commit/e84cc5cf0e5b55dd7ae158eb111a0774998251fa), [`57a22f0`](https://github.com/mxvincent/bun-playground/commit/57a22f0aedd5631908ef0706a35c00f06324f578), [`23367cd`](https://github.com/mxvincent/bun-playground/commit/23367cd23733b5e4c32cac789cd3612e5c7ab416), [`936b81a`](https://github.com/mxvincent/bun-playground/commit/936b81ae67377342b1908e28db4c88efa5d09df5)]:
  - @package/database@0.2.0
  - @package/query-params@0.1.1
  - @package/query-params-serializer@1.0.1

## 0.1.0

### Minor Changes

- [#1](https://github.com/mxvincent/bun-playground/pull/1) [`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297) Thanks [@mxvincent](https://github.com/mxvincent)! - Initial release

### Patch Changes

- Updated dependencies [[`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297)]:
  - @package/query-params-serializer@1.0.0
  - @package/query-params@0.1.0
  - @package/telemetry@0.1.0
  - @package/core@0.1.0
