---
"@package/json-schema": minor
---

Remove `JWTConfigSchema`, which nothing used. Import `JWTConfigSchema` from `@package/core` instead: it has one `algorithm` per configuration, with a symmetric variant (`secret`) and an asymmetric one (`jwksUri`).
