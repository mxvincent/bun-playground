import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

export interface ImportCrdsOptions {
	/** Directory the classes are generated in */
	readonly output: string
	/** Pinned manifests holding the CustomResourceDefinitions, by API group; CRDs of other groups are dropped */
	readonly sources: Readonly<Record<string, readonly string[]>>
	/** Kubernetes API to import, `k8s@1.37.0` when omitted, not imported when `false` */
	readonly kubernetesApi?: string | false
}

/**
 * The `cdk8s` binary of the CLI installed with this package
 */
const cdk8s = join(dirname(require.resolve('cdk8s-cli/package.json')), 'bin', 'cdk8s')

/**
 * Keeps the CustomResourceDefinition documents of an API group, dropping the operator deployment and the CRDs of the
 * other groups around them.
 */
export const extractCrds = (manifest: string, group: string): string[] => {
	return manifest.split(/^---\s*$/m).filter((document) => {
		return (
			/^kind:\s*CustomResourceDefinition\s*$/m.test(document) &&
			document.match(/^ {2}group:\s*['"]?([^'"\s]+)['"]?\s*$/m)?.[1] === group
		)
	})
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
async function cdk8sImport(source: string, output: string, cwd: string) {
	const child = Bun.spawn([cdk8s, 'import', source, '--language', 'typescript', '--output', output], {
		cwd,
		stdout: 'inherit',
		stderr: 'inherit'
	})
	if ((await child.exited) !== 0) {
		throw new Error(`cdk8s import ${source} failed`)
	}
}

/**
 * Generate the cdk8s classes of CustomResourceDefinitions from pinned upstream manifests, so the result does not
 * depend on a cluster.
 *
 * Each repository calls it with the CRDs it renders. Bump a version in the sources and run it again to update the
 * classes.
 */
export const importCrds = async ({ output, sources, kubernetesApi = 'k8s@1.37.0' }: ImportCrdsOptions) => {
	const directory = await mkdtemp(join(tmpdir(), 'import-crds-'))
	try {
		if (kubernetesApi) {
			await cdk8sImport(kubernetesApi, output, directory)
		}
		for (const [group, urls] of Object.entries(sources)) {
			const manifests = await Promise.all(urls.map(download))
			const crds = manifests.flatMap((manifest) => extractCrds(manifest, group))
			if (crds.length === 0) {
				throw new Error(`No CustomResourceDefinition found for ${group}`)
			}
			const file = join(directory, `${group}.yaml`)
			await writeFile(file, crds.join('\n---\n'))
			await cdk8sImport(file, output, directory)
		}
	} finally {
		await rm(directory, { recursive: true, force: true })
	}
}
