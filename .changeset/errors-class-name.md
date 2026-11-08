---
"@package/errors": patch
---

Error classes now report the name of their concrete class (`NotFoundError`, `ConflictError`…) as `name`, instead of `Error`. Stack traces and logs show it.
