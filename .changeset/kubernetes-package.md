---
"@package/kubernetes": minor
---

Add `@package/kubernetes`, the reusable cdk8s toolkit extracted from `kubernetes/`: workload namespaces and components, external secrets, the `k8s` and `external-secrets.io` classes, and `importCrds()` to generate the CRD classes a repository renders. Application and environment names are plain strings, and the secret store, the revision and the image registry are defaults that a namespace can override.
