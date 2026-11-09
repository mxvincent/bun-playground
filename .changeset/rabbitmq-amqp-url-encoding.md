---
"@package/rabbitmq": patch
---

`getAmqpConnectionUrl` percent-encodes the username, the password and the vhost (`/` becomes `%2F`). A password holding `@`, `:` or `/` produced an invalid URL.
