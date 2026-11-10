---
"@package/core": minor
"@package/json-schema": minor
"@package/query-params-serializer": patch
"@application/account": patch
---

Depend on `typebox` 1 instead of `@sinclair/typebox` 0.34. Breaking: `@package/json-schema` re-exports the `typebox` 1 API, so the 0.34 names it no longer has fail to import (`SchemaOptions` and `ObjectOptions` become `TSchemaOptions` and `TObjectOptions`, `Kind` and `JsonTypeBuilder` are gone), and a schema built with `Type.Enum` now emits `enum` without `type` instead of an `anyOf` of typed constants: ajv no longer coerces its values in a querystring, params or headers (`?n=2` no longer matches a numeric enum), and `Schema.Nullable(Type.Enum(...))` no longer compiles. `Schema` is now a plain object that spreads `Type` instead of a `JsonTypeBuilder` instance, so it loses the builders `typebox` 1 no longer has: `Composite`, `Const`, `Not`, `Recursive`, `Transform` and `ReadonlyOptional`. `Schema.Nullable(Schema.Optional(...))` now makes the property required: wrap in the other order, `Schema.Optional(Schema.Nullable(...))`. Validation still runs on ajv. `@application/account` moves to `@fastify/type-provider-typebox` 6, like `@package/fastify-plugins`.
