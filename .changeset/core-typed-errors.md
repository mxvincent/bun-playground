---
"@package/core": minor
---

Throw typed errors that extend `BaseError`, each with its own `code`: `MissingEnvironmentVariableError` (`EnvValue`), `ContextNotInitializedError` (`AsyncStore`), `InvalidRandomStringParameterError` (`RandomStringGenerator`), `PackageRootNotFoundError` (`getPackageRootPath`) and `FileNotReadableError` (`readJsonFileSync`). Messages do not change, and the errors are still instances of `Error`.
