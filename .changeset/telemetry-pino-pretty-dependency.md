---
"@package/telemetry": patch
---

`pino-pretty` is a dependency instead of a dev dependency: the logger loads it at runtime whenever `NODE_ENV` is not `production`, so an environment installed without dev dependencies failed when the logger was created.
