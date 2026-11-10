# @package/query-params-serializer

## 1.1.0

### Minor Changes

- [#130](https://github.com/mxvincent/bun-playground/pull/130) [`c075972`](https://github.com/mxvincent/bun-playground/commit/c0759722329429ea3e18a3dbd18417c63627dc95) Thanks [@mxvincent](https://github.com/mxvincent)! - The filter value encoding is configured once with `configureFilterValueEncoding({ encode, decode })`, and `resetFilterValueEncoding()` restores the default base64url encoding. `serializeFilter`, `serializeFilters` and `parseFilters` always use the configured encoding, so a query string can no longer be serialized and parsed with different encodings.

  Breaking change: the encoder argument of `serializeFilter` / `serializeFilters` and the decoder argument of `parseFilters` are removed. Replace `parseFilters(filters, decode)` with `configureFilterValueEncoding({ encode, decode })` at startup, then `parseFilters(filters)`.

- [#90](https://github.com/mxvincent/bun-playground/pull/90) [`e9be0d8`](https://github.com/mxvincent/bun-playground/commit/e9be0d8903e98444281ef3abf2981e75dc007fd3) Thanks [@mxvincent](https://github.com/mxvincent)! - Filter values are now encoded as base64url (RFC 4648 §5, without padding) by `serializeFilters` / `serializeFilter`, and decoded the same way by `parseFilters`. With `encodeURIComponent`, `(` and `)` in a value cut the parsing of a logical filter and dropped the filters after it, and a client writing a URL had to double-encode `,` `(` `)` `%`, or an `in` filter silently got the wrong values. The base64url alphabet holds none of the separators of the format, so a value is encoded once, whatever it contains. `parseFilters` also rejects unbalanced parentheses.

  Breaking change: a filter value must be base64url, e.g. `equal(status,YWN0aXZl)` for `status = active`. Build query strings with `serializeFilters`, or encode each value with the exported `encodeFilterValue`. Paths, operators and `null` filters are unchanged.

### Patch Changes

- [#92](https://github.com/mxvincent/bun-playground/pull/92) [`5c5791a`](https://github.com/mxvincent/bun-playground/commit/5c5791a7e738295f900d4e4b0ece962ed5bfbc0e) Thanks [@mxvincent](https://github.com/mxvincent)! - `parseFilters` rejects a value filter with more than one value (`equal(a,b,c)`) and a null filter with a value (`null(a,b)`) with a `QueryStringParameterValidationError`. The extra parameters were ignored without error.

- [#91](https://github.com/mxvincent/bun-playground/pull/91) [`43283c2`](https://github.com/mxvincent/bun-playground/commit/43283c2d938a23c611288285276911532065ceec) Thanks [@mxvincent](https://github.com/mxvincent)! - `parseFilters` throws a `QueryStringParameterValidationError` when a filter value cannot be decoded (not base64url, or not UTF-8 text). The decoding error reached HTTP handlers as a 500 instead of a 400.

- [#89](https://github.com/mxvincent/bun-playground/pull/89) [`b1a58dd`](https://github.com/mxvincent/bun-playground/commit/b1a58dd576130c21cc25547e8012b9e6881ef44b) Thanks [@mxvincent](https://github.com/mxvincent)! - `parseSorts` only reads a direction in the `asc(path)` and `desc(path)` forms. A path that starts with `asc` or `desc`, such as `description`, was parsed as `desc(ription)`. A sort with unbalanced parentheses is now ignored like any invalid sort.

- [#230](https://github.com/mxvincent/bun-playground/pull/230) [`71a878c`](https://github.com/mxvincent/bun-playground/commit/71a878c9cac3244e10b8ac9701555d620c3cde96) Thanks [@mxvincent](https://github.com/mxvincent)! - Depend on `typebox` 1 instead of `@sinclair/typebox` 0.34. Breaking: `@package/json-schema` re-exports the `typebox` 1 API, so the 0.34 names it no longer has fail to import (`SchemaOptions` and `ObjectOptions` become `TSchemaOptions` and `TObjectOptions`, `Kind` and `JsonTypeBuilder` are gone), and a schema built with `Type.Enum` now emits `enum` without `type` instead of an `anyOf` of typed constants: ajv no longer coerces its values in a querystring, params or headers (`?n=2` no longer matches a numeric enum), and `Schema.Nullable(Type.Enum(...))` no longer compiles. `Schema` is now a plain object that spreads `Type` instead of a `JsonTypeBuilder` instance, so it loses the builders `typebox` 1 no longer has: `Composite`, `Const`, `Not`, `Recursive`, `Transform` and `ReadonlyOptional`. `Schema.Nullable(Schema.Optional(...))` now makes the property required: wrap in the other order, `Schema.Optional(Schema.Nullable(...))`. Validation still runs on ajv. `@application/account` moves to `@fastify/type-provider-typebox` 6, like `@package/fastify-plugins`.

- Updated dependencies [[`5b364a5`](https://github.com/mxvincent/bun-playground/commit/5b364a5ffe8e118ec28f54011b13fd170b898f8c), [`b8d8304`](https://github.com/mxvincent/bun-playground/commit/b8d83041f296ee7cfd3f672502478017c8f1bb22), [`e54b6e7`](https://github.com/mxvincent/bun-playground/commit/e54b6e730e9cdd3231492a67eeb781cf03da7ebd), [`5f49412`](https://github.com/mxvincent/bun-playground/commit/5f494125741d52c374841be34b2566a673041c87), [`23af85d`](https://github.com/mxvincent/bun-playground/commit/23af85dfca984aa4832011a95f9bacfacfdee00d), [`f811014`](https://github.com/mxvincent/bun-playground/commit/f811014b8d8d5ba9e7668f477ec17b136e9c088a), [`e94fb89`](https://github.com/mxvincent/bun-playground/commit/e94fb89a58b4c022177b528e6a25a48abee75f6f), [`8b57bd3`](https://github.com/mxvincent/bun-playground/commit/8b57bd35f20eb3ca8a60f1e5b5072bae9e439df5), [`060805c`](https://github.com/mxvincent/bun-playground/commit/060805cbbaf76ee75508055b22108a11cb706dee), [`6377fc7`](https://github.com/mxvincent/bun-playground/commit/6377fc70d6b3657ac2d65d7846362b2d2be16c19), [`18f53aa`](https://github.com/mxvincent/bun-playground/commit/18f53aa2878de50d0f76fb253cd7975247b1720e), [`d7ffbcf`](https://github.com/mxvincent/bun-playground/commit/d7ffbcf354143823ef2f5ece6bc18dc373fcb8c8), [`72de898`](https://github.com/mxvincent/bun-playground/commit/72de898b9e9be2e158bf511666c5a6434f8b2431), [`b0203a8`](https://github.com/mxvincent/bun-playground/commit/b0203a8871ddee45cd406e1540e000b6db1b1f37), [`154d4c5`](https://github.com/mxvincent/bun-playground/commit/154d4c5fc5f11fe247aaaca72438b73edcba9dc9), [`310e137`](https://github.com/mxvincent/bun-playground/commit/310e137ea472f766e390e1df85563bab65a46227), [`8275fc8`](https://github.com/mxvincent/bun-playground/commit/8275fc86c0fe5b4edd5024866dc90c702acf1120), [`058dd92`](https://github.com/mxvincent/bun-playground/commit/058dd92925cd8cb2f69644c6a1db8506eb3da78f), [`71a878c`](https://github.com/mxvincent/bun-playground/commit/71a878c9cac3244e10b8ac9701555d620c3cde96)]:
  - @package/core@0.2.0
  - @package/errors@0.2.0
  - @package/json-schema@0.2.0
  - @package/query-params@0.1.2

## 1.0.1

### Patch Changes

- Updated dependencies [[`e84cc5c`](https://github.com/mxvincent/bun-playground/commit/e84cc5cf0e5b55dd7ae158eb111a0774998251fa), [`57a22f0`](https://github.com/mxvincent/bun-playground/commit/57a22f0aedd5631908ef0706a35c00f06324f578)]:
  - @package/query-params@0.1.1

## 1.0.0

### Minor Changes

- [#1](https://github.com/mxvincent/bun-playground/pull/1) [`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297) Thanks [@mxvincent](https://github.com/mxvincent)! - Initial release

### Patch Changes

- Updated dependencies [[`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297)]:
  - @package/query-params@0.1.0
  - @package/json-schema@0.1.0
  - @package/errors@0.1.0
  - @package/core@0.1.0
