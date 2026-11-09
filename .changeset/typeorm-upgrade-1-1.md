---
"@package/typeorm": minor
---

Require `typeorm` `^1.1.0` as a peer dependency instead of `^0.3.28`. Breaking: upgrade `typeorm` in the consumers and follow the [upgrade guide](https://typeorm.io/docs/releases/1.0/upgrading-from-0.3).

- **`where` values throw at runtime.** With the default `invalidWhereValuesBehavior`, a `null` or `undefined` value in a find or write `where` (including `FindResourceWhere`) now throws instead of being ignored. Use `IsNull()` to match `null`, and remove the `undefined` keys before the query.
- **Removed APIs.** `@package/typeorm` re-exports `typeorm`, so the APIs that 1.0 removes are gone from it too: `Connection` and `ConnectionOptions` (use `DataSource` and `DataSourceOptions`), `findByIds`, `findOneById` and `exist()` on `Repository` and `EntityManager`, and the string-array forms of the top-level `select` and `relations` find options, among others.
- **Types.** `PostgresDataSource.options` is now typed as `PostgresDataSourceOptions`.
- **Node.js.** A consumer that runs on Node.js instead of Bun needs a version within the `engines` range of `typeorm` 1.x: `^20.19.0 || ^22.13.0 || >=24.11.0`.
