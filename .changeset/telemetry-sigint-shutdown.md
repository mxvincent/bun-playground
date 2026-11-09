---
"@package/telemetry": patch
"@package/core": patch
---

The OpenTelemetry SDK shuts down on `SIGINT` too, flushing the pending spans: it only listened to `SIGTERM`, so a Ctrl-C dropped them. The shutdown is registered with `beforeProcessShutdown` of `@package/core` (a new dependency): on `SIGINT` or `SIGTERM`, the process waits for the SDK and the other teardown functions, then exits with code 0. Before, the `SIGTERM` listener kept the process alive after the shutdown.

`@package/core` now adds its `SIGINT` and `SIGTERM` listeners when the first teardown function is registered with `beforeProcessShutdown`, not when the module is loaded. Before, importing `@package/core` (and now `@package/telemetry`) without registering a teardown function added listeners that did nothing, so `SIGINT` and `SIGTERM` no longer stopped the process.
