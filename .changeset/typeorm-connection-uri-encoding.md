---
"@package/typeorm": patch
---

`getPostgresConnectionUri` percent-encodes the username and the password. A password holding `@`, `:` or `/` produced an invalid URI.
