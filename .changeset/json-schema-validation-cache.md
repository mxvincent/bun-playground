---
"@package/json-schema": patch
---

`validate` and `getValidationFunction` now reuse the validator of a schema. The cache was keyed by an object built on each call: it never hit, and it grew on every call.
