---
"@package/json-schema": minor
---

Remove `JWTConfigSchema`, which nothing used. Import `JWTConfigSchema` from `@package/core` instead: it validates `algorithms` as a list and supports symmetric and asymmetric configurations.
