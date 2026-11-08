---
"@package/errors": patch
---

`ResourceNotFoundError.toString()` now follows the `[CODE] message` format of the other errors (`[RESOURCE_NOT_FOUND] Resource not found: id-1`) and serializes the nested values of an object id as JSON instead of `[object Object]`.
