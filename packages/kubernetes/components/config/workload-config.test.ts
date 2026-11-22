import { describe, expect, test } from 'bun:test'
import { App } from 'cdk8s/lib/app'
import { Pod } from 'cdk8s-plus-37'
import { KubernetesConfigAlreadyGeneratedError } from '../../errors/config-already-generated'
import { ApplicationContext, type ComponentContext } from '../../helpers/context'
import { DEFAULT_SECRET_STORE, ExternalSecret } from '../../plugins/external-secret'
import { pinRevision } from '../../testing'
import { type ConfigFiles, WorkloadConfig } from './workload-config'

type Manifest = {
	kind: string
	metadata: { name: string; namespace?: string; labels?: Record<string, string> }
	spec?: {
		refreshInterval?: string
		secretStoreRef?: unknown
		target?: {
			name: string
			creationPolicy: string
			template: { engineVersion: string; data: Record<string, string>; metadata: unknown }
		}
		data?: { secretKey: string; remoteRef: unknown }[]
		volumes?: { name: string; secret?: { secretName: string } }[]
		containers?: { volumeMounts?: { name: string; mountPath: string; subPath?: string }[] }[]
	}
}

/**
 * Context of the `server` component of a namespace generated in a fresh scope
 */
const componentContext = (): ComponentContext => {
	return new ApplicationContext('development', 'fixture', 'fixture', { scope: new App() }).component('server')
}

const manifestsOf = (context: ComponentContext): Manifest[] => context.chart.toJson()

const byKind = (manifests: Manifest[], kind: string) => manifests.filter((manifest) => manifest.kind === kind)

describe('WorkloadConfig', () => {
	pinRevision('fixture')

	describe('with secret references', () => {
		const secrets = new ExternalSecret('fixture-secrets')
		const database = new ExternalSecret('database')
		const password = secrets.ref('db-password')
		const apiKey = database.ref('api-key')
		const files: ConfigFiles = {
			'config.json': { database: { password, user: 'app' }, keys: [apiKey, password], port: 3000 },
			'token.txt': password
		}

		const generate = () => {
			const context = componentContext()
			const config = new WorkloadConfig(context, files)
			const secret = config.secret
			return { context, secret, manifests: manifestsOf(context) }
		}

		test('replaces the plain secret by an external secret targeting the config secret', () => {
			const { context, secret, manifests } = generate()
			expect(byKind(manifests, 'Secret')).toEqual([])
			const [externalSecret, ...others] = byKind(manifests, 'ExternalSecret')
			expect(others).toEqual([])
			expect(secret.name).toBe('server-config')
			expect(externalSecret?.metadata).toEqual({
				name: 'server-config',
				namespace: 'development-fixture',
				labels: context.labels
			})
			expect(externalSecret?.spec).toMatchObject({
				refreshInterval: '1h',
				secretStoreRef: DEFAULT_SECRET_STORE,
				target: { name: 'server-config', creationPolicy: 'Owner', template: { metadata: { labels: context.labels } } }
			})
		})

		test('renders the files with the v2 template engine and a placeholder per reference', () => {
			const template = byKind(generate().manifests, 'ExternalSecret')[0]?.spec?.target?.template
			expect(template?.engineVersion).toBe('v2')
			expect(Object.keys(template?.data ?? {})).toEqual(['config.json', 'token.txt'])
			expect(JSON.parse(template?.data['config.json'] ?? '')).toEqual({
				database: { password: '{{ .FIXTURE_SECRETS_DB_PASSWORD | toString }}', user: 'app' },
				keys: ['{{ .DATABASE_API_KEY | toString }}', '{{ .FIXTURE_SECRETS_DB_PASSWORD | toString }}'],
				port: 3000
			})
			// A file made of a single reference is the placeholder itself, not a JSON string
			expect(template?.data['token.txt']).toBe('{{ .FIXTURE_SECRETS_DB_PASSWORD | toString }}')
		})

		test('reads each reference once, whatever the number of placeholders', () => {
			const externalSecret = byKind(generate().manifests, 'ExternalSecret')[0]
			expect(externalSecret?.spec?.data).toEqual([
				{ secretKey: 'FIXTURE_SECRETS_DB_PASSWORD', remoteRef: password.remoteRef },
				{ secretKey: 'DATABASE_API_KEY', remoteRef: apiKey.remoteRef }
			])
		})
	})

	test.each([
		['plain config files', { 'config.json': { port: 3000 } }],
		['config files with a secret reference', { 'config.json': { key: new ExternalSecret('fixture').ref('KEY') } }]
	])('generates the manifests of %s once', (_, files: ConfigFiles) => {
		const context = componentContext()
		const config = new WorkloadConfig(context, files)
		const secret = config.secret
		expect(config.secret).toBe(secret)
		expect(() => config.generate()).toThrow(
			expect.objectContaining({
				constructor: KubernetesConfigAlreadyGeneratedError,
				message: 'ConfigFile.createManifests() should be called exactly once.'
			})
		)
		expect(manifestsOf(context)).toHaveLength(1)
	})

	test.each([
		['every file when no file is given', undefined, ['config.json', 'extra.json']],
		['the given files only', ['extra.json'], ['extra.json']]
	])('mounts %s', (_, files, mounted) => {
		const context = componentContext()
		const config = new WorkloadConfig(context, { 'config.json': { port: 3000 }, 'extra.json': { enabled: true } })
		const pod = new Pod(context.chart, 'pod')
		const container = pod.addContainer({ name: 'server', image: 'fixture' })
		config.mount(pod, { container, path: '/app/config', files })
		const spec = byKind(manifestsOf(context), 'Pod')[0]?.spec
		expect(spec?.volumes).toEqual([{ name: 'config', secret: { secretName: 'server-config' } }])
		expect(spec?.containers?.[0]?.volumeMounts).toEqual(
			mounted.map((file) => ({ name: 'config', mountPath: `/app/config/${file}`, subPath: file }))
		)
	})
})
