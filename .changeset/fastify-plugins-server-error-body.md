---
"@package/fastify-plugins": patch
---

The error handler answers a `BaseError` with a status code of 500 or above with `{ statusCode, code, message }` only, where `message` is `Internal server error`: the context of a server error (a file path, a variable name, an internal URL) no longer reaches the HTTP client. The full error is still logged. A client error (4xx) keeps its `toJSON()` body.
