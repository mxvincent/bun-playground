---
"@package/json-schema": patch
---

`schemas/resource.ts` no longer imports the schema builder, which imports it back. Loading it before the builder threw `Cannot access ... before initialization`.
