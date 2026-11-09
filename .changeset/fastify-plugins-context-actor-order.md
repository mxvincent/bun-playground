---
"@package/fastify-plugins": patch
---

The request context reads the actor of the request when it is used. It copied `request.actor` in its own `onRequest` hook, so when it was registered before the authentication, the actor stayed `null` for the whole request. `fastifyRequestLogger` writes the `Request started` log in a `preParsing` hook instead of an `onRequest` hook, so that it runs after the authentication and logs the actor whatever the plugin order. A request rejected by an `onRequest` hook (e.g. a failed authentication) now only has the `Request completed` log.
