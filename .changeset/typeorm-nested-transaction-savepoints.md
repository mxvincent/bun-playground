---
"@package/typeorm": patch
---

A nested `TypeormDatabaseContext.transaction()` now runs in a savepoint. It committed the outer transaction and released the query runner, so the rest of the outer callback ran outside any transaction. An inner failure now only rolls back the inner changes, and an outer failure rolls back both.
