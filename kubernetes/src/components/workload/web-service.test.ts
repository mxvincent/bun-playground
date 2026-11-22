import { describe, expect, test } from 'bun:test'
import { App } from 'cdk8s/lib/app'
import { Chart } from 'cdk8s/lib/chart'
import { ImageRegistryAuth } from '#/components/config/registry-auth'
import { type EnvironmentVariables, WorkloadEnvironment } from '#/components/config/workload-environment'
import { WebService } from '#/components/workload/web-service'
import { ComponentContext, Context } from '#/helpers/context'
import { Application } from '#/interfaces/application'
import { Environment } from '#/interfaces/environment'
import { ExternalSecret } from '#/plugins/external-secret'
import type { IngressConfig } from '#/plugins/ingress'

/**
 * Application context bound to a standalone chart, so that the fixture does not share a scope with real charts
 */
class FixtureContext extends Context {
	constructor(chart: Chart) {
		super(Environment.DEVELOPMENT, Application.ACCOUNT, {
			name: 'fixture',
			namespace: 'development-fixture',
			revision: '0.0.0-snapshot',
			chart
		})
	}

	component(component: string) {
		return new ComponentContext(this, component)
	}
}

interface FixtureOptions {
	ingress?: IngressConfig
	environment?: EnvironmentVariables
	registryAuth?: ExternalSecret
}

const synthesize = ({ ingress, environment, registryAuth }: FixtureOptions = {}): string => {
	const app = new App()
	const context = new FixtureContext(new Chart(app, 'fixture', { disableResourceNameHashes: true }))
	const component = new WebService({ name: 'app-server', command: ['node', 'app-server.js'], ingress })
	const componentContext = context.component(component.name)
	component.generate(componentContext, {
		image: 'ghcr.io/mxvincent/account-service:0.0.0-snapshot',
		imagePullSecret: registryAuth && new ImageRegistryAuth(context, registryAuth).secret,
		environment: environment && new WorkloadEnvironment(componentContext, environment)
	})
	return app.synthYaml()
}

describe('WebService', () => {
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
