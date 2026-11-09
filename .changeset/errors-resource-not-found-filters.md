---
"@package/errors": minor
---

`ResourceNotFoundError.fromFilters(type, filters)` describes a resource looked up by filters: `toJSON()` returns `resource: { type, filters }` with each filter serialized by its `toJSON()`, and `toString()` prints the filters as JSON. The id of the constructor becomes optional: without an id or filters, `toJSON()` returns `resource: { type }` and `toString()` appends nothing to the message.
