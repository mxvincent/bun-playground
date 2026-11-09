---
"@package/drizzle": patch
---

`DrizzleCursorPager.getPage` no longer modifies the given sorts: the primary key tie-breaker is added to a copy. It was pushed into the caller's array on every call.
