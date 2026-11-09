---
"@package/query-params": patch
---

`Pagination.take` now falls back to `DEFAULT_PAGE_SIZE` when the page size is `NaN`, and floors decimal page sizes. `?take=abc` produced a `NaN` page size.
