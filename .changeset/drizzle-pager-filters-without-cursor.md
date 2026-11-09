---
"@package/drizzle": patch
---

`DrizzleCursorPager.getPage` applies the filters on every page. They were only applied together with the cursor, so the first page was not filtered.
