---
"@package/drizzle": patch
---

`transformFilter` supports the `match` and `insensitiveMatch` filters, translated to the POSIX regular expression operators `~` and `~*` on the text form of the column, like `@package/typeorm`. They threw `Filter is not configured`.
