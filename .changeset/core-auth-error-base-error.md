---
"@package/core": minor
---

The auth errors extend `AuthorizationError` from `@package/errors`, so they are instances of `BaseError` and carry a `statusCode`:

- `AuthError`: code `AUTH_ERROR`, status 401. Its constructor takes an optional `details` parameter, `new AuthError(message, details?)`, exposed as the `details` field.
- `AuthTokenError`: code `INVALID_TOKEN`, status 401. Its `details` are typed by the exported `AuthTokenErrorDetails` type.
- `AuthJWKSError`: code `AUTH_JWKS_ERROR` (it inherited `AUTH_ERROR` before), status 500.

`toJSON()` changes shape from `{ error, message, details }` to `{ statusCode, message, code, details }`: a consumer that reads `error` from the serialized error must read `code` instead.

`details.reason` of an `AuthTokenError` is no longer the raw jsonwebtoken message, which could reveal the expected audience or issuer to the client. It is a stable code of the exported `AuthTokenErrorReason` type: `malformed`, `invalid-signature`, `invalid-algorithm`, `invalid-audience`, `invalid-issuer`, `invalid-subject`, `invalid-jwt-id`, `invalid-nonce`, `invalid-claims`, or `invalid` for any other failure. A consumer that matched on the message text must match on these codes instead.
