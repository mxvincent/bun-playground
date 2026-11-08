---
"@package/core": patch
---

`beforeProcessShutdown` now calls the registered teardown functions on `SIGINT` and `SIGTERM`. They were never called before.
