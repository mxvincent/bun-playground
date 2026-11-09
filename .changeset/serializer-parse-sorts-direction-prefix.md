---
"@package/query-params-serializer": patch
---

`parseSorts` only reads a direction in the `asc(path)` and `desc(path)` forms. A path that starts with `asc` or `desc`, such as `description`, was parsed as `desc(ription)`. A sort with unbalanced parentheses is now ignored like any invalid sort.
