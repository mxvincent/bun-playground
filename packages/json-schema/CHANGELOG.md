# @package/json-schema

## 0.2.0

### Minor Changes

- [#59](https://github.com/mxvincent/bun-playground/pull/59) [`18f53aa`](https://github.com/mxvincent/bun-playground/commit/18f53aa2878de50d0f76fb253cd7975247b1720e) Thanks [@mxvincent](https://github.com/mxvincent)! - Remove `JWTConfigSchema`, which nothing used. Import `JWTConfigSchema` from `@package/core` instead: it has one `algorithm` per configuration, with a symmetric variant (`secret`) and an asymmetric one (`jwksUri`).

- [#230](https://github.com/mxvincent/bun-playground/pull/230) [`71a878c`](https://github.com/mxvincent/bun-playground/commit/71a878c9cac3244e10b8ac9701555d620c3cde96) Thanks [@mxvincent](https://github.com/mxvincent)! - Depend on `typebox` 1 instead of `@sinclair/typebox` 0.34. Breaking: `@package/json-schema` re-exports the `typebox` 1 API, so the 0.34 names it no longer has fail to import (`SchemaOptions` and `ObjectOptions` become `TSchemaOptions` and `TObjectOptions`, `Kind` and `JsonTypeBuilder` are gone), and a schema built with `Type.Enum` now emits `enum` without `type` instead of an `anyOf` of typed constants: ajv no longer coerces its values in a querystring, params or headers (`?n=2` no longer matches a numeric enum), and `Schema.Nullable(Type.Enum(...))` no longer compiles. `Schema` is now a plain object that spreads `Type` instead of a `JsonTypeBuilder` instance, so it loses the builders `typebox` 1 no longer has: `Composite`, `Const`, `Not`, `Recursive`, `Transform` and `ReadonlyOptional`. `Schema.Nullable(Schema.Optional(...))` now makes the property required: wrap in the other order, `Schema.Optional(Schema.Nullable(...))`. Validation still runs on ajv. `@application/account` moves to `@fastify/type-provider-typebox` 6, like `@package/fastify-plugins`.

### Patch Changes

- [#69](https://github.com/mxvincent/bun-playground/pull/69) [`d7ffbcf`](https://github.com/mxvincent/bun-playground/commit/d7ffbcf354143823ef2f5ece6bc18dc373fcb8c8) Thanks [@mxvincent](https://github.com/mxvincent)! - `schemas/resource.ts` no longer imports the schema builder, which imports it back. Loading it before the builder threw `Cannot access ... before initialization`.

- [#61](https://github.com/mxvincent/bun-playground/pull/61) [`72de898`](https://github.com/mxvincent/bun-playground/commit/72de898b9e9be2e158bf511666c5a6434f8b2431) Thanks [@mxvincent](https://github.com/mxvincent)! - `validate` and `getValidationFunction` now reuse the validator of a schema. The cache was keyed by an object built on each call: it never hit, and it grew on every call.

- [#62](https://github.com/mxvincent/bun-playground/pull/62) [`b0203a8`](https://github.com/mxvincent/bun-playground/commit/b0203a8871ddee45cd406e1540e000b6db1b1f37) Thanks [@mxvincent](https://github.com/mxvincent)! - `createValidationFunction` and `getValidationFunction` now type the validated payload as `Static<T>` instead of the schema type `T`.

- Updated dependencies [[`5b364a5`](https://github.com/mxvincent/bun-playground/commit/5b364a5ffe8e118ec28f54011b13fd170b898f8c), [`b8d8304`](https://github.com/mxvincent/bun-playground/commit/b8d83041f296ee7cfd3f672502478017c8f1bb22), [`e54b6e7`](https://github.com/mxvincent/bun-playground/commit/e54b6e730e9cdd3231492a67eeb781cf03da7ebd), [`5f49412`](https://github.com/mxvincent/bun-playground/commit/5f494125741d52c374841be34b2566a673041c87), [`23af85d`](https://github.com/mxvincent/bun-playground/commit/23af85dfca984aa4832011a95f9bacfacfdee00d), [`f811014`](https://github.com/mxvincent/bun-playground/commit/f811014b8d8d5ba9e7668f477ec17b136e9c088a), [`e94fb89`](https://github.com/mxvincent/bun-playground/commit/e94fb89a58b4c022177b528e6a25a48abee75f6f), [`8b57bd3`](https://github.com/mxvincent/bun-playground/commit/8b57bd35f20eb3ca8a60f1e5b5072bae9e439df5), [`060805c`](https://github.com/mxvincent/bun-playground/commit/060805cbbaf76ee75508055b22108a11cb706dee), [`6377fc7`](https://github.com/mxvincent/bun-playground/commit/6377fc70d6b3657ac2d65d7846362b2d2be16c19), [`058dd92`](https://github.com/mxvincent/bun-playground/commit/058dd92925cd8cb2f69644c6a1db8506eb3da78f), [`71a878c`](https://github.com/mxvincent/bun-playground/commit/71a878c9cac3244e10b8ac9701555d620c3cde96)]:
  - @package/core@0.2.0
  - @package/errors@0.2.0

## 0.1.0

### Minor Changes

- [#1](https://github.com/mxvincent/bun-playground/pull/1) [`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297) Thanks [@mxvincent](https://github.com/mxvincent)! - Initial release

### Patch Changes

- Updated dependencies [[`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297)]:
  - @package/errors@0.1.0
  - @package/core@0.1.0
