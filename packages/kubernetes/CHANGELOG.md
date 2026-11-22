# @package/kubernetes

## 0.1.0

### Minor Changes

- [#286](https://github.com/mxvincent/bun-playground/pull/286) [`90caab8`](https://github.com/mxvincent/bun-playground/commit/90caab8a412f5265627c50dfca13c0829a6739a0) Thanks [@mxvincent](https://github.com/mxvincent)! - Add `@package/kubernetes`, the reusable cdk8s toolkit extracted from `kubernetes/`: workload namespaces and components, external secrets, the `k8s` and `external-secrets.io` classes, and `importCrds()` to generate the CRD classes a repository renders. Application and environment names are plain strings, and the secret store, the revision and the image registry are defaults that a namespace can override.

- [#361](https://github.com/mxvincent/bun-playground/pull/361) [`fde9dfa`](https://github.com/mxvincent/bun-playground/commit/fde9dfa3a78dcd1b8e47fe2047b319e09e4789d8) Thanks [@mxvincent](https://github.com/mxvincent)! - Throw typed errors that extend `BaseError` instead of a plain `Error`, each with a `KUBERNETES_` code and its context as fields: `KubernetesConfigAlreadyGeneratedError`, `KubernetesCrdDownloadFailedError`, `KubernetesCrdImportFailedError`, `KubernetesCrdNotFoundError`, `KubernetesDuplicateComponentNameError`, `KubernetesRepositoryRootNotFoundError` and `KubernetesRevisionNotFoundError`. Messages do not change.

### Patch Changes

- [#307](https://github.com/mxvincent/bun-playground/pull/307) [`5fdcf82`](https://github.com/mxvincent/bun-playground/commit/5fdcf82cc0d92b5962760d9424ae3f5909ae18fb) Thanks [@mxvincent](https://github.com/mxvincent)! - Update `cdk8s` to 2.70.126.

- [#314](https://github.com/mxvincent/bun-playground/pull/314) [`024e23f`](https://github.com/mxvincent/bun-playground/commit/024e23fa3a13ff6e7883bc9223d9cc3ab4d5f555) Thanks [@mxvincent](https://github.com/mxvincent)! - Build the workloads with `cdk8s-plus-37` 2.0.13 instead of `cdk8s-plus-33`, and require `constructs` 10.8.1.

- [#345](https://github.com/mxvincent/bun-playground/pull/345) [`689346a`](https://github.com/mxvincent/bun-playground/commit/689346a75743a2e3a52fad974bec57f5d254d7e8) Thanks [@mxvincent](https://github.com/mxvincent)! - Align the code with the code-style rules that Biome now enforces: exported functions are arrow functions assigned to a `const`, non-null assertions are replaced by narrowing, and Node.js builtins are imported with the `node:` prefix. No export is renamed or removed, and behavior does not change.

- [#308](https://github.com/mxvincent/bun-playground/pull/308) [`d01bad6`](https://github.com/mxvincent/bun-playground/commit/d01bad654f21a386c3788f06b2511ac49291d454) Thanks [@mxvincent](https://github.com/mxvincent)! - Update `constructs` to 10.8.1.

- [#309](https://github.com/mxvincent/bun-playground/pull/309) [`6ec6232`](https://github.com/mxvincent/bun-playground/commit/6ec62321e4b0e9a7bc666f051066ea6cc6691dc3) Thanks [@mxvincent](https://github.com/mxvincent)! - Update the `external-secrets.io` CRD classes to v2.15.0.

- [#312](https://github.com/mxvincent/bun-playground/pull/312) [`aa412e3`](https://github.com/mxvincent/bun-playground/commit/aa412e3f0881ac5b39f5d173323cfbb92fa74009) Thanks [@mxvincent](https://github.com/mxvincent)! - Import the Kubernetes API 1.37 by default in `importCrds()` (`k8s@1.37.0`, was `k8s@1.25.0`) and regenerate the `k8s` classes from it.

- [#313](https://github.com/mxvincent/bun-playground/pull/313) [`f888d25`](https://github.com/mxvincent/bun-playground/commit/f888d25ed155391fa26d38427c9accf1ead0a10a) Thanks [@mxvincent](https://github.com/mxvincent)! - Update `cdk8s-cli` to 2.207.87. `importCrds()` generates the same classes.

- [#310](https://github.com/mxvincent/bun-playground/pull/310) [`7ccf558`](https://github.com/mxvincent/bun-playground/commit/7ccf5587dee53b0c7cbd517056531c94a8e4449c) Thanks [@mxvincent](https://github.com/mxvincent)! - Update `es-toolkit` to 1.53.2.

- [#311](https://github.com/mxvincent/bun-playground/pull/311) [`e08d651`](https://github.com/mxvincent/bun-playground/commit/e08d651f7d673e2aa4bb8cb7ea38f7ae45232041) Thanks [@mxvincent](https://github.com/mxvincent)! - Update the `@types/bun` dev dependency to 1.4.5.
