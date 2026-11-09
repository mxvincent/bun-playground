---
"@package/query-params-serializer": patch
---

`parseFilters` throws a `QueryStringParameterValidationError` when a filter value cannot be decoded (not base64url, or not UTF-8 text). The decoding error reached HTTP handlers as a 500 instead of a 400.
