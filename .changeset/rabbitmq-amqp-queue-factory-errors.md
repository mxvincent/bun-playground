---
"@package/rabbitmq": patch
---

`AmqpQueue.retryFailureQueueFrom` and `unprocessableQueueFrom` name the queue they create in their error. Both said "retry attempt queue".
