---
"@package/query-params": patch
---

`removeDuplicatedFilters` now only removes identical filters (same operator, path and value). It kept a single comparison filter per path, which dropped conditions such as `a notEqual 2` next to `a equal 1`. It also returns new logical filters instead of mutating the given ones, and keeps the order of the filters.
