# @package/typeorm

## 0.4.0

### Minor Changes

- [#125](https://github.com/mxvincent/bun-playground/pull/125) [`d9c7745`](https://github.com/mxvincent/bun-playground/commit/d9c7745dccde3bf77ce70a26e5178c527ed9e62a) Thanks [@mxvincent](https://github.com/mxvincent)! - Remove `TypeormResourceNotFoundError`, which nothing used: its `format()` built a plain `ResourceNotFoundError` anyway. Throw `ResourceNotFoundError` from `@package/errors`, e.g. `new ResourceNotFoundError(metadata.name, metadata.getEntityIdMap(record))`.

- [#127](https://github.com/mxvincent/bun-playground/pull/127) [`2b3d0af`](https://github.com/mxvincent/bun-playground/commit/2b3d0af80f9052fcf476d37d267912bad47e9167) Thanks [@mxvincent](https://github.com/mxvincent)! - `Sorter` takes its sorts and filters per call, like `Pager`: a single instance can serve every request.

  Breaking change, migrate as follows:

  - Replace `new Sorter(entity, { query, sorts, filters }).getSortedCollection()` with `new Sorter(entity, { query }).getSortedCollection({ sorts, filters })`.
  - `CollectionSorterOptions` is replaced by `SorterOptions` (constructor) and `GetSortedCollectionOptions` (call).
  - The protected `applySorts()` method is removed: use the exported `applySorts(query, sorts)` function to sort a query builder.

- [#123](https://github.com/mxvincent/bun-playground/pull/123) [`33a9d56`](https://github.com/mxvincent/bun-playground/commit/33a9d56dcef660aed1ebeb6b823a962d397a851c) Thanks [@mxvincent](https://github.com/mxvincent)! - `Sorter` no longer modifies the query given to its constructor: its filters and sorts are applied to a copy made with `SelectQueryBuilder.clone()`. The shallow `es-toolkit` clone shared the expression map, so the caller's query got the `ORDER BY` clauses, and they accumulated across `getSortedCollection()` calls.

  `cloneInitialQuery()` is removed: it was only used by `getSortedCollection()`.

- [#200](https://github.com/mxvincent/bun-playground/pull/200) [`56679a7`](https://github.com/mxvincent/bun-playground/commit/56679a7402daad90cbf6210587793938a5a02b4f) Thanks [@mxvincent](https://github.com/mxvincent)! - Require `typeorm` `^1.1.0` as a peer dependency instead of `^0.3.28`. Breaking: upgrade `typeorm` in the consumers and follow the [upgrade guide](https://typeorm.io/docs/releases/1.0/upgrading-from-0.3).

  - **`where` values throw at runtime.** With the default `invalidWhereValuesBehavior`, a `null` or `undefined` value in a find or write `where` (including `FindResourceWhere`) now throws instead of being ignored. Use `IsNull()` to match `null`, and remove the `undefined` keys before the query.
  - **Removed APIs.** `@package/typeorm` re-exports `typeorm`, so the APIs that 1.0 removes are gone from it too: `Connection` and `ConnectionOptions` (use `DataSource` and `DataSourceOptions`), `findByIds` and `findOneById` on `Repository` and `EntityManager`, `exist()` on `Repository`, and the string-array forms of the top-level `select` and `relations` find options, among others.
  - **Types.** `PostgresDataSource.options` is now typed as `PostgresDataSourceOptions`.
  - **Node.js.** A consumer that runs on Node.js instead of Bun needs a version within the `engines` range of `typeorm` 1.x: `^20.19.0 || ^22.13.0 || >=24.11.0`.

### Patch Changes

- [#124](https://github.com/mxvincent/bun-playground/pull/124) [`4720549`](https://github.com/mxvincent/bun-playground/commit/472054969040738333ec60d62cd0b9a479724d8e) Thanks [@mxvincent](https://github.com/mxvincent)! - `getPostgresConnectionUri` percent-encodes the username and the password. A password holding `@`, `:` or `/` produced an invalid URI.

- [#122](https://github.com/mxvincent/bun-playground/pull/122) [`28b7cd3`](https://github.com/mxvincent/bun-playground/commit/28b7cd38176ff455f7d25822191b624aab3fdabf) Thanks [@mxvincent](https://github.com/mxvincent)! - A nested `TypeormDatabaseContext.transaction()` now runs in a savepoint. It committed the outer transaction and released the query runner, so the rest of the outer callback ran outside any transaction. An inner failure now only rolls back the inner changes, and an outer failure rolls back both.

- Updated dependencies [[`5b364a5`](https://github.com/mxvincent/bun-playground/commit/5b364a5ffe8e118ec28f54011b13fd170b898f8c), [`b8d8304`](https://github.com/mxvincent/bun-playground/commit/b8d83041f296ee7cfd3f672502478017c8f1bb22), [`e54b6e7`](https://github.com/mxvincent/bun-playground/commit/e54b6e730e9cdd3231492a67eeb781cf03da7ebd), [`5f49412`](https://github.com/mxvincent/bun-playground/commit/5f494125741d52c374841be34b2566a673041c87), [`23af85d`](https://github.com/mxvincent/bun-playground/commit/23af85dfca984aa4832011a95f9bacfacfdee00d), [`f811014`](https://github.com/mxvincent/bun-playground/commit/f811014b8d8d5ba9e7668f477ec17b136e9c088a), [`e94fb89`](https://github.com/mxvincent/bun-playground/commit/e94fb89a58b4c022177b528e6a25a48abee75f6f), [`9e32a91`](https://github.com/mxvincent/bun-playground/commit/9e32a9102ee7715963dd4b19e9347616ccba6e52), [`38871ac`](https://github.com/mxvincent/bun-playground/commit/38871ac84b7f1d22f68829abe76b3950e8120bdf), [`619a029`](https://github.com/mxvincent/bun-playground/commit/619a029b01880732f70e253cbc716a8dcda99f37), [`8fe4c30`](https://github.com/mxvincent/bun-playground/commit/8fe4c30c7e2e423cbc8be04d44915569bec5d7b8), [`eb8becf`](https://github.com/mxvincent/bun-playground/commit/eb8becf51aab8199a15bbaf678f20b4e23ae49c5), [`804fdd9`](https://github.com/mxvincent/bun-playground/commit/804fdd9b46dd44d3b0ba606cafa4fc9edc9b9fd1), [`8b57bd3`](https://github.com/mxvincent/bun-playground/commit/8b57bd35f20eb3ca8a60f1e5b5072bae9e439df5), [`060805c`](https://github.com/mxvincent/bun-playground/commit/060805cbbaf76ee75508055b22108a11cb706dee), [`6377fc7`](https://github.com/mxvincent/bun-playground/commit/6377fc70d6b3657ac2d65d7846362b2d2be16c19), [`154d4c5`](https://github.com/mxvincent/bun-playground/commit/154d4c5fc5f11fe247aaaca72438b73edcba9dc9), [`310e137`](https://github.com/mxvincent/bun-playground/commit/310e137ea472f766e390e1df85563bab65a46227), [`8275fc8`](https://github.com/mxvincent/bun-playground/commit/8275fc86c0fe5b4edd5024866dc90c702acf1120), [`2736e1b`](https://github.com/mxvincent/bun-playground/commit/2736e1b9c24419f43c4a3e7e62a892eb1aca11c7), [`96d326a`](https://github.com/mxvincent/bun-playground/commit/96d326a3319c4db27f3dadfc02c388c9bbe2106d), [`1476111`](https://github.com/mxvincent/bun-playground/commit/14761117ec7a38a4d0c45fcae50218349fd6cb32), [`058dd92`](https://github.com/mxvincent/bun-playground/commit/058dd92925cd8cb2f69644c6a1db8506eb3da78f), [`d9631ae`](https://github.com/mxvincent/bun-playground/commit/d9631aee093dd1244617064d14e828cf721e6f53), [`71a878c`](https://github.com/mxvincent/bun-playground/commit/71a878c9cac3244e10b8ac9701555d620c3cde96)]:
  - @package/core@0.2.0
  - @package/database@0.3.0
  - @package/errors@0.2.0
  - @package/query-params@0.1.2
  - @package/telemetry@0.2.0

## 0.3.0

### Minor Changes

- [#13](https://github.com/mxvincent/bun-playground/pull/13) [`3ba0c2c`](https://github.com/mxvincent/bun-playground/commit/3ba0c2cef1e279059cddda559aa1925ecc9f73ac) Thanks [@mxvincent](https://github.com/mxvincent)! - A `Pager` can now be reused across requests: sorts and filters are passed to each `getPage()` call instead of the constructor. Replace `new Pager(entity, { query, sorts, filters }).getPage(pagination)` with `new Pager(entity, { query }).getPage({ pagination, sorts, filters })`. The `cursorTransformer` option is replaced by `cursorEncoding: { encoder, decoder }`, since the cursor keys now follow the sorts of each call.

## 0.2.0

### Minor Changes

- [#5](https://github.com/mxvincent/bun-playground/pull/5) [`d5721ff`](https://github.com/mxvincent/bun-playground/commit/d5721ffca1e36957cf3166697521fe29321b3058) Thanks [@mxvincent](https://github.com/mxvincent)! - Implement DatabaseContext interface

### Patch Changes

- [#9](https://github.com/mxvincent/bun-playground/pull/9) [`7696993`](https://github.com/mxvincent/bun-playground/commit/769699361e1693dc43c19ada2309198d4812da81) Thanks [@mxvincent](https://github.com/mxvincent)! - Add one item to the pagination size to prevent extra query

- [#7](https://github.com/mxvincent/bun-playground/pull/7) [`3a5a77a`](https://github.com/mxvincent/bun-playground/commit/3a5a77a10d17c1be157ff9bf66061774cb5884a8) Thanks [@mxvincent](https://github.com/mxvincent)! - Fix multi columns cursors

- [#8](https://github.com/mxvincent/bun-playground/pull/8) [`936b81a`](https://github.com/mxvincent/bun-playground/commit/936b81ae67377342b1908e28db4c88efa5d09df5) Thanks [@mxvincent](https://github.com/mxvincent)! - Handle null values in cursor

- Updated dependencies [[`d5721ff`](https://github.com/mxvincent/bun-playground/commit/d5721ffca1e36957cf3166697521fe29321b3058), [`e84cc5c`](https://github.com/mxvincent/bun-playground/commit/e84cc5cf0e5b55dd7ae158eb111a0774998251fa), [`57a22f0`](https://github.com/mxvincent/bun-playground/commit/57a22f0aedd5631908ef0706a35c00f06324f578), [`23367cd`](https://github.com/mxvincent/bun-playground/commit/23367cd23733b5e4c32cac789cd3612e5c7ab416), [`936b81a`](https://github.com/mxvincent/bun-playground/commit/936b81ae67377342b1908e28db4c88efa5d09df5)]:
  - @package/database@0.2.0
  - @package/query-params@0.1.1

## 0.1.0

### Minor Changes

- [#1](https://github.com/mxvincent/bun-playground/pull/1) [`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297) Thanks [@mxvincent](https://github.com/mxvincent)! - Initial release

### Patch Changes

- Updated dependencies [[`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297)]:
  - @package/query-params@0.1.0
  - @package/telemetry@0.1.0
  - @package/database@0.1.0
  - @package/errors@0.1.0
  - @package/core@0.1.0
