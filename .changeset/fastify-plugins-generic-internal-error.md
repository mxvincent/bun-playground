---
"@package/fastify-plugins": patch
---

`fastifyErrorHandler` responds to an unexpected error with a generic `InternalServerError` body (500, `Internal server error`) instead of the error message, which could expose internal details such as SQL errors or upstream hosts. Only `BaseError` responses and Fastify client errors (a `FST_` code with a 4xx status, e.g. validation) keep their response: any other error, even one that carries its own status code (e.g. an HTTP client error about an upstream call), now answers a 500.
