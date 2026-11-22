import { App as CDKScope } from 'cdk8s/lib/app'
import { findOrCreate } from '#/helpers/misc'
import type { Application } from '#/interfaces/application'

const applicationScopes = new Map<string, CDKScope>()
export const getApplicationScope = (application: Application): CDKScope => {
	return findOrCreate(applicationScopes, application, () => {
		return new CDKScope({
			outdir: `manifests/${application}`,
			outputFileExtension: '.yaml'
		})
	})
}

export const synthesizeAllResources = () => {
	for (const applicationScope of applicationScopes.values()) {
		applicationScope.synth()
	}
}
