/**
 * Regenerates the `crds/` classes of the CRDs rendered by this repository. The Kubernetes API and the CRDs used by
 * `@package/kubernetes` come with the package.
 *
 * Each CRD set comes from a release of its operator. Bump a version here and run the script to update the classes.
 */
import { join } from 'node:path'
import { importCrds } from '@package/kubernetes/crds'

await importCrds({
	output: join(import.meta.dir, '..', 'crds'),
	kubernetesApi: false,
	sources: {
		'argoproj.io': [
			'https://raw.githubusercontent.com/argoproj/argo-cd/v3.6.2/manifests/crds/application-crd.yaml',
			'https://raw.githubusercontent.com/argoproj/argo-cd/v3.6.2/manifests/crds/applicationset-crd.yaml',
			'https://raw.githubusercontent.com/argoproj/argo-cd/v3.6.2/manifests/crds/appproject-crd.yaml'
		],
		'acme.cert-manager.io': [
			'https://github.com/cert-manager/cert-manager/releases/download/v1.21.3/cert-manager.crds.yaml'
		],
		'cert-manager.io': [
			'https://github.com/cert-manager/cert-manager/releases/download/v1.21.3/cert-manager.crds.yaml'
		],
		'metallb.io': ['https://raw.githubusercontent.com/metallb/metallb/v0.16.2/config/manifests/metallb-native.yaml'],
		'postgresql.cnpg.io': [
			'https://github.com/cloudnative-pg/cloudnative-pg/releases/download/v1.30.1/cnpg-1.30.1.yaml'
		],
		'rabbitmq.com': [
			'https://github.com/rabbitmq/cluster-operator/releases/download/v2.23.2/cluster-operator.yml',
			'https://github.com/rabbitmq/messaging-topology-operator/releases/download/v1.20.5/messaging-topology-operator.yaml'
		]
	}
})
