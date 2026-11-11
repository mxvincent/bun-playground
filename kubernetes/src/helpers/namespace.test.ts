import { describe, expect, test } from 'bun:test'
import { mergeConfigFiles } from '#/components/config/workload-config'
import { Daemon } from '#/components/workload/daemon'
import { WebService } from '#/components/workload/web-service'
import { defineNamespace } from '#/helpers/namespace'
import { Application } from '#/interfaces/application'
import { ExternalSecret } from '#/plugins/external-secret'

describe('defineNamespace', () => {
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
