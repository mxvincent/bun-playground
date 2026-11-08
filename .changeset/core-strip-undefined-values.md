---
"@package/core": minor
---

Rename `removeUndefined` to `stripUndefinedValues`, and its type `RemoveUndefined` to `StripUndefinedValues`. `removeUndefined` stays available as a deprecated alias: replace `removeUndefined(value)` with `stripUndefinedValues(value)` before it is removed.
