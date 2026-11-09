---
"@package/drizzle": patch
---

`DrizzleDatabaseContext.commitTransaction` and `rollbackTransaction` warn (`There is no transaction to commit.` / `to rollback.`) when no transaction is active, instead of returning silently: unbalanced calls in the calling code become visible.
