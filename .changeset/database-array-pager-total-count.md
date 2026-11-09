---
"@package/database": patch
---

`ArrayPager.getPage` returns the total count on a page after the last item, and `null` when the count is not requested. It returned `0` in both cases.
