---
"@package/telemetry": patch
---

Enabling telemetry (`TELEMETRY_SERVICE_NAME`) no longer crashes at startup: the configuration read from the environment is coerced to the schema types, so `TELEMETRY_DETECTOR_CONTAINER=false` becomes a boolean. It is built by the new exported `getTelemetryConfig()`.
