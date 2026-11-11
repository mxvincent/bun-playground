import { describe, expect, test } from 'bun:test'
import { App } from 'cdk8s/lib/app'
import { Chart } from 'cdk8s/lib/chart'
import { WebService } from '#/components/workload/web-service'
import { ComponentContext, Context } from '#/helpers/context'
import type { IngressConfig } from '#/plugins/ingress'
import { Application } from '#interfaces/application'
import { Environment } from '#interfaces/environment'

/**
 * Application context bound to a standalone chart, so that the fixture does not share a scope with real charts
 */
class FixtureContext extends Context {
	constructor(chart: Chart) {
		super(Environment.DEVELOPMENT, Application.ACCOUNT, {
			name: 'fixture',
			revision: '0.0.0-snapshot',
			chart
		})
	}

	component(component: string) {
		return new ComponentContext(this, component)
	}
}

const synthesize = (ingress: IngressConfig): string => {
	const app = new App()
	const context = new FixtureContext(new Chart(app, 'fixture', { disableResourceNameHashes: true }))
	new WebService(context.component('app-server'), { command: ['node', 'app-server.js'], ingress }).generate()
	return app.synthYaml()
}

describe('WebService', () => {
	test('exposes the service with the default ingress annotations', () => {
		expect(synthesize({ host: 'fixture.example.com' })).toMatchSnapshot()
	})

	test('accepts a subset of the ingress annotations', () => {
		expect(synthesize({ host: 'fixture.example.com', annotations: { proxyBodySize: '10m' } })).toMatchSnapshot()
	})
})
