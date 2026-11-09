---
"@package/drizzle": patch
---

`DrizzleDatabaseContext.commitTransaction` throws when PostgreSQL rolls the transaction back because one of its statements failed. PostgreSQL answers `COMMIT` with `ROLLBACK` without an error, so the commit resolved while nothing was persisted.
