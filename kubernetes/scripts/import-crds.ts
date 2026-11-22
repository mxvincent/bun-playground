/**
 * Regenerates the `imports/` classes from pinned upstream sources, so the result does not depend on a cluster.
 *
 * Each CRD set comes from a release of its operator. Bump a version here and run the script to update the imports.
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const kubernetesApi = 'k8s@1.25.0'

const crdSources = {
	'argoproj.io': [
		'https://raw.githubusercontent.com/argoproj/argo-cd/v3.5.6/manifests/crds/application-crd.yaml',
		'https://raw.githubusercontent.com/argoproj/argo-cd/v3.5.6/manifests/crds/applicationset-crd.yaml',
		'https://raw.githubusercontent.com/argoproj/argo-cd/v3.5.6/manifests/crds/appproject-crd.yaml'
	],
	'cert-manager.io': ['https://github.com/cert-manager/cert-manager/releases/download/v1.21.3/cert-manager.crds.yaml'],
	'external-secrets.io': [
		'https://raw.githubusercontent.com/external-secrets/external-secrets/v2.14.0/deploy/crds/bundle.yaml'
	],
	'metallb.io': ['https://raw.githubusercontent.com/metallb/metallb/v0.16.1/config/manifests/metallb-native.yaml'],
	'postgresql.cnpg.io': ['https://github.com/cloudnative-pg/cloudnative-pg/releases/download/v1.30.1/cnpg-1.30.1.yaml'],
	'rabbitmq.com': [
		'https://github.com/rabbitmq/cluster-operator/releases/download/v2.23.2/cluster-operator.yml',
		'https://github.com/rabbitmq/messaging-topology-operator/releases/download/v1.20.5/messaging-topology-operator.yaml'
	]
}

const workspace = join(import.meta.dir, '..')
const cdk8s = join(workspace, 'node_modules', '.bin', 'cdk8s')
const output = join(workspace, 'imports')

/**
 * Keeps the CustomResourceDefinition documents of a manifest, dropping the operator deployment around them.
 */
function extractCrds(manifest: string): string[] {
	return manifest.split(/^---\s*$/m).filter((document) => /^kind:\s*CustomResourceDefinition\s*$/m.test(document))
}

async function download(url: string): Promise<string> {
	const response = await fetch(url)
	if (!response.ok) {
		throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
	}
	return response.text()
}

/**
 * Runs `cdk8s import` outside the workspace, so it does not record the source in `cdk8s.yaml`.
 */
async function cdk8sImport(source: string, cwd: string) {
	const child = Bun.spawn([cdk8s, 'import', source, '--language', 'typescript', '--output', output], {
		cwd,
		stdout: 'inherit',
		stderr: 'inherit'
	})
	if ((await child.exited) !== 0) {
		throw new Error(`cdk8s import ${source} failed`)
	}
}

const directory = await mkdtemp(join(tmpdir(), 'import-crds-'))
try {
	await cdk8sImport(kubernetesApi, directory)
	for (const [group, urls] of Object.entries(crdSources)) {
		const manifests = await Promise.all(urls.map(download))
		const crds = manifests.flatMap(extractCrds)
		if (crds.length === 0) {
			throw new Error(`No CustomResourceDefinition found for ${group}`)
		}
		const file = join(directory, `${group}.yaml`)
		await writeFile(file, crds.join('\n---\n'))
		await cdk8sImport(file, directory)
	}
} finally {
	await rm(directory, { recursive: true, force: true })
}
