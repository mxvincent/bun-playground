---
"@package/typeorm": minor
---

Throw typed errors that extend `BaseError` instead of a plain `Error`: `TypeormUnsupportedFilterError` (with the filter `operator` and `path`), `TypeormDataSourceNotInitializedError`, `TypeormPrimaryKeyNotConfiguredError` and `TypeormInvalidPrimaryKeyError` (with the `entityName`). Messages do not change.
