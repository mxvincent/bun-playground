---
"@package/typeorm": minor
---

A `Pager` can now be reused across requests: sorts and filters are passed to each `getPage()` call instead of the constructor. Replace `new Pager(entity, { query, sorts, filters }).getPage(pagination)` with `new Pager(entity, { query }).getPage({ pagination, sorts, filters })`. The `cursorTransformer` option is replaced by `cursorEncoding: { encoder, decoder }`, since the cursor keys now follow the sorts of each call.
