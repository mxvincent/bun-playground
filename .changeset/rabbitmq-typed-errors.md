---
"@package/rabbitmq": minor
---

Throw the existing typed errors instead of a plain `Error`: `AmqpClientError` when `getDefaultChannel()` or `getConnectionManager()` is called before the client is initialized, `AmqpConfigError` when `AmqpQueue.argumentEquals()` compares queues with different names, and `RabbitMQManagementAPIError` (with the response status) when `getQueue()` receives a status other than 200 or 404. Messages do not change.
