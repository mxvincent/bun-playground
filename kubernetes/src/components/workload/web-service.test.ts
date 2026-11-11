import { describe, expect, test } from 'bun:test'
import { App } from 'cdk8s/lib/app'
import type { EnvironmentVariables } from '#/components/config/workload-environment'
import { WebService } from '#/components/workload/web-service'
import { defineNamespace } from '#/helpers/namespace'
import { pinRevision } from '#/helpers/revision.testing'
import { Application } from '#/interfaces/application'
import { Environment } from '#/interfaces/environment'
import { ExternalSecret } from '#/plugins/external-secret'
import type { IngressConfig } from '#/plugins/ingress'

interface FixtureOptions {
	ingress?: IngressConfig
	environment?: EnvironmentVariables
	registryAuth?: ExternalSecret
}

const synthesize = ({ ingress, environment, registryAuth }: FixtureOptions = {}): string => {
	const app = new App()
	defineNamespace({
		name: 'fixture',
		application: Application.ACCOUNT,
		imageRegistry: { url: 'ghcr.io/mxvincent', auth: registryAuth },
		environment,
		components: [new WebService({ name: 'app-server', command: ['node', 'app-server.js'], ingress })]
	}).generate(Environment.DEVELOPMENT, { scope: app })
	return app.synthYaml()
}

describe('WebService', () => {
	pinRevision(Application.ACCOUNT)

	test('exposes the service with the default ingress annotations', () => {
		expect(synthesize({ ingress: { host: 'fixture.example.com' } })).toMatchSnapshot()
	})

	test('accepts a subset of the ingress annotations', () => {
		expect(
			synthesize({ ingress: { host: 'fixture.example.com', annotations: { proxyBodySize: '10m' } } })
		).toMatchSnapshot()
	})

	test('reloads the workload when the environment secret changes without a config file', () => {
		const secrets = new ExternalSecret('fixture-secrets')
		expect(synthesize({ environment: { API_KEY: secrets.ref('API_KEY') } })).toMatchSnapshot()
	})

	test('pulls the image with the registry pull secret', () => {
		expect(synthesize({ registryAuth: new ExternalSecret('image-registry-auth') })).toMatchSnapshot()
	})
})
