---
"@package/core": patch
---

`removeUndefined` keeps class instances (`Date`, `Map`, `Buffer`…) as they are instead of replacing them with `{}`, and only traverses plain objects and arrays. Its result type now removes the properties typed `undefined`, makes the possibly undefined ones optional, and keeps `null`.
