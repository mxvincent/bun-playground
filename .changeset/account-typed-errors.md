---
"@application/account": patch
---

The organization repository throws `ResourceNotWrittenError` (code `RESOURCE_NOT_WRITTEN`, with the operation and the resource) instead of a plain `Error` when a create, update or delete affects no row. The HTTP error body now carries that code.
