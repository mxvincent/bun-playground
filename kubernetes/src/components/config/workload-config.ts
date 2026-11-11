import { join } from 'node:path'
import { type AbstractPod, type Container, type ISecret, Secret, Volume } from 'cdk8s-plus-33'
import type { Context } from '#/helpers/context'
import {
	ExternalSecretV1Beta1,
	ExternalSecretV1Beta1SpecTargetCreationPolicy,
	ExternalSecretV1Beta1SpecTargetTemplateEngineVersion
} from '#/imports/external-secrets.io'
import { EXTERNAL_SECRET_REFRESH_INTERVAL, ExternalSecretRef, SCALEWAY_SECRET_STORE } from '#/plugins/external-secret'

export type JSONLike<T> = T | { [x: string]: JSONLike<T> } | Array<JSONLike<T>>
export type ConfigFileContent = JSONLike<boolean | number | string | ExternalSecretRef>
export type ConfigFileTemplate = JSONLike<boolean | number | string>

/**
 * Config files by file name
 */
export type ConfigFiles = Record<string, ConfigFileContent>

const isPlainObject = (value: ConfigFileContent): value is { [x: string]: ConfigFileContent } => {
	return typeof value === 'object' && !Array.isArray(value) && !(value instanceof ExternalSecretRef)
}

/**
 * Deep-merge two config file contents
 *
 * Plain objects are merged recursively; arrays, scalars and secret references are replaced by the override.
 */
export const mergeConfigFileContent = (base: ConfigFileContent, override: ConfigFileContent): ConfigFileContent => {
	if (!isPlainObject(base) || !isPlainObject(override)) {
		return override
	}
	const merged = { ...base }
	for (const [key, value] of Object.entries(override)) {
		const current = merged[key]
		merged[key] = current === undefined ? value : mergeConfigFileContent(current, value)
	}
	return merged
}

/**
 * Deep-merge the config files of an override into the base ones
 */
export const mergeConfigFiles = (base?: ConfigFiles, override?: ConfigFiles): ConfigFiles | undefined => {
	if (!base || !override) {
		return override ?? base
	}
	return mergeConfigFileContent(base, override) as ConfigFiles
}

export interface ConfigFilesMountOptions {
	container: Container
	path: string
	files?: string[]
}

export class WorkloadConfig {
	readonly context: Context
	readonly templates: Record<string, ConfigFileTemplate> = {}
	readonly secretRefs: Record<string, ExternalSecretRef> = {}
	#secret?: ISecret

	constructor(context: Context, files: ConfigFiles) {
		this.context = context
		for (const [name, value] of Object.entries(files)) {
			this.templates[name] = this.#transform(value)
		}
	}

	get name() {
		return `${this.context.name}-config`
	}

	/**
	 * Return secret containing config files
	 * Manifests will be generated during the first call of this property
	 */
	get secret() {
		if (!this.#secret) {
			this.#secret = this.generate()
		}
		return this.#secret
	}

	generate(): ISecret {
		if (this.#secret) {
			throw new Error('ConfigFile.createManifests() should be called exactly once.')
		}

		const metadata = {
			name: this.name,
			labels: this.context.labels
		}

		const stringData: Record<string, string> = {}
		for (const [key, value] of Object.entries(this.templates)) {
			stringData[key] = typeof value === 'string' ? value : JSON.stringify(value)
		}

		if (!Object.keys(this.secretRefs).length) {
			return new Secret(this.context.chart, `${this.name}-secret`, {
				stringData,
				metadata
			})
		}

		const secret = Secret.fromSecretName(this.context.chart, `${this.name}-secret`, this.name)
		new ExternalSecretV1Beta1(this.context.chart, `${this.name}-external-secret`, {
			metadata: metadata,
			spec: {
				refreshInterval: EXTERNAL_SECRET_REFRESH_INTERVAL,
				secretStoreRef: SCALEWAY_SECRET_STORE,
				target: {
					name: secret.name,
					creationPolicy: ExternalSecretV1Beta1SpecTargetCreationPolicy.OWNER,
					template: {
						engineVersion: ExternalSecretV1Beta1SpecTargetTemplateEngineVersion.V2,
						data: stringData,
						metadata
					}
				},
				data: Object.values(this.secretRefs).map((secret) => ({
					remoteRef: secret.remoteRef,
					secretKey: secret.key
				}))
			}
		})
		return secret
	}

	mount(pod: AbstractPod, options: ConfigFilesMountOptions) {
		// Add volume in pod
		const volume = Volume.fromSecret(this.context.chart, `${pod.name}-config-volume`, this.secret, {
			name: 'config'
		})
		pod.addVolume(volume)
		// Mount volume in containers
		for (const fileName of options.files ?? Object.keys(this.templates)) {
			options.container.mount(join(options.path, fileName), volume, {
				subPath: fileName
			})
		}
	}

	#transform(value: ConfigFileContent): ConfigFileTemplate {
		if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
			return value
		}
		if (value instanceof ExternalSecretRef) {
			this.secretRefs[value.key] = value
			return value.placeholder()
		}
		if (Array.isArray(value)) {
			return value.map((item) => this.#transform(item))
		}
		return Object.entries(value).reduce(
			(record, [key, value]) => Object.assign(record, { [key]: this.#transform(value) }),
			{}
		)
	}
}
