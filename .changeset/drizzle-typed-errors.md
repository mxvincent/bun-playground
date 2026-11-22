---
"@package/drizzle": minor
---

Throw typed errors that extend `BaseError` instead of a plain `Error`: `DrizzleTransactionRolledBackError` when PostgreSQL answers COMMIT with ROLLBACK, `DrizzleInvalidCursorError` (status code 400, with the decoding error as `cause`) for a cursor that cannot be decoded, and `DrizzleUnsupportedFilterError` (with the filter `operator` and `path`) for a comparison operator without SQL translation. Messages do not change.
