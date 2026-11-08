---
"@package/core": patch
---

`invariant` now only rejects `undefined` and `null`. It returned an error for `0`, `''` and `false`, which also made `randomArrayItem` throw on those values.
