---
"@package/drizzle": patch
---

`DrizzleDatabaseContext.commitTransaction` and `rollbackTransaction` no longer change the transaction depth without transaction. They decremented it below zero, so the next transaction tried to create `SAVEPOINT sp_-1`.
