---
"@package/rabbitmq": minor
---

`RabbitMQManagementAPIError` extends `AmqpBaseError` (and so `BaseError`) with the code `RABBITMQ_MANAGEMENT_API_ERROR`. Breaking: the HTTP status of the RabbitMQ management API response moves from `statusCode` to `responseStatus`, and `statusText` becomes `responseStatusText`; the error also carries the `requestUrl`, and `toJSON()` returns all three. `statusCode` is now the status a service returns to its own client and stays 500. Consumers read `error.responseStatus` and `error.responseStatusText` instead of `error.statusCode` and `error.statusText`, and pass `{ requestUrl, responseStatus, responseStatusText }` to the constructor instead of `{ statusCode, statusText }`.
