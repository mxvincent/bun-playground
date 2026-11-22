import { describe, expect, test } from 'bun:test'
import { Duration } from 'cdk8s'
import { App } from 'cdk8s/lib/app'
import { defineNamespace, type WorkloadNamespaceOptions } from '../../helpers/namespace'
import { ArgoCDAnnotation, ArgocdHook, ArgocdHookDeletePolicy } from '../../plugins/argocd'
import { ExternalSecret } from '../../plugins/external-secret'
import { ReloaderAnnotation } from '../../plugins/reloader'
import { pinRevision } from '../../testing'
import { Job, type JobOptions } from './job'

type Manifest = {
	kind: string
	metadata: { name: string; annotations?: Record<string, string> }
	spec?: {
		activeDeadlineSeconds?: number
		template: {
			spec: {
				restartPolicy?: string
				imagePullSecrets?: { name: string }[]
				volumes?: { name: string; secret?: { secretName: string } }[]
				containers: {
					env?: { name: string; value?: string }[]
					volumeMounts?: { name: string; mountPath: string; subPath?: string }[]
				}[]
			}
		}
	}
}

type NamespaceSettings = Pick<WorkloadNamespaceOptions, 'config' | 'environment' | 'imageRegistry'>

const namespace = (settings: NamespaceSettings, options: Partial<JobOptions>) => {
	return defineNamespace({
		name: 'fixture',
		application: 'fixture',
		imageRegistry: { url: 'registry.example.com/fixture' },
		...settings,
		components: [new Job({ name: 'migrate', command: ['bun', 'migrate.ts'], ...options })]
	})
}

/**
 * Synthesize the development manifests of a namespace holding a single job, in a fresh scope
 */
const synthesize = (settings: NamespaceSettings = {}, options: Partial<JobOptions> = {}): Manifest[] => {
	return namespace(settings, options).generate('development', { scope: new App() }).toJson()
}

const jobOf = (manifests: Manifest[]) => {
	const job = manifests.find(({ kind }) => kind === 'Job')
	if (!job?.spec) {
		throw new Error('The namespace has no job')
	}
	return { annotations: job.metadata.annotations ?? {}, spec: job.spec, pod: job.spec.template.spec }
}

const secrets = new ExternalSecret('fixture-secrets')
const registryAuth = new ExternalSecret('image-registry-auth')

describe('Job', () => {
	pinRevision('fixture')

	test('generates a job with its config, environment secret and registry credentials', () => {
		const app = new App()
		namespace(
			{
				imageRegistry: { url: 'registry.example.com/fixture', auth: registryAuth },
				config: { 'config.json': { level: 'info' } },
				environment: { API_KEY: secrets.ref('API_KEY') }
			},
			{ activeDeadline: Duration.minutes(10) }
		).generate('development', { scope: app })
		expect(app.synthYaml()).toMatchSnapshot()
	})

	test('runs as an Argo CD sync hook replaced on each sync and deleted before the next hook is created', () => {
		const { annotations } = jobOf(synthesize())
		expect(annotations).toMatchObject({
			[ArgoCDAnnotation.SYNC_OPTIONS]: 'Replace=true',
			[ArgoCDAnnotation.HOOK]: 'Sync',
			[ArgoCDAnnotation.HOOK_DELETE_POLICY]: 'BeforeHookCreation'
		})
	})

	test.each(Object.values(ArgocdHook))('runs as the %s Argo CD hook', (hook) => {
		const { annotations } = jobOf(synthesize({}, { hook }))
		expect(annotations[ArgoCDAnnotation.HOOK]).toBe(hook)
		expect(annotations[ArgoCDAnnotation.HOOK_DELETE_POLICY]).toBe(ArgocdHookDeletePolicy.BEFORE_CREATION)
		expect(annotations[ArgoCDAnnotation.SYNC_OPTIONS]).toBe('Replace=true')
	})

	test.each(Object.values(ArgocdHookDeletePolicy))('deletes the hook with the %s policy', (deletePolicy) => {
		const { annotations } = jobOf(synthesize({}, { deletePolicy }))
		expect(annotations[ArgoCDAnnotation.HOOK_DELETE_POLICY]).toBe(deletePolicy)
		expect(annotations[ArgoCDAnnotation.HOOK]).toBe(ArgocdHook.SYNC)
		expect(annotations[ArgoCDAnnotation.SYNC_OPTIONS]).toBe('Replace=true')
	})

	test.each([
		['no deadline by default', undefined, undefined],
		['a deadline given in minutes', Duration.minutes(10), 600],
		['a deadline given in seconds', Duration.seconds(90), 90]
	])('runs with %s', (_, activeDeadline, expected) => {
		const { spec } = jobOf(synthesize({}, { activeDeadline }))
		expect(spec.activeDeadlineSeconds).toBe(expected)
	})

	test('restarts the pod on failure', () => {
		expect(jobOf(synthesize()).pod.restartPolicy).toBe('OnFailure')
	})

	test('pulls the image with the registry pull secret', () => {
		const { pod } = jobOf(synthesize({ imageRegistry: { url: 'registry.example.com/fixture', auth: registryAuth } }))
		expect(pod.imagePullSecrets).toEqual([{ name: 'docker-auth' }])
	})

	test('pulls the image without a pull secret when the registry is public', () => {
		expect(jobOf(synthesize()).pod.imagePullSecrets).toBeUndefined()
	})

	test('mounts each config file from the config secret and points the application to it', () => {
		const { pod } = jobOf(synthesize({ config: { 'config.json': { level: 'info' }, 'extra.json': { enabled: true } } }))
		const volume = pod.volumes?.find(({ secret }) => secret?.secretName === 'migrate-config')
		expect(volume).toBeDefined()
		const container = pod.containers[0]
		expect(container?.volumeMounts).toEqual([
			{ name: volume?.name ?? '', mountPath: '/app/config/config.json', subPath: 'config.json' },
			{ name: volume?.name ?? '', mountPath: '/app/config/extra.json', subPath: 'extra.json' }
		])
		expect(container?.env).toEqual(
			expect.arrayContaining([
				{ name: 'CONFIG_FILE_PATH', value: '/app/config/config.json' },
				{ name: 'NODE_ENV', value: 'production' }
			])
		)
	})

	test.each([
		['no secret', {}, undefined],
		['the config secret', { config: { 'config.json': { level: 'info' } } }, 'migrate-config'],
		['the environment secret', { environment: { API_KEY: secrets.ref('API_KEY') } }, 'migrate-env'],
		[
			'the config and environment secrets',
			{ config: { 'config.json': { level: 'info' } }, environment: { API_KEY: secrets.ref('API_KEY') } },
			'migrate-config,migrate-env'
		]
	] satisfies [
		string,
		NamespaceSettings,
		string | undefined
	][])('lists %s in the reload annotation', (_, settings, expected) => {
		const { annotations } = jobOf(synthesize(settings))
		expect(annotations[ReloaderAnnotation.RELOAD_ON_SECRET_CHANGE]).toBe(expected)
	})
})
