---
"@package/rabbitmq": patch
---

`RabbitMQManagementClient.configureQueue()` rejects with a `RabbitMQManagementAPIError` when it reconfigures a queue whose arguments changed and the management API refuses to create the shovel that moves its messages (shovel plugin disabled, missing permissions). It used to wait forever for the source queue to drain. Callers of `configureQueue()` should handle this error.
