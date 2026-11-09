---
"@package/rabbitmq": patch
---

With `keepUnprocessableMessages`, the consumer sends an invalid message to the unprocessable queue of the consumed queue (`<queue>.unprocessable`, exported as `getUnprocessableQueueName`). It sent it to `<queue>.retry-undefined`.
