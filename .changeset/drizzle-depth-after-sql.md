---
"@package/drizzle": patch
---

`DrizzleDatabaseContext.commitTransaction` only lowers the transaction depth once its `RELEASE SAVEPOINT` succeeds. A failed release left the depth one level too low: the following rollback ended the whole transaction instead of its savepoint, and the outer commit silently did nothing. A failed top-level `COMMIT` still ends the transaction, as it does in PostgreSQL.
