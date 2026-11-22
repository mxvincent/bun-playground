# @package/kubernetes

A [cdk8s](https://cdk8s.io) toolkit to describe the workloads of an application and render their Kubernetes manifests.

The package holds the reusable part: namespaces, workload components, config files, environment variables, external secrets and CRD classes. Each repository keeps its own render: its charts, its application and environment names, and the entry point that synthesizes the manifests.

## Installation

```json
{
	"dependencies": {
		"@package/kubernetes": "workspace:*"
	}
}
```

The render also needs `cdk8s` and `cdk8s-cli` to run `cdk8s synth`, and `constructs` if it imports generated CRD classes.

## Quick start

Declare a namespace with its components:

```ts
import { bun, CONFIG_FILE_NAME, defineNamespace, ExternalSecret, WebService } from '@package/kubernetes'

export const accountService = defineNamespace({
	name: 'account-service',
	application: 'account-service',
	config: (context) => {
		const secrets = new ExternalSecret(`${context.environment}-${context.application}`)
		return {
			[CONFIG_FILE_NAME]: {
				database: { password: secrets.ref('POSTGRES_PASSWORD') }
			}
		}
	},
	environment: { AUTH_CLIENT_ID: 'account-service' },
	components: [
		new WebService({
			name: 'app-server',
			command: bun('applications/account/src/commands/start-api-server.ts'),
			ingress: { host: 'account.example.com' }
		})
	]
})
```

Generate it for each environment, then synthesize the manifests:

```ts
import { synthesizeAllResources } from '@package/kubernetes'

for (const environment of ['development', 'staging', 'production']) {
	accountService.generate(environment)
}

synthesizeAllResources()
```

Each application is written to `manifests/<application>/<environment>.yaml`. The Kubernetes namespace of an environment is `<environment>-<name>`, for example `development-account-service`.

## Namespaces

`defineNamespace(options)` declares an application and the components it runs. Component names must be unique in a namespace.

| Option          | Description                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------- |
| `name`          | Name of the namespace, prefixed by the environment to give the Kubernetes namespace               |
| `application`   | Application providing the image and the revision of every component                               |
| `components`    | Workload components of the namespace                                                              |
| `config`        | Config files shared by the components, by file name                                               |
| `environment`   | Environment variables shared by the components                                                    |
| `revision`      | Revision of the application, as a value or a function of the environment (see [Revision](#revision)) |
| `imageRegistry` | Registry the image is pulled from, `DEFAULT_IMAGE_REGISTRY` when omitted                          |
| `secretStore`   | Secret store the external secrets read from, `DEFAULT_SECRET_STORE` when omitted                  |

The image of every component is `<imageRegistry.url>/<application>:<revision>`. When the registry has `auth`, a `docker-auth` pull secret is created from that external secret.

`generate(environment, { scope })` builds the chart of one environment. Pass a `scope` (for example `new App()`) to synthesize it outside the global scope of the application, which is useful in tests.

## Components

| Component | Resources                                       | Options                                   |
| --------- | ----------------------------------------------- | ----------------------------------------- |
| `WebService` | Deployment, Service and an optional Ingress | `replicas`, `ingress`                     |
| `Daemon`  | Deployment                                      | `replicas`                                |
| `Job`     | Job run as an Argo CD hook                      | `hook`, `deletePolicy`, `activeDeadline`  |
| `CronJob` | CronJob                                         | `schedule`                                |

Every component takes a `name`, a `command`, and optional `config` and `environment`. A web service listens on `WebService.HTTP_PORT` (4000). Its ingress uses a cert-manager cluster issuer (`acme-http` by default) and the NGINX ingress annotations set in `ingress.annotations`.

`bun(main)` builds the command of a Bun image that keeps the repository layout under `/app`. Pass `{ rootDir }` to change the root.

## Config files and environment variables

The config files and environment variables of a component extend those of its namespace:

- config files are deep-merged: plain objects are merged recursively, while arrays, scalars and secret references are replaced;
- environment variables are merged;
- on a conflict, the value of the component is used.

Both can be a value or a function of the `ComponentContext` (`application`, `environment`, `namespace`, `component`, `revision`, `secretStore`).

Config files are mounted in `/app/config`. When the files include `config.json`, the container also gets `CONFIG_FILE_PATH` and `NODE_ENV=production`, unless the environment already sets them. The workload is reloaded by [Reloader](https://github.com/stakater/Reloader) when its secrets change.

### Secrets

`new ExternalSecret(name).ref(property)` references a property of a remote secret. A reference can be used as an environment variable, or anywhere in a config file. The package then creates an `ExternalSecret` resource that fills the Kubernetes secret from the secret store.

## Defaults

The defaults match the infrastructure of this repository. Override them per namespace:

| Default                  | Value                                                         | Option          |
| ------------------------ | ------------------------------------------------------------- | --------------- |
| `DEFAULT_SECRET_STORE`   | `scaleway` ClusterSecretStore                                 | `secretStore`   |
| `DEFAULT_IMAGE_REGISTRY` | `ghcr.io/mxvincent`, authenticated with `image-registry-auth` | `imageRegistry` |
| Revision                 | Version of `applications/<application>/package.json`          | `revision`      |

### Revision

The revision is resolved in this order:

1. the revision pinned in the `revisions` map, for every environment or for one environment;
2. the `revision` option;
3. the version of `applications/<application>/package.json`.

`packageVersion(path)` reads the version of a package from the repository root, which is found from the working directory. Use it when the application directory does not match its name:

```ts
defineNamespace({
	application: 'account-service',
	revision: () => packageVersion('applications/account'),
	// …
})
```

## Testing

`pinRevision(application)` from `@package/kubernetes/testing` pins the revision during a test suite, so a release does not change the snapshots:

```ts
import { describe, expect, test } from 'bun:test'
import { pinRevision } from '@package/kubernetes/testing'
import { App } from 'cdk8s'

describe('AccountService', () => {
	pinRevision('account-service')

	test('synthesizes the development manifests', () => {
		const app = new App()
		accountService.generate('development', { scope: app })
		expect(app.synthYaml()).toMatchSnapshot()
	})
})
```

## CRDs

The package ships the classes it uses in `crds/`: the Kubernetes API (`k8s`) and `external-secrets.io`. Import them from `@package/kubernetes/crds/<group>`.

A repository generates the classes of the other CRDs it renders with `importCrds`. The function downloads pinned upstream manifests, so the result does not depend on a cluster:

```ts
// scripts/import-crds.ts
import { join } from 'node:path'
import { importCrds } from '@package/kubernetes/crds'

await importCrds({
	output: join(import.meta.dir, '..', 'crds'),
	kubernetesApi: false,
	sources: {
		'cert-manager.io': ['https://github.com/cert-manager/cert-manager/releases/download/v1.21.3/cert-manager.crds.yaml']
	}
})
```

- `sources` maps an API group to the manifests that hold its CRDs. Only the CRDs of that group are kept; to generate several groups of one bundle, list the bundle under each group.
- `kubernetesApi` is the Kubernetes API to import, `k8s@1.37.0` by default. Pass `false` to reuse the classes of the package.

To update the classes of the package, bump a version in `scripts/import-crds.ts` and run `bun run import-api-resources`.

## Entry points

| Import                               | Content                               |
| ------------------------------------ | ------------------------------------- |
| `@package/kubernetes`                | Namespaces, components and helpers    |
| `@package/kubernetes/crds`           | `importCrds`                          |
| `@package/kubernetes/crds/<group>`   | Generated CRD classes                 |
| `@package/kubernetes/testing`        | `pinRevision`, for `bun:test` suites  |
