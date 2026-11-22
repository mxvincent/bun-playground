import { describe, expect, test } from 'bun:test'
import { App } from 'cdk8s/lib/app'
import { mergeConfigFiles } from '#/components/config/workload-config'
import { Daemon } from '#/components/workload/daemon'
import { WebService } from '#/components/workload/web-service'
import type { WorkloadComponent } from '#/components/workload-component'
import { defineNamespace, type WorkloadNamespaceOptions } from '#/helpers/namespace'
import { pinRevision } from '#/helpers/revision.testing'
import { Application } from '#/interfaces/application'
import { Environment } from '#/interfaces/environment'
import { ExternalSecret } from '#/plugins/external-secret'

type Manifest = {
	kind: string
	metadata: { name: string }
	stringData?: Record<string, string>
	spec?: { template: { spec: { containers: { env?: { name: string; value?: string }[] }[] } } }
}

/**
 * Synthesize the development manifests of a namespace in a fresh scope
 */
const synthesize = (
	settings: Pick<WorkloadNamespaceOptions, 'config' | 'environment'>,
	components: WorkloadComponent[]
): Manifest[] => {
	const namespace = defineNamespace({
		name: 'fixture',
		application: Application.ACCOUNT,
		imageRegistry: { url: 'registry.example.com/fixture' },
		...settings,
		components
	})
	return namespace.generate(Environment.DEVELOPMENT, { scope: new App() }).toJson()
}

/**
 * Config files of a component, parsed by file name
 */
const configOf = (manifests: Manifest[], component: string): Record<string, unknown> | undefined => {
	const secret = manifests.find(({ kind, metadata }) => kind === 'Secret' && metadata.name === `${component}-config`)
	if (!secret) {
		return undefined
	}
	return Object.fromEntries(Object.entries(secret.stringData ?? {}).map(([name, value]) => [name, JSON.parse(value)]))
}

/**
 * Environment variables of a component container set by the namespace or the component, by name
 */
const environmentOf = (manifests: Manifest[], component: string): Record<string, string | undefined> => {
	const deployment = manifests.find(({ kind, metadata }) => kind === 'Deployment' && metadata.name === component)
	const variables = deployment?.spec?.template.spec.containers[0]?.env ?? []
	return Object.fromEntries(
		variables
			.filter(({ name }) => name !== 'CONFIG_FILE_PATH' && name !== 'NODE_ENV')
			.map(({ name, value }) => [name, value])
	)
}

const service = (name: string, options: Pick<WebService['options'], 'config' | 'environment'> = {}) => {
	return new WebService({ name, command: ['server'], ...options })
}

describe('defineNamespace', () => {
	pinRevision(Application.ACCOUNT)

	test('applies the namespace settings to a component without settings', () => {
		const manifests = synthesize({ config: { 'config.json': { level: 'info' } }, environment: { FROM: 'namespace' } }, [
			service('inherits')
		])
		expect(configOf(manifests, 'inherits')).toEqual({ 'config.json': { level: 'info' } })
		expect(environmentOf(manifests, 'inherits')).toEqual({ FROM: 'namespace' })
	})

	test('deep-merges the component config files into the namespace ones', () => {
		const manifests = synthesize(
			{
				config: {
					'config.json': { app: { logLevel: 'info', timeZone: 'UTC' }, hosts: ['a', 'b'], port: 3000 },
					'namespace.json': { enabled: true }
				}
			},
			[
				service('extends', {
					config: {
						'config.json': { app: { logLevel: 'debug' }, hosts: ['c'], port: 4000 },
						'component.json': { enabled: false }
					}
				})
			]
		)
		expect(configOf(manifests, 'extends')).toEqual({
			'config.json': { app: { logLevel: 'debug', timeZone: 'UTC' }, hosts: ['c'], port: 4000 },
			'namespace.json': { enabled: true },
			'component.json': { enabled: false }
		})
	})

	test('merges the component environment variables into the namespace ones, the component winning', () => {
		const manifests = synthesize({ environment: { SHARED: 'namespace', NAMESPACE_ONLY: 'namespace' } }, [
			service('extends', { environment: { SHARED: 'component', COMPONENT_ONLY: 'component' } })
		])
		expect(environmentOf(manifests, 'extends')).toEqual({
			SHARED: 'component',
			NAMESPACE_ONLY: 'namespace',
			COMPONENT_ONLY: 'component'
		})
	})

	test('calls the setting functions with the context of each component', () => {
		const manifests = synthesize(
			{
				config: (context) => ({ 'config.json': { namespace: context.namespace } }),
				environment: (context) => ({ NAMESPACE_COMPONENT: context.component })
			},
			[
				service('first', {
					config: (context) => ({ 'config.json': { component: context.component } }),
					environment: (context) => ({ COMPONENT: context.component })
				}),
				service('second')
			]
		)
		expect(configOf(manifests, 'first')).toEqual({
			'config.json': { namespace: 'development-fixture', component: 'first' }
		})
		expect(environmentOf(manifests, 'first')).toEqual({ NAMESPACE_COMPONENT: 'first', COMPONENT: 'first' })
		expect(configOf(manifests, 'second')).toEqual({ 'config.json': { namespace: 'development-fixture' } })
		expect(environmentOf(manifests, 'second')).toEqual({ NAMESPACE_COMPONENT: 'second' })
	})

	test('rejects duplicate component names', () => {
		expect(() =>
			defineNamespace({
				name: 'fixture',
				application: Application.ACCOUNT,
				imageRegistry: { url: 'registry.example.com/fixture' },
				components: [
					new WebService({ name: 'server', command: ['server'] }),
					new Daemon({ name: 'server', command: ['daemon'] })
				]
			})
		).toThrow('Duplicate component name in namespace fixture: server')
	})
})

describe('mergeConfigFiles', () => {
	const secrets = new ExternalSecret('fixture-secrets')

	test('deep-merges plain objects and replaces arrays, scalars and secret references', () => {
		const namespace = {
			'config.json': {
				app: { logLevel: 'info', timeZone: 'UTC' },
				hosts: ['a', 'b'],
				password: secrets.ref('PASSWORD')
			},
			'namespace.json': { enabled: true }
		}
		const component = {
			'config.json': {
				app: { logLevel: 'debug' },
				hosts: ['c'],
				password: 'plain',
				server: { port: 4000 }
			},
			'component.json': { enabled: false }
		}
		expect(mergeConfigFiles(namespace, component)).toEqual({
			'config.json': {
				app: { logLevel: 'debug', timeZone: 'UTC' },
				hosts: ['c'],
				password: 'plain',
				server: { port: 4000 }
			},
			'namespace.json': { enabled: true },
			'component.json': { enabled: false }
		})
	})

	test('replaces a plain object by a secret reference', () => {
		const password = secrets.ref('PASSWORD')
		expect(
			mergeConfigFiles({ 'config.json': { password: { file: '/secret' } } }, { 'config.json': { password } })
		).toEqual({
			'config.json': { password }
		})
	})
})
