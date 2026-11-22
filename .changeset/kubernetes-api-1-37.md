---
"@package/kubernetes": patch
---

Import the Kubernetes API 1.37 by default in `importCrds()` (`k8s@1.37.0`, was `k8s@1.25.0`) and regenerate the `k8s` classes from it.
