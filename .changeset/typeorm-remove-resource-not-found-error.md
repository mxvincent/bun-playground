---
"@package/typeorm": minor
---

Remove `TypeormResourceNotFoundError`, which nothing used: its `format()` built a plain `ResourceNotFoundError` anyway. Throw `ResourceNotFoundError` from `@package/errors`, e.g. `new ResourceNotFoundError(metadata.name, metadata.getEntityIdMap(record))`.
