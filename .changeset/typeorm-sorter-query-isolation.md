---
"@package/typeorm": minor
---

`Sorter` no longer modifies the query given to its constructor: its filters and sorts are applied to a copy made with `SelectQueryBuilder.clone()`. The shallow `es-toolkit` clone shared the expression map, so the caller's query got the `ORDER BY` clauses, and they accumulated across `getSortedCollection()` calls.

`cloneInitialQuery()` is removed: it was only used by `getSortedCollection()`.
