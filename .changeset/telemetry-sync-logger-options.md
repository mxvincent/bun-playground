---
"@package/telemetry": patch
---

`syncLogger` uses the options of `logger`: level, `message` key, error serializer and redaction of authorization headers. The options were given to its destination instead, so it logged bearer tokens in clear. `createSyncLogger(options, destination)` builds such a logger.
