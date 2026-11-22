import { describe, expect, test } from 'bun:test'
import { App } from 'cdk8s/lib/app'
import { defineNamespace, type WorkloadNamespaceOptions } from '../../helpers/namespace'
import { ExternalSecret } from '../../plugins/external-secret'
import { ReloaderAnnotation } from '../../plugins/reloader'
import { pinRevision } from '../../testing'
import { Daemon, type DaemonOptions } from './daemon'

type Deployment = {
	kind: 'Deployment'
	metadata: { name: string; annotations?: Record<string, string> }
	spec: {
		replicas: number
		template: {
			spec: {
				imagePullSecrets?: { name: string }[]
				containers: { volumeMounts?: { mountPath: string; name: string; subPath?: string }[] }[]
				volumes?: { name: string; secret?: { secretName: string } }[]
			}
		}
	}
}

type Manifest = { kind: string; metadata: { name: string } } | Deployment

type FixtureOptions = Pick<DaemonOptions, 'replicas' | 'config' | 'environment'> &
	Pick<WorkloadNamespaceOptions, 'imageRegistry'>

const app = (options: FixtureOptions = {}): App => {
	const { imageRegistry = { url: 'ghcr.io/mxvincent' }, ...daemon } = options
	const scope = new App()
	defineNamespace({
		name: 'fixture',
		application: 'fixture',
		imageRegistry,
		components: [new Daemon({ name: 'worker', command: ['bun', 'worker.ts'], ...daemon })]
	}).generate('development', { scope })
	return scope
}

const deploymentOf = (options: FixtureOptions = {}): Deployment => {
	const manifests = app(options).charts.flatMap((chart) => chart.toJson()) as Manifest[]
	const deployment = manifests.find((manifest): manifest is Deployment => manifest.kind === 'Deployment')
	if (!deployment) {
		throw new Error('The daemon did not generate a deployment')
	}
	return deployment
}

const secrets = new ExternalSecret('fixture-secrets')

describe('Daemon', () => {
	pinRevision('fixture')

	test('runs a deployment without exposing it', () => {
		const manifests = app().charts.flatMap((chart) => chart.toJson()) as Manifest[]
		expect(manifests.map(({ kind, metadata }) => `${kind}/${metadata.name}`)).toEqual(['Deployment/worker'])
	})

	test.each([
		['one replica by default', undefined, 1],
		['the given replicas', 3, 3],
		['no replica when scaled down', 0, 0]
	])('runs %s', (_, replicas, expected) => {
		expect(deploymentOf({ replicas }).spec.replicas).toBe(expected)
	})

	test.each([
		['without registry credentials', undefined, undefined],
		['with the registry credentials', new ExternalSecret('image-registry-auth'), [{ name: 'docker-auth' }]]
	])('pulls the image %s', (_, auth, expected) => {
		const deployment = deploymentOf({ imageRegistry: { url: 'ghcr.io/mxvincent', auth } })
		expect(deployment.spec.template.spec.imagePullSecrets).toEqual(expected)
	})

	test('mounts every config file from the config secret', () => {
		const { spec } = deploymentOf({ config: { 'config.json': { level: 'info' }, 'rules.yaml': 'strict: true' } })
		expect(spec.template.spec.volumes).toEqual([{ name: 'config', secret: { secretName: 'worker-config' } }])
		expect(spec.template.spec.containers[0]?.volumeMounts).toEqual([
			{ mountPath: '/app/config/config.json', name: 'config', subPath: 'config.json' },
			{ mountPath: '/app/config/rules.yaml', name: 'config', subPath: 'rules.yaml' }
		])
	})

	test('mounts nothing without config', () => {
		const { spec } = deploymentOf()
		expect(spec.template.spec.volumes).toBeUndefined()
		expect(spec.template.spec.containers[0]?.volumeMounts).toBeUndefined()
	})

	test.each<[string, FixtureOptions, string | undefined]>([
		['nothing without config nor environment secret', { environment: { LEVEL: 'info' } }, undefined],
		['the config secret', { config: { 'config.json': { level: 'info' } } }, 'worker-config'],
		['the environment secret', { environment: { API_KEY: secrets.ref('API_KEY') } }, 'worker-env'],
		[
			'the config and environment secrets',
			{ config: { 'config.json': { level: 'info' } }, environment: { API_KEY: secrets.ref('API_KEY') } },
			'worker-config,worker-env'
		]
	])('reloads the workload on change of %s', (_, options, expected) => {
		const { metadata } = deploymentOf(options)
		expect(metadata.annotations?.[ReloaderAnnotation.RELOAD_ON_SECRET_CHANGE]).toBe(expected)
	})
})
