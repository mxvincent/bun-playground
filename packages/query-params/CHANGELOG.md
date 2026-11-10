# @package/query-params

## 0.1.2

### Patch Changes

- [#75](https://github.com/mxvincent/bun-playground/pull/75) [`154d4c5`](https://github.com/mxvincent/bun-playground/commit/154d4c5fc5f11fe247aaaca72438b73edcba9dc9) Thanks [@mxvincent](https://github.com/mxvincent)! - `isSort` now returns `true` for `Sort` instances. It only accepted plain objects, so `isSort(Sort.asc('path'))` returned `false`.

- [#76](https://github.com/mxvincent/bun-playground/pull/76) [`310e137`](https://github.com/mxvincent/bun-playground/commit/310e137ea472f766e390e1df85563bab65a46227) Thanks [@mxvincent](https://github.com/mxvincent)! - `Pagination.take` now falls back to `DEFAULT_PAGE_SIZE` when the page size is `NaN`, and floors decimal page sizes. `?take=abc` produced a `NaN` page size.

- [#77](https://github.com/mxvincent/bun-playground/pull/77) [`8275fc8`](https://github.com/mxvincent/bun-playground/commit/8275fc86c0fe5b4edd5024866dc90c702acf1120) Thanks [@mxvincent](https://github.com/mxvincent)! - `removeDuplicatedFilters` now only removes identical filters (same operator, path and value). It kept a single comparison filter per path, which dropped conditions such as `a notEqual 2` next to `a equal 1`. It also returns new logical filters instead of mutating the given ones, and keeps the order of the filters.

- Updated dependencies [[`5b364a5`](https://github.com/mxvincent/bun-playground/commit/5b364a5ffe8e118ec28f54011b13fd170b898f8c), [`b8d8304`](https://github.com/mxvincent/bun-playground/commit/b8d83041f296ee7cfd3f672502478017c8f1bb22), [`e54b6e7`](https://github.com/mxvincent/bun-playground/commit/e54b6e730e9cdd3231492a67eeb781cf03da7ebd), [`5f49412`](https://github.com/mxvincent/bun-playground/commit/5f494125741d52c374841be34b2566a673041c87), [`23af85d`](https://github.com/mxvincent/bun-playground/commit/23af85dfca984aa4832011a95f9bacfacfdee00d), [`f811014`](https://github.com/mxvincent/bun-playground/commit/f811014b8d8d5ba9e7668f477ec17b136e9c088a), [`e94fb89`](https://github.com/mxvincent/bun-playground/commit/e94fb89a58b4c022177b528e6a25a48abee75f6f), [`058dd92`](https://github.com/mxvincent/bun-playground/commit/058dd92925cd8cb2f69644c6a1db8506eb3da78f), [`71a878c`](https://github.com/mxvincent/bun-playground/commit/71a878c9cac3244e10b8ac9701555d620c3cde96)]:
  - @package/core@0.2.0

## 0.1.1

### Patch Changes

- [#11](https://github.com/mxvincent/bun-playground/pull/11) [`e84cc5c`](https://github.com/mxvincent/bun-playground/commit/e84cc5cf0e5b55dd7ae158eb111a0774998251fa) Thanks [@mxvincent](https://github.com/mxvincent)! - Use json format for cursor parts

- [#10](https://github.com/mxvincent/bun-playground/pull/10) [`57a22f0`](https://github.com/mxvincent/bun-playground/commit/57a22f0aedd5631908ef0706a35c00f06324f578) Thanks [@mxvincent](https://github.com/mxvincent)! - Limit pagination size to 100

## 0.1.0

### Minor Changes

- [#1](https://github.com/mxvincent/bun-playground/pull/1) [`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297) Thanks [@mxvincent](https://github.com/mxvincent)! - Initial release

### Patch Changes

- Updated dependencies [[`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297)]:
  - @package/core@0.1.0
