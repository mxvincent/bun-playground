---
"@package/core": minor
---

`AuthError`, `AuthTokenError` and `AuthJWKSError` extend `AuthorizationError` from `@package/errors`, so they are instances of `BaseError` and carry a `statusCode`: 401 for `AuthError` and `AuthTokenError` (code `INVALID_TOKEN`), 500 for `AuthJWKSError`, which now has its own code `AUTH_JWKS_ERROR`. `details` stays a field. `toJSON()` changes shape from `{ error, message, details }` to `{ statusCode, message, code, details }`: a consumer that reads `error` from the serialized error must read `code` instead.
