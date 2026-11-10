---
"@package/fastify-plugins": patch
---

`fastifyErrorHandler` no longer prints `BaseError` bodies with `console.log`, and only logs unexpected errors (those answered with a 5xx) as `Unhandled error`. Expected errors, a 4xx `BaseError` such as a 404 or a Fastify client error, are already logged as warnings by `fastifyRequestLogger`.
