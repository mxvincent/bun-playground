# @package/core

## 0.2.0

### Minor Changes

- [#44](https://github.com/mxvincent/bun-playground/pull/44) [`e94fb89`](https://github.com/mxvincent/bun-playground/commit/e94fb89a58b4c022177b528e6a25a48abee75f6f) Thanks [@mxvincent](https://github.com/mxvincent)! - Rename `removeUndefined` to `stripUndefinedValues`, and its type `RemoveUndefined` to `StripUndefinedValues`. `removeUndefined` stays available as a deprecated alias: replace `removeUndefined(value)` with `stripUndefinedValues(value)` before it is removed.

- [#230](https://github.com/mxvincent/bun-playground/pull/230) [`71a878c`](https://github.com/mxvincent/bun-playground/commit/71a878c9cac3244e10b8ac9701555d620c3cde96) Thanks [@mxvincent](https://github.com/mxvincent)! - Depend on `typebox` 1 instead of `@sinclair/typebox` 0.34. Breaking: `@package/json-schema` re-exports the `typebox` 1 API, so the 0.34 names it no longer has fail to import (`SchemaOptions` and `ObjectOptions` become `TSchemaOptions` and `TObjectOptions`, `Kind` and `JsonTypeBuilder` are gone), and a schema built with `Type.Enum` now emits `enum` without `type` instead of an `anyOf` of typed constants: ajv no longer coerces its values in a querystring, params or headers (`?n=2` no longer matches a numeric enum), and `Schema.Nullable(Type.Enum(...))` no longer compiles. `Schema` is now a plain object that spreads `Type` instead of a `JsonTypeBuilder` instance, so it loses the builders `typebox` 1 no longer has: `Composite`, `Const`, `Not`, `Recursive`, `Transform` and `ReadonlyOptional`. `Schema.Nullable(Schema.Optional(...))` now makes the property required: wrap in the other order, `Schema.Optional(Schema.Nullable(...))`. Validation still runs on ajv. `@application/account` moves to `@fastify/type-provider-typebox` 6, like `@package/fastify-plugins`.

### Patch Changes

- [#37](https://github.com/mxvincent/bun-playground/pull/37) [`5b364a5`](https://github.com/mxvincent/bun-playground/commit/5b364a5ffe8e118ec28f54011b13fd170b898f8c) Thanks [@mxvincent](https://github.com/mxvincent)! - `assertArray` now throws `Value should be an array` instead of `Value should be a string`.

- [#68](https://github.com/mxvincent/bun-playground/pull/68) [`b8d8304`](https://github.com/mxvincent/bun-playground/commit/b8d83041f296ee7cfd3f672502478017c8f1bb22) Thanks [@mxvincent](https://github.com/mxvincent)! - `ASYMMETRIC_ALGORITHMS` now lists the RSA, ECDSA and RSA-PSS algorithms. It listed the HMAC algorithms, like `SYMMETRIC_ALGORITHMS`.

- [#47](https://github.com/mxvincent/bun-playground/pull/47) [`e54b6e7`](https://github.com/mxvincent/bun-playground/commit/e54b6e730e9cdd3231492a67eeb781cf03da7ebd) Thanks [@mxvincent](https://github.com/mxvincent)! - `getKeyAndVerify` now verifies a token without `kid` header by trying every key of the JWKS. Such a token was always rejected with `Key id header is missing`.

- [#36](https://github.com/mxvincent/bun-playground/pull/36) [`5f49412`](https://github.com/mxvincent/bun-playground/commit/5f494125741d52c374841be34b2566a673041c87) Thanks [@mxvincent](https://github.com/mxvincent)! - `invariant` now only rejects `undefined` and `null`. It returned an error for `0`, `''` and `false`, which also made `randomArrayItem` throw on those values.

- [#35](https://github.com/mxvincent/bun-playground/pull/35) [`23af85d`](https://github.com/mxvincent/bun-playground/commit/23af85dfca984aa4832011a95f9bacfacfdee00d) Thanks [@mxvincent](https://github.com/mxvincent)! - `beforeProcessShutdown` now calls the registered teardown functions on `SIGINT` and `SIGTERM`. They were never called before.

- [#43](https://github.com/mxvincent/bun-playground/pull/43) [`f811014`](https://github.com/mxvincent/bun-playground/commit/f811014b8d8d5ba9e7668f477ec17b136e9c088a) Thanks [@mxvincent](https://github.com/mxvincent)! - `removeUndefined` keeps class instances (`Date`, `Map`, `Buffer`…) as they are instead of replacing them with `{}`, and only traverses plain objects and arrays. Its result type now removes the properties typed `undefined`, makes the possibly undefined ones optional, and keeps `null`.

- [#184](https://github.com/mxvincent/bun-playground/pull/184) [`058dd92`](https://github.com/mxvincent/bun-playground/commit/058dd92925cd8cb2f69644c6a1db8506eb3da78f) Thanks [@mxvincent](https://github.com/mxvincent)! - The OpenTelemetry SDK shuts down on `SIGINT` too, flushing the pending spans: it only listened to `SIGTERM`, so a Ctrl-C dropped them. The shutdown is registered with `beforeProcessShutdown` of `@package/core` (a new dependency): on `SIGINT` or `SIGTERM`, the process waits for the SDK and the other teardown functions, then exits with code 0. Before, the `SIGTERM` listener kept the process alive after the shutdown.

  `@package/core` now adds its `SIGINT` and `SIGTERM` listeners when the first teardown function is registered with `beforeProcessShutdown`, not when the module is loaded. Before, importing `@package/core` (and now `@package/telemetry`) without registering a teardown function added listeners that did nothing, so `SIGINT` and `SIGTERM` no longer stopped the process.

- Updated dependencies [[`8b57bd3`](https://github.com/mxvincent/bun-playground/commit/8b57bd35f20eb3ca8a60f1e5b5072bae9e439df5), [`060805c`](https://github.com/mxvincent/bun-playground/commit/060805cbbaf76ee75508055b22108a11cb706dee), [`6377fc7`](https://github.com/mxvincent/bun-playground/commit/6377fc70d6b3657ac2d65d7846362b2d2be16c19)]:
  - @package/errors@0.2.0

## 0.1.0

### Minor Changes

- [#1](https://github.com/mxvincent/bun-playground/pull/1) [`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297) Thanks [@mxvincent](https://github.com/mxvincent)! - Initial release

### Patch Changes

- Updated dependencies [[`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297)]:
  - @package/errors@0.1.0
