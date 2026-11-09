---
"@package/drizzle": patch
---

`DrizzleDatabaseContext.rollbackTransaction` logs a failed rollback instead of throwing, like `@package/typeorm`, and leaves the level in any case. In `catch (error) { await context.rollbackTransaction(); throw error }`, a failing rollback replaced the original error.
