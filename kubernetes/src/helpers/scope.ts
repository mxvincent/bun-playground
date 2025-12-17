import { App as CDKScope } from 'cdk8s/lib/app'
import { findOrCreate } from '#helpers/misc'
import type { Application } from '#interfaces/application'
import type { Environment } from '#interfaces/environment'

const applicationScopes = new Map<string, CDKScope>()
export const getApplicationScope = (application: Application): CDKScope => {
	return findOrCreate(applicationScopes, application, () => {
		return new CDKScope({
			outdir: `manifests/${application}`,
			outputFileExtension: '.yaml'
		})
	})
}

const environmentScopes = new Map<string, CDKScope>()
export const getEnvironmentScope = (environment: Environment): CDKScope => {
	return findOrCreate(environmentScopes, environment, () => {
		return new CDKScope({
			outdir: `manifests/${environment}`,
			outputFileExtension: '.yaml'
		})
	})
}

export const synthesizeAllResources = () => {
	for (const applicationScope of Object.values(applicationScopes)) {
		applicationScope.synth()
	}
	for (const environmentScope of Object.values(environmentScopes)) {
		environmentScope.synth()
	}
}
