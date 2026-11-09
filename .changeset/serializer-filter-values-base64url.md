---
"@package/query-params-serializer": minor
---

Filter values are now encoded as base64url (RFC 4648 §5, without padding) by `serializeFilters` / `serializeFilter`, and decoded the same way by `parseFilters`. With `encodeURIComponent`, `(` and `)` in a value cut the parsing of a logical filter and dropped the filters after it, and a client writing a URL had to double-encode `,` `(` `)` `%`, or an `in` filter silently got the wrong values. The base64url alphabet holds none of the separators of the format, so a value is encoded once, whatever it contains. `parseFilters` also rejects unbalanced parentheses.

Breaking change: a filter value must be base64url, e.g. `equal(status,YWN0aXZl)` for `status = active`. Build query strings with `serializeFilters`, or encode each value with the exported `encodeFilterValue`. Paths, operators and `null` filters are unchanged.
