---
"@package/query-params": patch
---

`isSort` now returns `true` for `Sort` instances. It only accepted plain objects, so `isSort(Sort.asc('path'))` returned `false`.
