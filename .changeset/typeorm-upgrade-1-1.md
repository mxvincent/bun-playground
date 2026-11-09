---
"@package/typeorm": minor
---

Require `typeorm` `^1.1.0` as a peer dependency instead of `^0.3.28`. Breaking: upgrade `typeorm` in the consumers and follow the [upgrade guide](https://typeorm.io/docs/releases/1.0/upgrading-from-0.3). With the default `invalidWhereValuesBehavior`, a `null` or `undefined` value in a find or write `where` (including `FindResourceWhere`) now throws instead of being ignored: use `IsNull()` to match `null`, and remove the `undefined` keys before the query. `PostgresDataSource.options` is now typed as `PostgresDataSourceOptions`.
