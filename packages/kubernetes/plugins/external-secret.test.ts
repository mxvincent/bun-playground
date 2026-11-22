import { describe, expect, test } from 'bun:test'
import { App } from 'cdk8s/lib/app'
import { WebService } from '../components/workload/web-service'
import { defineNamespace, type WorkloadNamespaceOptions } from '../helpers/namespace'
import { pinRevision } from '../testing'
import { ExternalSecret, ExternalSecretRef } from './external-secret'

type Manifest = {
	kind: string
	metadata: { name: string }
	spec?: { data?: { secretKey: string; remoteRef: Record<string, string> }[] }
}

/**
 * Synthesize the development manifests of a namespace with a single web service in a fresh scope
 */
const synthesize = (environment: WorkloadNamespaceOptions['environment']): Manifest[] => {
	return defineNamespace({
		name: 'fixture',
		application: 'fixture',
		imageRegistry: { url: 'registry.example.com/fixture' },
		environment,
		components: [new WebService({ name: 'server', command: ['server'] })]
	})
		.generate('development', { scope: new App() })
		.toJson()
}

const externalSecretOf = (manifests: Manifest[], name: string) => {
	return manifests.find((manifest) => manifest.kind === 'ExternalSecret' && manifest.metadata.name === name)?.spec
}

const expectedRemoteRef = (key: string, property: string, version: string) => ({
	key,
	property,
	conversionStrategy: 'Default',
	decodingStrategy: 'None',
	version,
	metadataPolicy: 'None'
})

describe('ExternalSecretRef', () => {
	test.each([
		['fixture', 'PASSWORD', 'FIXTURE_PASSWORD'],
		['fixture', 'password', 'FIXTURE_PASSWORD'],
		['fixture-secrets', 'API_KEY', 'FIXTURE_SECRETS_API_KEY'],
		['my-app-db', 'db-password', 'MY_APP_DB_DB_PASSWORD'],
		['fixture-secrets', '', 'FIXTURE_SECRETS'],
		['my-app-db', '', 'MY_APP_DB']
	])('formats the key of %p with the property %p as %p', (secretName, property, expected) => {
		const ref = new ExternalSecretRef(secretName, { property })
		expect(ref.key).toBe(expected)
		expect(ref.placeholder()).toBe(`{{ .${expected} | toString }}`)
	})

	test.each([
		['the latest version by default', {}, 'latest'],
		['the given version', { version: '3' }, '3']
	])('reads %s of the property from the secret store', (_, options, version) => {
		const ref = new ExternalSecret('fixture-secrets').ref('API_KEY', options)
		expect(ref.externalSecretName).toBe('fixture-secrets')
		expect<object>(ref.remoteRef).toEqual(expectedRemoteRef('name:fixture-secrets', 'API_KEY', version))
	})
})

describe('ExternalSecretRef in the synthesized manifests', () => {
	pinRevision('fixture')

	const secrets = new ExternalSecret('fixture-secrets')

	test('references each secret property with its remote ref and version in the environment external secret', () => {
		const manifests = synthesize({
			API_KEY: secrets.ref('api-key'),
			DB_PASSWORD: secrets.ref('db-password', { version: '7' })
		})
		expect(externalSecretOf(manifests, 'server-env')?.data).toEqual([
			{ secretKey: 'API_KEY', remoteRef: expectedRemoteRef('name:fixture-secrets', 'api-key', 'latest') },
			{ secretKey: 'DB_PASSWORD', remoteRef: expectedRemoteRef('name:fixture-secrets', 'db-password', '7') }
		])
	})
})
