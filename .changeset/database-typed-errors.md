---
"@package/database": minor
---

`slice()` throws `InvalidSliceOptionError` (code `INVALID_SLICE_OPTION`, with the faulty `option`) instead of a plain `Error` when the collection is empty or `take` is below 1. Messages do not change.
