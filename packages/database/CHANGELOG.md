# @package/database

## 0.3.0

### Minor Changes

- [#169](https://github.com/mxvincent/bun-playground/pull/169) [`eb8becf`](https://github.com/mxvincent/bun-playground/commit/eb8becf51aab8199a15bbaf678f20b4e23ae49c5) Thanks [@mxvincent](https://github.com/mxvincent)! - Remove `EntityNotFoundError`: throw `ResourceNotFoundError.fromFilters(type, filters)` from `@package/errors` when a lookup by filters finds nothing. Replace `new EntityNotFoundError('Organization', filters)` with `ResourceNotFoundError.fromFilters('Organization', filters)`. The `toJSON()` of the thrown error changes from `{ code: 'ENTITY_NOT_FOUND', filters }` to `{ code: 'RESOURCE_NOT_FOUND', resource: { type, filters } }`.

### Patch Changes

- [#108](https://github.com/mxvincent/bun-playground/pull/108) [`9e32a91`](https://github.com/mxvincent/bun-playground/commit/9e32a9102ee7715963dd4b19e9347616ccba6e52) Thanks [@mxvincent](https://github.com/mxvincent)! - `ArrayPager.getPage` returns the total count on a page after the last item, and `null` when the count is not requested. It returned `0` in both cases.

- [#107](https://github.com/mxvincent/bun-playground/pull/107) [`38871ac`](https://github.com/mxvincent/bun-playground/commit/38871ac84b7f1d22f68829abe76b3950e8120bdf) Thanks [@mxvincent](https://github.com/mxvincent)! - `filterArrayWith` handles boolean values: `null`/`notNull` see `true` and `false` as values, and `equal('active', 'false')` matches `false`. Booleans were treated as missing values.

- [#109](https://github.com/mxvincent/bun-playground/pull/109) [`619a029`](https://github.com/mxvincent/bun-playground/commit/619a029b01880732f70e253cbc716a8dcda99f37) Thanks [@mxvincent](https://github.com/mxvincent)! - `createAuthors` spreads the authors over every gender. It picked the gender from the number of authors, so every author of a dataset had the same gender.

- [#112](https://github.com/mxvincent/bun-playground/pull/112) [`8fe4c30`](https://github.com/mxvincent/bun-playground/commit/8fe4c30c7e2e423cbc8be04d44915569bec5d7b8) Thanks [@mxvincent](https://github.com/mxvincent)! - The in-memory `like` and `notLike` filters interpret the value as a SQL `LIKE` pattern, like the `typeorm` and `drizzle` adapters: `%` matches any sequence, `_` any single character, and `\` escapes them. They matched substrings, so `like('name', 'a')` matched every name containing `a`. To keep matching substrings, wrap the value: `like('name', '%a%')`.

- [#106](https://github.com/mxvincent/bun-playground/pull/106) [`804fdd9`](https://github.com/mxvincent/bun-playground/commit/804fdd9b46dd44d3b0ba606cafa4fc9edc9b9fd1) Thanks [@mxvincent](https://github.com/mxvincent)! - `filterArrayWith` compares filter values by the type of the item value: numbers as numbers, dates as timestamps. It compared them as strings, so `greaterThan('age', '9')` missed `age = 10`, and a date filter written without milliseconds matched nothing. A filter value that cannot be parsed as the item type matches nothing.

- Updated dependencies [[`5b364a5`](https://github.com/mxvincent/bun-playground/commit/5b364a5ffe8e118ec28f54011b13fd170b898f8c), [`b8d8304`](https://github.com/mxvincent/bun-playground/commit/b8d83041f296ee7cfd3f672502478017c8f1bb22), [`e54b6e7`](https://github.com/mxvincent/bun-playground/commit/e54b6e730e9cdd3231492a67eeb781cf03da7ebd), [`5f49412`](https://github.com/mxvincent/bun-playground/commit/5f494125741d52c374841be34b2566a673041c87), [`23af85d`](https://github.com/mxvincent/bun-playground/commit/23af85dfca984aa4832011a95f9bacfacfdee00d), [`f811014`](https://github.com/mxvincent/bun-playground/commit/f811014b8d8d5ba9e7668f477ec17b136e9c088a), [`e94fb89`](https://github.com/mxvincent/bun-playground/commit/e94fb89a58b4c022177b528e6a25a48abee75f6f), [`154d4c5`](https://github.com/mxvincent/bun-playground/commit/154d4c5fc5f11fe247aaaca72438b73edcba9dc9), [`310e137`](https://github.com/mxvincent/bun-playground/commit/310e137ea472f766e390e1df85563bab65a46227), [`8275fc8`](https://github.com/mxvincent/bun-playground/commit/8275fc86c0fe5b4edd5024866dc90c702acf1120), [`058dd92`](https://github.com/mxvincent/bun-playground/commit/058dd92925cd8cb2f69644c6a1db8506eb3da78f), [`71a878c`](https://github.com/mxvincent/bun-playground/commit/71a878c9cac3244e10b8ac9701555d620c3cde96)]:
  - @package/core@0.2.0
  - @package/query-params@0.1.2

## 0.2.0

### Minor Changes

- [#5](https://github.com/mxvincent/bun-playground/pull/5) [`d5721ff`](https://github.com/mxvincent/bun-playground/commit/d5721ffca1e36957cf3166697521fe29321b3058) Thanks [@mxvincent](https://github.com/mxvincent)! - Create DatabaseContext interface

### Patch Changes

- [#12](https://github.com/mxvincent/bun-playground/pull/12) [`23367cd`](https://github.com/mxvincent/bun-playground/commit/23367cd23733b5e4c32cac789cd3612e5c7ab416) Thanks [@mxvincent](https://github.com/mxvincent)! - Handle null values in cursor

- [#8](https://github.com/mxvincent/bun-playground/pull/8) [`936b81a`](https://github.com/mxvincent/bun-playground/commit/936b81ae67377342b1908e28db4c88efa5d09df5) Thanks [@mxvincent](https://github.com/mxvincent)! - Handle null values in cursor

- Updated dependencies [[`e84cc5c`](https://github.com/mxvincent/bun-playground/commit/e84cc5cf0e5b55dd7ae158eb111a0774998251fa), [`57a22f0`](https://github.com/mxvincent/bun-playground/commit/57a22f0aedd5631908ef0706a35c00f06324f578)]:
  - @package/query-params@0.1.1

## 0.1.0

### Minor Changes

- [#1](https://github.com/mxvincent/bun-playground/pull/1) [`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297) Thanks [@mxvincent](https://github.com/mxvincent)! - Initial release

### Patch Changes

- Updated dependencies [[`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297)]:
  - @package/query-params@0.1.0
  - @package/errors@0.1.0
  - @package/core@0.1.0
