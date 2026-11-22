---
'@package/query-params': minor
---

Filters now have a `toString()` naming their operator and path, like `equal:name` or `or(equal:name,null:email)`, so an invalid filter is reported by name instead of `[object Object]`
