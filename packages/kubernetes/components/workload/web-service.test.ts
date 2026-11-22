import { describe, expect, test } from 'bun:test'
import { App } from 'cdk8s/lib/app'
import { defineNamespace } from '../../helpers/namespace'
import { ExternalSecret } from '../../plugins/external-secret'
import type { IngressConfig } from '../../plugins/ingress'
import { pinRevision } from '../../testing'
import type { EnvironmentVariables } from '../config/workload-environment'
import { WebService } from './web-service'

interface FixtureOptions {
	ingress?: IngressConfig
	environment?: EnvironmentVariables
	registryAuth?: ExternalSecret
}

const synthesize = ({ ingress, environment, registryAuth }: FixtureOptions = {}): string => {
	const app = new App()
	defineNamespace({
		name: 'fixture',
		application: 'fixture',
		imageRegistry: { url: 'ghcr.io/mxvincent', auth: registryAuth },
		environment,
		components: [new WebService({ name: 'app-server', command: ['node', 'app-server.js'], ingress })]
	}).generate('development', { scope: app })
	return app.synthYaml()
}

describe('WebService', () => {
	pinRevision('fixture')

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
