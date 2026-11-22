import { EnvValue, type ISecret, Secret } from 'cdk8s-plus-33'
import type { Context } from '#/helpers/context'
import {
	ExternalSecret,
	type ExternalSecretSpecDataRemoteRef,
	ExternalSecretSpecTargetCreationPolicy
} from '#/imports/external-secrets.io'
import {
	EXTERNAL_SECRET_REFRESH_INTERVAL,
	type ExternalSecretRef,
	SCALEWAY_SECRET_STORE
} from '#/plugins/external-secret'

export type EnvironmentValue = string | ExternalSecretRef

/**
 * Environment variables by name
 */
export type EnvironmentVariables = Record<string, EnvironmentValue>

export class WorkloadEnvironment {
	readonly context: Context
	readonly values: Record<string, EnvValue> = {}
	secret?: ISecret
	readonly #externalSecretValues: Record<string, ExternalSecretSpecDataRemoteRef> = {}

	constructor(context: Context, data: EnvironmentVariables) {
		this.context = context
		for (const [key, value] of Object.entries(data)) {
			if (typeof value === 'string') {
				this.#setValue(key, value)
			} else {
				this.#setExternalSecretValue(key, value)
			}
		}
		if (Object.keys(this.#externalSecretValues).length) {
			this.#registerExternalSecret(this.#externalSecretValues)
		}
	}

	get name() {
		return `${this.context.name}-env`
	}

	get #initializedSecret() {
		this.secret ??= Secret.fromSecretName(this.context.chart, this.name, this.name)
		return this.secret
	}

	/**
	 * Set a string value
	 */
	#setValue(key: string, value: string) {
		this.values[key] = EnvValue.fromValue(value)
	}

	/**
	 * Set a value referencing an external secret
	 */
	#setExternalSecretValue(key: string, value: ExternalSecretRef) {
		const secret = this.#initializedSecret
		this.values[key] = secret.envValue(key)
		this.#externalSecretValues[key] = value.remoteRef
	}

	/**
	 * Create external secret
	 */
	#registerExternalSecret(values: Record<string, ExternalSecretSpecDataRemoteRef>) {
		const secret = this.#initializedSecret
		new ExternalSecret(this.context.chart, `${this.name}-external-secrets`, {
			metadata: {
				labels: this.context.labels,
				name: this.name
			},
			spec: {
				refreshInterval: EXTERNAL_SECRET_REFRESH_INTERVAL,
				secretStoreRef: SCALEWAY_SECRET_STORE,
				target: {
					name: secret.name,
					creationPolicy: ExternalSecretSpecTargetCreationPolicy.OWNER
				},
				data: Object.entries(values).map(([secretKey, remoteRef]) => ({
					secretKey,
					remoteRef
				}))
			}
		})
	}
}
