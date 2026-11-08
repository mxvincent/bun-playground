---
"@package/json-schema": patch
---

`createValidationFunction` and `getValidationFunction` now type the validated payload as `Static<T>` instead of the schema type `T`.
