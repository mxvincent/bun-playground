---
"@package/core": patch
---

`getKeyAndVerify` now verifies a token without `kid` header by trying every key of the JWKS. Such a token was always rejected with `Key id header is missing`.
