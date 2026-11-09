---
"@package/fastify-plugins": patch
---

`fastifyAuth` no longer authenticates every request as the hard-coded user `123`: it decorates `request.actor` with `null`, an anonymous request, until a real authentication sets it. It decorated `auth` instead of `actor`.
