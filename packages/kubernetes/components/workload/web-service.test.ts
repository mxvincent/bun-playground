import { describe, expect, test } from 'bun:test'
import { App } from 'cdk8s/lib/app'
import { defineNamespace } from '../../helpers/namespace'
import { CertManagerAnnotation } from '../../plugins/cert-manager'
import { ExternalSecret } from '../../plugins/external-secret'
import { type IngressConfig, NginxIngressAnnotation } from '../../plugins/ingress'
import { ReloaderAnnotation } from '../../plugins/reloader'
import { pinRevision } from '../../testing'
import type { ConfigFiles } from '../config/workload-config'
import type { EnvironmentVariables } from '../config/workload-environment'
import { CONFIG_DIRECTORY } from '../shared'
import { WebService } from './web-service'

interface FixtureOptions {
	replicas?: number
	ingress?: IngressConfig
	config?: ConfigFiles
	environment?: EnvironmentVariables
	registryAuth?: ExternalSecret
}

type Manifest = {
	kind: string
	metadata: { annotations?: Record<string, string> }
	spec?: {
		replicas?: number
		rules?: unknown[]
		template?: { spec: { volumes?: unknown[]; containers: { volumeMounts?: unknown[] }[] } }
	}
}

const generate = ({ replicas, ingress, config, environment, registryAuth }: FixtureOptions = {}): App => {
	const app = new App()
	defineNamespace({
		name: 'fixture',
		application: 'fixture',
		imageRegistry: { url: 'ghcr.io/mxvincent', auth: registryAuth },
		config,
		environment,
		components: [new WebService({ name: 'app-server', command: ['node', 'app-server.js'], replicas, ingress })]
	}).generate('development', { scope: app })
	return app
}

const synthesize = (options: FixtureOptions = {}): string => generate(options).synthYaml()

/**
 * Synthesized manifest of the given kind
 */
const manifestOf = (kind: string, options: FixtureOptions): Manifest | undefined => {
	const manifests: Manifest[] = generate(options).charts.flatMap((chart) => chart.toJson())
	return manifests.find((manifest) => manifest.kind === kind)
}

const host = 'fixture.example.com'

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

	test('runs the given replicas', () => {
		expect(manifestOf('Deployment', { replicas: 3 })?.spec?.replicas).toBe(3)
	})

	test('routes the given path of the ingress host to the service', () => {
		expect(manifestOf('Ingress', { ingress: { host, path: '/api' } })?.spec?.rules).toEqual([
			{
				host,
				http: {
					paths: [
						{ path: '/api', pathType: 'Prefix', backend: { service: { name: 'app-server', port: { number: 4000 } } } }
					]
				}
			}
		])
	})

	test.each([
		['the given issuer', { certIssuer: 'acme-dns' }, 'acme-dns', 'true'],
		['a disabled redirect', { sslRedirect: false }, 'acme-http', 'false'],
		['the given issuer and an enabled redirect', { certIssuer: 'acme-dns', sslRedirect: true }, 'acme-dns', 'true']
	])('annotates the ingress with %s', (_, annotations, certIssuer, sslRedirect) => {
		expect(manifestOf('Ingress', { ingress: { host, annotations } })?.metadata.annotations).toEqual({
			[CertManagerAnnotation.CERT_ISSUER]: certIssuer,
			[NginxIngressAnnotation.SSL_REDIRECT]: sslRedirect
		})
	})

	test('mounts each config file and reloads the workload when the config or environment secret changes', () => {
		const secrets = new ExternalSecret('fixture-secrets')
		const deployment = manifestOf('Deployment', {
			config: { 'config.json': { level: 'info' }, 'features.json': { enabled: true } },
			environment: { API_KEY: secrets.ref('API_KEY') }
		})
		const pod = deployment?.spec?.template?.spec
		expect(deployment?.metadata.annotations).toEqual({
			[ReloaderAnnotation.RELOAD_ON_SECRET_CHANGE]: 'app-server-config,app-server-env'
		})
		expect(pod?.volumes).toEqual([{ name: 'config', secret: { secretName: 'app-server-config' } }])
		expect(pod?.containers[0]?.volumeMounts).toEqual([
			{ name: 'config', mountPath: `${CONFIG_DIRECTORY}/config.json`, subPath: 'config.json' },
			{ name: 'config', mountPath: `${CONFIG_DIRECTORY}/features.json`, subPath: 'features.json' }
		])
	})
})
