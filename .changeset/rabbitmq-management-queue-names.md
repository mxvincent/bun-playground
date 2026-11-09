---
"@package/rabbitmq": patch
---

`RabbitMQManagementClient.configureQueue()` and `diffQueueBindings()` now read the right queue when its name holds `/`, `#`, `?` or `%`. The name was put in the management API URL as is, so these methods read the arguments and bindings of another resource, or failed, and `configureQueue()` could reconfigure the queue from wrong data.
