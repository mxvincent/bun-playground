---
"@package/database": patch
---

`filterArrayWith` handles boolean values: `null`/`notNull` see `true` and `false` as values, and `equal('active', 'false')` matches `false`. Booleans were treated as missing values.
