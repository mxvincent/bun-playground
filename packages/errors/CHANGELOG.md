# @package/errors

## 0.2.0

### Minor Changes

- [#168](https://github.com/mxvincent/bun-playground/pull/168) [`060805c`](https://github.com/mxvincent/bun-playground/commit/060805cbbaf76ee75508055b22108a11cb706dee) Thanks [@mxvincent](https://github.com/mxvincent)! - `ResourceNotFoundError.fromFilters(type, filters)` describes a resource looked up by filters: `toJSON()` returns `resource: { type, filters }` with each filter serialized by its `toJSON()`, and `toString()` prints the filters as JSON. The id of the constructor becomes optional: without an id or filters, `toJSON()` returns `resource: { type }` and `toString()` appends nothing to the message.

### Patch Changes

- [#52](https://github.com/mxvincent/bun-playground/pull/52) [`8b57bd3`](https://github.com/mxvincent/bun-playground/commit/8b57bd35f20eb3ca8a60f1e5b5072bae9e439df5) Thanks [@mxvincent](https://github.com/mxvincent)! - Error classes now report the name of their concrete class (`NotFoundError`, `ConflictError`…) as `name`, instead of `Error`. Stack traces and logs show it.

- [#53](https://github.com/mxvincent/bun-playground/pull/53) [`6377fc7`](https://github.com/mxvincent/bun-playground/commit/6377fc70d6b3657ac2d65d7846362b2d2be16c19) Thanks [@mxvincent](https://github.com/mxvincent)! - `ResourceNotFoundError.toString()` now follows the `[CODE] message` format of the other errors (`[RESOURCE_NOT_FOUND] Resource not found: id-1`) and serializes the nested values of an object id as JSON instead of `[object Object]`.

## 0.1.0

### Minor Changes

- [#1](https://github.com/mxvincent/bun-playground/pull/1) [`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297) Thanks [@mxvincent](https://github.com/mxvincent)! - Initial release
