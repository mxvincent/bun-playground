import { describe, expect, test } from 'bun:test'
import { Cron } from 'cdk8s'
import { App } from 'cdk8s/lib/app'
import { defineNamespace, type WorkloadNamespaceOptions } from '../../helpers/namespace'
import { ExternalSecret } from '../../plugins/external-secret'
import { ReloaderAnnotation } from '../../plugins/reloader'
import { pinRevision } from '../../testing'
import { CONFIG_DIRECTORY } from '../shared'
import { CronJob } from './cron-job'

type Container = {
	name: string
	env?: { name: string; value?: string }[]
	volumeMounts?: { name: string; mountPath: string; subPath?: string }[]
}

type PodSpec = {
	containers: Container[]
	imagePullSecrets?: { name: string }[]
	volumes?: { name: string; secret?: { secretName: string } }[]
}

type Manifest = {
	kind: string
	metadata: { name: string; annotations?: Record<string, string> }
	spec?: {
		schedule?: string
		concurrencyPolicy?: string
		successfulJobsHistoryLimit?: number
		jobTemplate?: { spec: { template: { spec: PodSpec } } }
	}
}

type FixtureOptions = Pick<WorkloadNamespaceOptions, 'config' | 'environment'> & {
	schedule?: Cron
	registryAuth?: ExternalSecret
}

const fixture = ({ schedule = Cron.daily(), registryAuth, ...settings }: FixtureOptions = {}) => {
	return defineNamespace({
		name: 'fixture',
		application: 'fixture',
		imageRegistry: { url: 'ghcr.io/mxvincent', auth: registryAuth },
		...settings,
		components: [new CronJob({ name: 'cleanup', command: ['node', 'cleanup.js'], schedule })]
	})
}

/**
 * Synthesize the development manifests of the namespace in a fresh scope
 */
const synthesize = (options: FixtureOptions = {}): Manifest[] => {
	return fixture(options).generate('development', { scope: new App() }).toJson()
}

/**
 * The cron job manifest and the pod spec of its job template
 */
const cronJobOf = (manifests: Manifest[]) => {
	const cronJob = manifests.find(({ kind }) => kind === 'CronJob')
	if (!cronJob) {
		throw new Error('No CronJob synthesized')
	}
	const pod = cronJob.spec?.jobTemplate?.spec.template.spec
	const container = pod?.containers[0]
	if (!pod || !container) {
		throw new Error('No job template container synthesized')
	}
	return { cronJob, pod, container }
}

describe('CronJob', () => {
	pinRevision('fixture')

	test('renders the cron job of a namespace', () => {
		const app = new App()
		fixture().generate('development', { scope: app })
		expect(app.synthYaml()).toMatchSnapshot()
	})

	test.each([
		['a daily schedule', Cron.daily(), '0 0 * * *'],
		['a custom schedule', Cron.schedule({ minute: '*/15', hour: '8-18', weekDay: 'MON-FRI' }), '*/15 8-18 * * MON-FRI']
	])('runs on %s', (_, schedule, expected) => {
		const { cronJob } = cronJobOf(synthesize({ schedule }))
		expect(cronJob.spec?.schedule).toBe(expected)
	})

	test('never runs two jobs at the same time', () => {
		const { cronJob } = cronJobOf(synthesize())
		expect(cronJob.spec?.concurrencyPolicy).toBe('Forbid')
	})

	test('retains the 3 last successful jobs', () => {
		const { cronJob } = cronJobOf(synthesize())
		expect(cronJob.spec?.successfulJobsHistoryLimit).toBe(3)
	})

	test.each([
		['without registry credentials', undefined, undefined],
		['with the registry pull secret', new ExternalSecret('image-registry-auth'), [{ name: 'docker-auth' }]]
	])('pulls the image %s', (_, registryAuth, expected) => {
		const { pod } = cronJobOf(synthesize({ registryAuth }))
		expect(pod.imagePullSecrets).toEqual(expected)
	})

	test('mounts the config files in the job container', () => {
		const { pod, container } = cronJobOf(
			synthesize({ config: { 'config.json': { level: 'info' }, 'extra.json': { enabled: true } } })
		)
		expect(pod.volumes).toEqual([{ name: 'config', secret: { secretName: 'cleanup-config' } }])
		expect(container.volumeMounts).toEqual([
			{ name: 'config', mountPath: `${CONFIG_DIRECTORY}/config.json`, subPath: 'config.json' },
			{ name: 'config', mountPath: `${CONFIG_DIRECTORY}/extra.json`, subPath: 'extra.json' }
		])
		expect(container.env).toContainEqual({ name: 'CONFIG_FILE_PATH', value: `${CONFIG_DIRECTORY}/config.json` })
	})

	const secrets = new ExternalSecret('fixture-secrets')

	test.each([
		['neither config files nor environment secret', {}, undefined],
		['config files', { config: { 'config.json': { level: 'info' } } }, 'cleanup-config'],
		['an environment secret', { environment: { API_KEY: secrets.ref('API_KEY') } }, 'cleanup-env'],
		[
			'config files and an environment secret',
			{ config: { 'config.json': { level: 'info' } }, environment: { API_KEY: secrets.ref('API_KEY') } },
			'cleanup-config,cleanup-env'
		]
	])('sets the reload annotation with %s', (_, settings: FixtureOptions, expected) => {
		const { cronJob } = cronJobOf(synthesize(settings))
		expect(cronJob.metadata.annotations?.[ReloaderAnnotation.RELOAD_ON_SECRET_CHANGE]).toBe(expected)
	})
})
