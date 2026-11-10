# @application/account

## 0.1.2

### Patch Changes

- [#230](https://github.com/mxvincent/bun-playground/pull/230) [`71a878c`](https://github.com/mxvincent/bun-playground/commit/71a878c9cac3244e10b8ac9701555d620c3cde96) Thanks [@mxvincent](https://github.com/mxvincent)! - Depend on `typebox` 1 instead of `@sinclair/typebox` 0.34. Breaking: `@package/json-schema` re-exports the `typebox` 1 API, so the 0.34 names it no longer has fail to import (`SchemaOptions` and `ObjectOptions` become `TSchemaOptions` and `TObjectOptions`, `Kind` and `JsonTypeBuilder` are gone), and a schema built with `Type.Enum` now emits `enum` without `type` instead of an `anyOf` of typed constants: ajv no longer coerces its values in a querystring, params or headers (`?n=2` no longer matches a numeric enum), and `Schema.Nullable(Type.Enum(...))` no longer compiles. `Schema` is now a plain object that spreads `Type` instead of a `JsonTypeBuilder` instance, so it loses the builders `typebox` 1 no longer has: `Composite`, `Const`, `Not`, `Recursive`, `Transform` and `ReadonlyOptional`. `Schema.Nullable(Schema.Optional(...))` now makes the property required: wrap in the other order, `Schema.Optional(Schema.Nullable(...))`. Validation still runs on ajv. `@application/account` moves to `@fastify/type-provider-typebox` 6, like `@package/fastify-plugins`.

- Updated dependencies [[`5b364a5`](https://github.com/mxvincent/bun-playground/commit/5b364a5ffe8e118ec28f54011b13fd170b898f8c), [`b8d8304`](https://github.com/mxvincent/bun-playground/commit/b8d83041f296ee7cfd3f672502478017c8f1bb22), [`e54b6e7`](https://github.com/mxvincent/bun-playground/commit/e54b6e730e9cdd3231492a67eeb781cf03da7ebd), [`5f49412`](https://github.com/mxvincent/bun-playground/commit/5f494125741d52c374841be34b2566a673041c87), [`23af85d`](https://github.com/mxvincent/bun-playground/commit/23af85dfca984aa4832011a95f9bacfacfdee00d), [`f811014`](https://github.com/mxvincent/bun-playground/commit/f811014b8d8d5ba9e7668f477ec17b136e9c088a), [`e94fb89`](https://github.com/mxvincent/bun-playground/commit/e94fb89a58b4c022177b528e6a25a48abee75f6f), [`9e32a91`](https://github.com/mxvincent/bun-playground/commit/9e32a9102ee7715963dd4b19e9347616ccba6e52), [`38871ac`](https://github.com/mxvincent/bun-playground/commit/38871ac84b7f1d22f68829abe76b3950e8120bdf), [`619a029`](https://github.com/mxvincent/bun-playground/commit/619a029b01880732f70e253cbc716a8dcda99f37), [`8fe4c30`](https://github.com/mxvincent/bun-playground/commit/8fe4c30c7e2e423cbc8be04d44915569bec5d7b8), [`eb8becf`](https://github.com/mxvincent/bun-playground/commit/eb8becf51aab8199a15bbaf678f20b4e23ae49c5), [`804fdd9`](https://github.com/mxvincent/bun-playground/commit/804fdd9b46dd44d3b0ba606cafa4fc9edc9b9fd1), [`876fcab`](https://github.com/mxvincent/bun-playground/commit/876fcabd54b1a12d7e210a4c7435ef72a7cd3e53), [`28febe5`](https://github.com/mxvincent/bun-playground/commit/28febe553a4bf258af5b5573bfb2f312504d2c82), [`033a7d9`](https://github.com/mxvincent/bun-playground/commit/033a7d9716ebd69b194ffff25a500ab2ecc51a60), [`dfac374`](https://github.com/mxvincent/bun-playground/commit/dfac374268bd93adde14ad67080b05e39369aa82), [`8831ef2`](https://github.com/mxvincent/bun-playground/commit/8831ef2df76ee4431c6df8f747656a022e801b3c), [`9c06e5c`](https://github.com/mxvincent/bun-playground/commit/9c06e5c0e3f01f29efe2191aa016966d16a24ebc), [`ffe9392`](https://github.com/mxvincent/bun-playground/commit/ffe9392760039ab2f21d21176b1bb4e26c6e361d), [`58d7c2b`](https://github.com/mxvincent/bun-playground/commit/58d7c2bd917f005b1fb2ec1e2ad0743355d37a0e), [`32f6764`](https://github.com/mxvincent/bun-playground/commit/32f6764d443d60d100aacf35c42f9ac10ed56002), [`fe0d728`](https://github.com/mxvincent/bun-playground/commit/fe0d728020ccc7a2d84815b17d0a1eb7764b4a8e), [`9a4db13`](https://github.com/mxvincent/bun-playground/commit/9a4db13e21e251eff4e8eef08df747dd4c6d7f61), [`8b57bd3`](https://github.com/mxvincent/bun-playground/commit/8b57bd35f20eb3ca8a60f1e5b5072bae9e439df5), [`060805c`](https://github.com/mxvincent/bun-playground/commit/060805cbbaf76ee75508055b22108a11cb706dee), [`6377fc7`](https://github.com/mxvincent/bun-playground/commit/6377fc70d6b3657ac2d65d7846362b2d2be16c19), [`27b58ae`](https://github.com/mxvincent/bun-playground/commit/27b58ae07516e678d5fb57d09f08df7ec8970eac), [`33faf16`](https://github.com/mxvincent/bun-playground/commit/33faf165e985aaf9343bb79a7b7f513a32db1b34), [`6647f2c`](https://github.com/mxvincent/bun-playground/commit/6647f2c63cf878b32db0a33c019ee889b9f25a2c), [`447fe81`](https://github.com/mxvincent/bun-playground/commit/447fe810ea74c4d18224489183e20b2688d6e609), [`d971d1c`](https://github.com/mxvincent/bun-playground/commit/d971d1cebbd1ff90df211f853cdd49fb8023af4a), [`18f53aa`](https://github.com/mxvincent/bun-playground/commit/18f53aa2878de50d0f76fb253cd7975247b1720e), [`d7ffbcf`](https://github.com/mxvincent/bun-playground/commit/d7ffbcf354143823ef2f5ece6bc18dc373fcb8c8), [`72de898`](https://github.com/mxvincent/bun-playground/commit/72de898b9e9be2e158bf511666c5a6434f8b2431), [`b0203a8`](https://github.com/mxvincent/bun-playground/commit/b0203a8871ddee45cd406e1540e000b6db1b1f37), [`154d4c5`](https://github.com/mxvincent/bun-playground/commit/154d4c5fc5f11fe247aaaca72438b73edcba9dc9), [`310e137`](https://github.com/mxvincent/bun-playground/commit/310e137ea472f766e390e1df85563bab65a46227), [`8275fc8`](https://github.com/mxvincent/bun-playground/commit/8275fc86c0fe5b4edd5024866dc90c702acf1120), [`5c5791a`](https://github.com/mxvincent/bun-playground/commit/5c5791a7e738295f900d4e4b0ece962ed5bfbc0e), [`43283c2`](https://github.com/mxvincent/bun-playground/commit/43283c2d938a23c611288285276911532065ceec), [`c075972`](https://github.com/mxvincent/bun-playground/commit/c0759722329429ea3e18a3dbd18417c63627dc95), [`e9be0d8`](https://github.com/mxvincent/bun-playground/commit/e9be0d8903e98444281ef3abf2981e75dc007fd3), [`b1a58dd`](https://github.com/mxvincent/bun-playground/commit/b1a58dd576130c21cc25547e8012b9e6881ef44b), [`2736e1b`](https://github.com/mxvincent/bun-playground/commit/2736e1b9c24419f43c4a3e7e62a892eb1aca11c7), [`96d326a`](https://github.com/mxvincent/bun-playground/commit/96d326a3319c4db27f3dadfc02c388c9bbe2106d), [`1476111`](https://github.com/mxvincent/bun-playground/commit/14761117ec7a38a4d0c45fcae50218349fd6cb32), [`058dd92`](https://github.com/mxvincent/bun-playground/commit/058dd92925cd8cb2f69644c6a1db8506eb3da78f), [`d9631ae`](https://github.com/mxvincent/bun-playground/commit/d9631aee093dd1244617064d14e828cf721e6f53), [`71a878c`](https://github.com/mxvincent/bun-playground/commit/71a878c9cac3244e10b8ac9701555d620c3cde96)]:
  - @package/core@0.2.0
  - @package/database@0.3.0
  - @package/drizzle@0.2.0
  - @package/errors@0.2.0
  - @package/fastify-plugins@2.0.0
  - @package/json-schema@0.2.0
  - @package/query-params@0.1.2
  - @package/query-params-serializer@1.1.0
  - @package/telemetry@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`d5721ff`](https://github.com/mxvincent/bun-playground/commit/d5721ffca1e36957cf3166697521fe29321b3058), [`d5721ff`](https://github.com/mxvincent/bun-playground/commit/d5721ffca1e36957cf3166697521fe29321b3058), [`e84cc5c`](https://github.com/mxvincent/bun-playground/commit/e84cc5cf0e5b55dd7ae158eb111a0774998251fa), [`57a22f0`](https://github.com/mxvincent/bun-playground/commit/57a22f0aedd5631908ef0706a35c00f06324f578), [`23367cd`](https://github.com/mxvincent/bun-playground/commit/23367cd23733b5e4c32cac789cd3612e5c7ab416), [`936b81a`](https://github.com/mxvincent/bun-playground/commit/936b81ae67377342b1908e28db4c88efa5d09df5)]:
  - @package/database@0.2.0
  - @package/drizzle@0.1.1
  - @package/query-params@0.1.1
  - @package/query-params-serializer@1.0.1

## 0.1.0

### Minor Changes

- [#1](https://github.com/mxvincent/bun-playground/pull/1) [`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297) Thanks [@mxvincent](https://github.com/mxvincent)! - Initial release

### Patch Changes

- Updated dependencies [[`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297)]:
  - @package/query-params-serializer@1.0.0
  - @package/fastify-plugins@1.0.0
  - @package/query-params@0.1.0
  - @package/json-schema@0.1.0
  - @package/telemetry@0.1.0
  - @package/database@0.1.0
  - @package/drizzle@0.1.0
  - @domain/account@0.1.0
  - @package/errors@0.1.0
  - @package/core@0.1.0
