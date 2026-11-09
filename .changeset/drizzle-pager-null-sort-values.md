---
"@package/drizzle": patch
---

`DrizzleCursorPager` paginates over sort columns holding null values: the order is explicit (NULLS LAST in asc, NULLS FIRST in desc) and the cursor condition handles null values, like `@package/typeorm`. Comparisons with a null cursor value evaluated to NULL, so rows after the cursor were skipped.
