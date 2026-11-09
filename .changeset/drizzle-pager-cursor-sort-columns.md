---
"@package/drizzle": patch
---

`DrizzleCursorPager` cursors hold the value of every sort column, encoded with `PaginationCursorTransformer` like `@package/typeorm`. They only held the primary key, so a sort by another column threw on the second page. Cursors issued before this change are no longer valid.
