---
"@package/database": patch
---

The in-memory `like` and `notLike` filters interpret the value as a SQL `LIKE` pattern, like the `typeorm` and `drizzle` adapters: `%` matches any sequence, `_` any single character, and `\` escapes them. They matched substrings, so `like('name', 'a')` matched every name containing `a`. To keep matching substrings, wrap the value: `like('name', '%a%')`.
