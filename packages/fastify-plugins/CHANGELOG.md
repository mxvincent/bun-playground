# @package/fastify-plugins

## 2.0.0

### Patch Changes

- [#194](https://github.com/mxvincent/bun-playground/pull/194) [`27b58ae`](https://github.com/mxvincent/bun-playground/commit/27b58ae07516e678d5fb57d09f08df7ec8970eac) Thanks [@mxvincent](https://github.com/mxvincent)! - `fastifyAuth` no longer authenticates every request as the hard-coded user `123`: it decorates `request.actor` with `null`, an anonymous request, until a real authentication sets it. It decorated `auth` instead of `actor`.

- [#196](https://github.com/mxvincent/bun-playground/pull/196) [`33faf16`](https://github.com/mxvincent/bun-playground/commit/33faf165e985aaf9343bb79a7b7f513a32db1b34) Thanks [@mxvincent](https://github.com/mxvincent)! - The request context reads the actor of the request when it is used. It copied `request.actor` in its own `onRequest` hook, so when it was registered before the authentication, the actor stayed `null` for the whole request. `fastifyRequestLogger` writes the `Request started` log in a `preParsing` hook instead of an `onRequest` hook, so that it runs after the authentication and logs the actor whatever the plugin order. A request rejected by an `onRequest` hook (e.g. a failed authentication) now only has the `Request completed` log, and no log at all when that hook is registered before `fastifyRequestContext`: register the context first.

- [#197](https://github.com/mxvincent/bun-playground/pull/197) [`6647f2c`](https://github.com/mxvincent/bun-playground/commit/6647f2c63cf878b32db0a33c019ee889b9f25a2c) Thanks [@mxvincent](https://github.com/mxvincent)! - `fastifyErrorHandler` no longer prints `BaseError` bodies with `console.log`, and only logs unexpected errors (those answered with a 5xx) as `Unhandled error`. Expected errors, a 4xx `BaseError` such as a 404 or a Fastify client error, are already logged as warnings by `fastifyRequestLogger`.

- [#195](https://github.com/mxvincent/bun-playground/pull/195) [`447fe81`](https://github.com/mxvincent/bun-playground/commit/447fe810ea74c4d18224489183e20b2688d6e609) Thanks [@mxvincent](https://github.com/mxvincent)! - `fastifyErrorHandler` responds to an unexpected error with a generic `InternalServerError` body (500, `Internal server error`) instead of the error message, which could expose internal details such as SQL errors or upstream hosts. Only `BaseError` responses and Fastify client errors (a `FST_` code with a 4xx status, e.g. validation) keep their response: any other error, even one that carries its own status code (e.g. an HTTP client error about an upstream call), now answers a 500.

- [#198](https://github.com/mxvincent/bun-playground/pull/198) [`d971d1c`](https://github.com/mxvincent/bun-playground/commit/d971d1cebbd1ff90df211f853cdd49fb8023af4a) Thanks [@mxvincent](https://github.com/mxvincent)! - Remove the `@package/core` dependency, which the package does not import.

- Updated dependencies [[`8b57bd3`](https://github.com/mxvincent/bun-playground/commit/8b57bd35f20eb3ca8a60f1e5b5072bae9e439df5), [`060805c`](https://github.com/mxvincent/bun-playground/commit/060805cbbaf76ee75508055b22108a11cb706dee), [`6377fc7`](https://github.com/mxvincent/bun-playground/commit/6377fc70d6b3657ac2d65d7846362b2d2be16c19), [`18f53aa`](https://github.com/mxvincent/bun-playground/commit/18f53aa2878de50d0f76fb253cd7975247b1720e), [`d7ffbcf`](https://github.com/mxvincent/bun-playground/commit/d7ffbcf354143823ef2f5ece6bc18dc373fcb8c8), [`72de898`](https://github.com/mxvincent/bun-playground/commit/72de898b9e9be2e158bf511666c5a6434f8b2431), [`b0203a8`](https://github.com/mxvincent/bun-playground/commit/b0203a8871ddee45cd406e1540e000b6db1b1f37), [`2736e1b`](https://github.com/mxvincent/bun-playground/commit/2736e1b9c24419f43c4a3e7e62a892eb1aca11c7), [`96d326a`](https://github.com/mxvincent/bun-playground/commit/96d326a3319c4db27f3dadfc02c388c9bbe2106d), [`1476111`](https://github.com/mxvincent/bun-playground/commit/14761117ec7a38a4d0c45fcae50218349fd6cb32), [`058dd92`](https://github.com/mxvincent/bun-playground/commit/058dd92925cd8cb2f69644c6a1db8506eb3da78f), [`d9631ae`](https://github.com/mxvincent/bun-playground/commit/d9631aee093dd1244617064d14e828cf721e6f53), [`71a878c`](https://github.com/mxvincent/bun-playground/commit/71a878c9cac3244e10b8ac9701555d620c3cde96)]:
  - @package/errors@0.2.0
  - @package/json-schema@0.2.0
  - @package/telemetry@0.2.0

## 1.0.0

### Minor Changes

- [#1](https://github.com/mxvincent/bun-playground/pull/1) [`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297) Thanks [@mxvincent](https://github.com/mxvincent)! - Initial release

### Patch Changes

- Updated dependencies [[`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297)]:
  - @package/json-schema@0.1.0
  - @package/telemetry@0.1.0
  - @package/errors@0.1.0
  - @package/core@0.1.0
