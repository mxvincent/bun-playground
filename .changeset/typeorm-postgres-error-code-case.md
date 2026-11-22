---
"@package/typeorm": minor
---

Rename the members of `PostgresErrorCode` to `SCREAMING_SNAKE_CASE`, as `naming.md` requires for enum members: `UniqueViolation` becomes `UNIQUE_VIOLATION`, `ForeignKeyViolation` becomes `FOREIGN_KEY_VIOLATION`, and so on. Breaking: code that reads `PostgresErrorCode.<Member>` must use the new names. The values do not change.
