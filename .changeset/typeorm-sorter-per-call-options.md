---
"@package/typeorm": minor
---

`Sorter` takes its sorts and filters per call, like `Pager`: a single instance can serve every request.

Breaking change, migrate as follows:

- Replace `new Sorter(entity, { query, sorts, filters }).getSortedCollection()` with `new Sorter(entity, { query }).getSortedCollection({ sorts, filters })`.
- `CollectionSorterOptions` is replaced by `SorterOptions` (constructor) and `GetSortedCollectionOptions` (call).
- The protected `applySorts()` method is removed: use the exported `applySorts(query, sorts)` function to sort a query builder.
