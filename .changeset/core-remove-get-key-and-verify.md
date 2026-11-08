---
"@package/core": minor
---

Remove `getKeyAndVerify` and the `jwks-rsa` dependency. The function had no user, and its fallback that tries every JWKS key could never run. To verify a token against a JWKS, fetch the key with `jwksClient.getSigningKey(getKeyIdHeader(token))` and pass `key.getPublicKey()` to `verifyToken`.
