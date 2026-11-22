---
"@domain/account": patch
"@package/core": patch
"@package/database": patch
"@package/json-schema": patch
"@package/kubernetes": patch
"@package/query-params": patch
"@package/query-params-serializer": patch
"@package/rabbitmq": patch
"@package/telemetry": patch
"@package/typeorm": patch
---

Align the code with the code-style rules that Biome now enforces: exported functions are arrow functions assigned to a `const`, non-null assertions are replaced by narrowing, and Node.js builtins are imported with the `node:` prefix. No export is renamed or removed, and behavior does not change.
