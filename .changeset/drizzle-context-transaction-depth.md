---
"@package/drizzle": patch
---

`DrizzleDatabaseContext.commitTransaction` and `rollbackTransaction` do nothing without transaction, like `@package/typeorm`. They decremented the transaction depth below zero, so the next transaction tried to create `SAVEPOINT sp_-1`.
