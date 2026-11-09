---
"@package/query-params-serializer": patch
---

`parseFilters` rejects a value filter with more than one value (`equal(a,b,c)`) and a null filter with a value (`null(a,b)`) with a `QueryStringParameterValidationError`. The extra parameters were ignored without error.
