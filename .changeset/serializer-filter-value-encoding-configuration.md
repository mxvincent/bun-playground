---
"@package/query-params-serializer": minor
---

The filter value encoding is configured once with `configureFilterValueEncoding({ encode, decode })`, and `resetFilterValueEncoding()` restores the default base64url encoding. `serializeFilter`, `serializeFilters` and `parseFilters` always use the configured encoding, so a query string can no longer be serialized and parsed with different encodings.

Breaking change: the encoder argument of `serializeFilter` / `serializeFilters` and the decoder argument of `parseFilters` are removed. Replace `parseFilters(filters, decode)` with `configureFilterValueEncoding({ encode, decode })` at startup, then `parseFilters(filters)`.
