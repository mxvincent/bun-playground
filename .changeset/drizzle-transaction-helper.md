---
"@package/drizzle": minor
---

`DrizzleDatabaseContext.transaction(callback)` runs the callback in a transaction, like `TypeormDatabaseContext.transaction`: it commits when the callback resolves, rolls back and rethrows when it rejects, and nested calls run in savepoints. Prefer it to pairing `startTransaction`, `commitTransaction` and `rollbackTransaction` by hand.
