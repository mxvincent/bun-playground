# @package/rabbitmq

## 0.2.0

### Minor Changes

- [#29](https://github.com/mxvincent/bun-playground/pull/29) [`0f630df`](https://github.com/mxvincent/bun-playground/commit/0f630df00eaabc08ed39512b90de77e29153dccc) Thanks [@mxvincent](https://github.com/mxvincent)! - `RabbitMQManagementClient.listQueues()` lists the queues of the configured vhost.

### Patch Changes

- [#162](https://github.com/mxvincent/bun-playground/pull/162) [`f6c3286`](https://github.com/mxvincent/bun-playground/commit/f6c32868aef0e2d50856720998b8d457c6ce8d73) Thanks [@mxvincent](https://github.com/mxvincent)! - `AmqpQueue.retryFailureQueueFrom` and `unprocessableQueueFrom` name the queue they create in their error. Both said "retry attempt queue".

- [#159](https://github.com/mxvincent/bun-playground/pull/159) [`7a29333`](https://github.com/mxvincent/bun-playground/commit/7a29333a35d7fbc26379cbc97533ba016a7ddfbe) Thanks [@mxvincent](https://github.com/mxvincent)! - `getAmqpConnectionUrl` percent-encodes the username, the password and the vhost (`/` becomes `%2F`). A password holding `@`, `:` or `/` produced an invalid URL.

- [#157](https://github.com/mxvincent/bun-playground/pull/157) [`c329f86`](https://github.com/mxvincent/bun-playground/commit/c329f86126dae375b17c9b8ceffe404a518aaf22) Thanks [@mxvincent](https://github.com/mxvincent)! - The consumer retries a message whose handler fails when `retryAttempts` is set: it sends it to the next retry attempt queue, then to the retry failure queue. The condition was inverted: with retries enabled, the message was acked and lost; without, it was sent to the retry failure queue. Without retries, the failed message is now nacked instead of acked, so the queue settings of RabbitMQ decide what happens to it.

- [#161](https://github.com/mxvincent/bun-playground/pull/161) [`6b3f2e0`](https://github.com/mxvincent/bun-playground/commit/6b3f2e0a00baa7b250968c14d70f380c9c9e177f) Thanks [@mxvincent](https://github.com/mxvincent)! - `RabbitMQManagementClient.configureQueue()` and `diffQueueBindings()` now read the right queue when its name holds `/`, `#`, `?` or `%`. The name was put in the management API URL as is, so these methods read the arguments and bindings of another resource, or failed, and `configureQueue()` could reconfigure the queue from wrong data.

- [#160](https://github.com/mxvincent/bun-playground/pull/160) [`3c7d7cc`](https://github.com/mxvincent/bun-playground/commit/3c7d7cc953dbdc605788c2cb721c36a65e88fa4c) Thanks [@mxvincent](https://github.com/mxvincent)! - `RabbitMQManagementClient.configureQueue()` rejects with a `RabbitMQManagementAPIError` when it reconfigures a queue whose arguments changed and the management API refuses to create the shovel that moves its messages (shovel plugin disabled, missing permissions). It used to wait forever for the source queue to drain. Callers of `configureQueue()` should handle this error.

- [#158](https://github.com/mxvincent/bun-playground/pull/158) [`1eb15a3`](https://github.com/mxvincent/bun-playground/commit/1eb15a3b6ab78dd07da1732fbcfdbe1872e0110a) Thanks [@mxvincent](https://github.com/mxvincent)! - With `keepUnprocessableMessages`, the consumer sends an invalid message to the unprocessable queue of the consumed queue (`<queue>.unprocessable`, exported as `getUnprocessableQueueName`). It sent it to `<queue>.retry-undefined`.

- Updated dependencies [[`5b364a5`](https://github.com/mxvincent/bun-playground/commit/5b364a5ffe8e118ec28f54011b13fd170b898f8c), [`b8d8304`](https://github.com/mxvincent/bun-playground/commit/b8d83041f296ee7cfd3f672502478017c8f1bb22), [`e54b6e7`](https://github.com/mxvincent/bun-playground/commit/e54b6e730e9cdd3231492a67eeb781cf03da7ebd), [`5f49412`](https://github.com/mxvincent/bun-playground/commit/5f494125741d52c374841be34b2566a673041c87), [`23af85d`](https://github.com/mxvincent/bun-playground/commit/23af85dfca984aa4832011a95f9bacfacfdee00d), [`f811014`](https://github.com/mxvincent/bun-playground/commit/f811014b8d8d5ba9e7668f477ec17b136e9c088a), [`e94fb89`](https://github.com/mxvincent/bun-playground/commit/e94fb89a58b4c022177b528e6a25a48abee75f6f), [`8b57bd3`](https://github.com/mxvincent/bun-playground/commit/8b57bd35f20eb3ca8a60f1e5b5072bae9e439df5), [`060805c`](https://github.com/mxvincent/bun-playground/commit/060805cbbaf76ee75508055b22108a11cb706dee), [`6377fc7`](https://github.com/mxvincent/bun-playground/commit/6377fc70d6b3657ac2d65d7846362b2d2be16c19), [`18f53aa`](https://github.com/mxvincent/bun-playground/commit/18f53aa2878de50d0f76fb253cd7975247b1720e), [`d7ffbcf`](https://github.com/mxvincent/bun-playground/commit/d7ffbcf354143823ef2f5ece6bc18dc373fcb8c8), [`72de898`](https://github.com/mxvincent/bun-playground/commit/72de898b9e9be2e158bf511666c5a6434f8b2431), [`b0203a8`](https://github.com/mxvincent/bun-playground/commit/b0203a8871ddee45cd406e1540e000b6db1b1f37), [`2736e1b`](https://github.com/mxvincent/bun-playground/commit/2736e1b9c24419f43c4a3e7e62a892eb1aca11c7), [`96d326a`](https://github.com/mxvincent/bun-playground/commit/96d326a3319c4db27f3dadfc02c388c9bbe2106d), [`1476111`](https://github.com/mxvincent/bun-playground/commit/14761117ec7a38a4d0c45fcae50218349fd6cb32), [`058dd92`](https://github.com/mxvincent/bun-playground/commit/058dd92925cd8cb2f69644c6a1db8506eb3da78f), [`d9631ae`](https://github.com/mxvincent/bun-playground/commit/d9631aee093dd1244617064d14e828cf721e6f53), [`71a878c`](https://github.com/mxvincent/bun-playground/commit/71a878c9cac3244e10b8ac9701555d620c3cde96)]:
  - @package/core@0.2.0
  - @package/errors@0.2.0
  - @package/json-schema@0.2.0
  - @package/telemetry@0.2.0

## 0.1.0

### Minor Changes

- [#1](https://github.com/mxvincent/bun-playground/pull/1) [`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297) Thanks [@mxvincent](https://github.com/mxvincent)! - Initial release

### Patch Changes

- Updated dependencies [[`465b25c`](https://github.com/mxvincent/bun-playground/commit/465b25c8f83f53d73f67aef2b8293673c5ded297)]:
  - @package/json-schema@0.1.0
  - @package/telemetry@0.1.0
  - @package/errors@0.1.0
  - @package/core@0.1.0
