---
"@package/rabbitmq": patch
---

The consumer retries a message whose handler fails when `retryAttempts` is set: it sends it to the next retry attempt queue, then to the retry failure queue. The condition was inverted: with retries enabled, the message was acked and lost; without, it was sent to the retry failure queue. Without retries, the failed message is now nacked instead of acked, so the queue settings of RabbitMQ decide what happens to it.
