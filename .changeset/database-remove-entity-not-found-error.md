---
"@package/database": minor
---

Remove `EntityNotFoundError`: throw `ResourceNotFoundError.fromFilters(type, filters)` from `@package/errors` when a lookup by filters finds nothing. Replace `new EntityNotFoundError('Organization', filters)` with `ResourceNotFoundError.fromFilters('Organization', filters)`. The `toJSON()` of the thrown error changes from `{ code: 'ENTITY_NOT_FOUND', filters }` to `{ code: 'RESOURCE_NOT_FOUND', resource: { type, filters } }`.
