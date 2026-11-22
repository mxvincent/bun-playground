---
"@package/kubernetes": minor
---

Throw typed errors that extend `BaseError` instead of a plain `Error`, each with a `KUBERNETES_` code and its context as fields: `KubernetesConfigAlreadyGeneratedError`, `KubernetesCrdDownloadFailedError`, `KubernetesCrdImportFailedError`, `KubernetesCrdNotFoundError`, `KubernetesDuplicateComponentNameError`, `KubernetesRepositoryRootNotFoundError` and `KubernetesRevisionNotFoundError`. Messages do not change.
