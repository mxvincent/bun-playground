# @package/telemetry

## 0.2.0

### Minor Changes

- [#183](https://github.com/mxvincent/bun-playground/pull/183) [`96d326a`](https://github.com/mxvincent/bun-playground/commit/96d326a3319c4db27f3dadfc02c388c9bbe2106d) Thanks [@mxvincent](https://github.com/mxvincent)! - The HTTP trace exporter sends the traces to `exporter.url` when the configuration given to `initializeTelemetrySdk()` or `getTraceExporter()` sets it (otherwise to the `OTEL_EXPORTER_OTLP_*` variables, then its default URL). The environment configuration (`getTelemetryConfig()`, used by `register`) has no key for this url yet, so it still exports to the `OTEL_EXPORTER_OTLP_*` variables or the default URL. The `GCP` exporter is removed from `TelemetryConfigSchema`: it was not implemented and silently fell back to the HTTP exporter, together with `GCPExporterSchema`.

### Patch Changes

- [#180](https://github.com/mxvincent/bun-playground/pull/180) [`2736e1b`](https://github.com/mxvincent/bun-playground/commit/2736e1b9c24419f43c4a3e7e62a892eb1aca11c7) Thanks [@mxvincent](https://github.com/mxvincent)! - Enabling telemetry (`TELEMETRY_SERVICE_NAME`) no longer crashes at startup: the configuration read from the environment is coerced to the schema types, so `TELEMETRY_DETECTOR_CONTAINER=false` becomes a boolean. It is built by the new exported `getTelemetryConfig()`.

- [#182](https://github.com/mxvincent/bun-playground/pull/182) [`1476111`](https://github.com/mxvincent/bun-playground/commit/14761117ec7a38a4d0c45fcae50218349fd6cb32) Thanks [@mxvincent](https://github.com/mxvincent)! - `pino-pretty` is a dependency instead of a dev dependency: the logger loads it at runtime whenever `NODE_ENV` is not `production`, so an environment installed without dev dependencies failed when the logger was created.

- [#184](https://github.com/mxvincent/bun-playground/pull/184) [`058dd92`](https://github.com/mxvincent/bun-playground/commit/058dd92925cd8cb2f69644c6a1db8506eb3da78f) Thanks [@mxvincent](https://github.com/mxvincent)! - The OpenTelemetry SDK shuts down on `SIGINT` too, flushing the pending spans: it only listened to `SIGTERM`, so a Ctrl-C dropped them. The shutdown is registered with `beforeProcessShutdown` of `@package/core` (a new dependency): on `SIGINT` or `SIGTERM`, the process waits for the SDK and the other teardown functions, then exits with code 0. Before, the `SIGTERM` listener kept the process alive after the shutdown.

  `@package/core` now adds its `SIGINT` and `SIGTERM` listeners when the first teardown function is registered with `beforeProcessShutdown`, not when the module is loaded. Before, importing `@package/core` (and now `@package/telemetry`) without registering a teardown function added listeners that did nothing, so `SIGINT` and `SIGTERM` no longer stopped the process.

- [#181](https://github.com/mxvincent/bun-playground/pull/181) [`d9631ae`](https://github.com/mxvincent/bun-playground/commit/d9631aee093dd1244617064d14e828cf721e6f53) Thanks [@mxvincent](https://github.com/mxvincent)! - `syncLogger` uses the options of `logger`: level, `message` key, error serializer and redaction of authorization headers. The options were given to its destination instead, so it logged bearer tokens in clear. `createSyncLogger(options, destination)` builds such a logger.

- Updated dependencies [[`5b364a5`](https://github.com/mxvincent/bun-playground/commit/5b364a5ffe8e118ec28f54011b13fd170b898f8c), [`b8d8304`](https://github.com/mxvincent/bun-playground/commit/b8d83041f296ee7cfd3f672502478017c8f1bb22), [`e54b6e7`](https://github.com/mxvincent/bun-playground/commit/e54b6e730e9cdd3231492a67eeb781cf03da7ebd), [`5f49412`](https://github.com/mxvincent/bun-playground/commit/5f494125741d52c374841be34b2566a673041c87), [`23af85d`](https://github.com/mxvincent/bun-playground/commit/23af85dfca984aa4832011a95f9bacfacfdee00d), [`f811014`](https://github.com/mxvincent/bun-playground/commit/f811014b8d8d5ba9e7668f477ec17b136e9c088a), [`e94fb89`](https://github.com/mxvincent/bun-playground/commit/e94fb89a58b4c022177b528e6a25a48abee75f6f), [`18f53aa`](https://github.com/mxvincent/bun-playground/commit/18f53aa2878de50d0f76fb253cd7975247b1720e), [`d7ffbcf`](https://github.com/mxvincent/bun-playground/commit/d7ffbcf354143823ef2f5ece6bc18dc373fcb8c8), [`72de898`](https://github.com/mxvincent/bun-playground/commit/72de898b9e9be2e158bf511666c5a6434f8b2431), [`b0203a8`](https://github.com/mxvincent/bun-playground/commit/b0203a8871ddee45cd406e1540e000b6db1b1f37), [`058dd92`](https://github.com/mxvincent/bun-playground/commit/058dd92925cd8cb2f69644c6a1db8506eb3da78f), [`71a878c`](https://github.com/mxvincent/bun-playground/commit/71a878c9cac3244e10b8ac9701555d620c3cde96)]:
  - @package/core@0.2.0
  - @package/json-schema@0.2.0

## 0.1.0

### Minor Changes

- [#1](https://github.com/mxvincent/bun-playground/pull/1) [`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297) Thanks [@mxvincent](https://github.com/mxvincent)! - Initial release

### Patch Changes

- Updated dependencies [[`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297)]:
  - @package/json-schema@0.1.0
