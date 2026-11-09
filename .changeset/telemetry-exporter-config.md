---
"@package/telemetry": minor
---

The HTTP trace exporter sends the traces to `exporter.url` when the configuration given to `initializeTelemetrySdk()` or `getTraceExporter()` sets it (otherwise to the `OTEL_EXPORTER_OTLP_*` variables, then its default URL). The environment configuration (`getTelemetryConfig()`, used by `register`) has no key for this url yet, so it still exports to the `OTEL_EXPORTER_OTLP_*` variables or the default URL. The `GCP` exporter is removed from `TelemetryConfigSchema`: it was not implemented and silently fell back to the HTTP exporter, together with `GCPExporterSchema`.
