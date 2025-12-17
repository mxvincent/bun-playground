import { EnvValue, type ISecret, Secret } from 'cdk8s-plus-33'
import type { Context } from '#/helpers/context'
import {
	ExternalSecretV1Beta1,
	type ExternalSecretV1Beta1SpecDataRemoteRef,
	ExternalSecretV1Beta1SpecSecretStoreRefKind,
	ExternalSecretV1Beta1SpecTargetCreationPolicy
} from '#/imports/external-secrets.io'
import { EXTERNAL_SECRET_REFRESH_INTERVAL, type ExternalSecretRef } from '#/plugins/external-secret'
import { findOrCreate } from '#helpers/misc'

export type EnvironmentValue = string | ExternalSecretRef

const memo = new Map<Context, WorkloadEnvironment>()

export class WorkloadEnvironment {
	readonly context: Context
	readonly values: Record<string, EnvValue> = {}
	secret?: ISecret
	readonly #externalSecretValues: Record<string, ExternalSecretV1Beta1SpecDataRemoteRef> = {}

	private constructor(context: Context, data: Record<string, EnvironmentValue>) {
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

	static register(context: Context, environment: Record<string, EnvironmentValue>): WorkloadEnvironment {
		return findOrCreate(memo, context, () => new WorkloadEnvironment(context, environment))
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
	#registerExternalSecret(values: Record<string, ExternalSecretV1Beta1SpecDataRemoteRef>) {
		const secret = this.#initializedSecret
		new ExternalSecretV1Beta1(this.context.chart, `${this.name}-external-secrets`, {
			metadata: {
				labels: this.context.labels,
				name: this.name
			},
			spec: {
				refreshInterval: EXTERNAL_SECRET_REFRESH_INTERVAL,
				secretStoreRef: {
					kind: ExternalSecretV1Beta1SpecSecretStoreRefKind.CLUSTER_SECRET_STORE,
					name: 'scaleway'
				},
				target: {
					name: secret.name,
					creationPolicy: ExternalSecretV1Beta1SpecTargetCreationPolicy.OWNER
				},
				data: Object.entries(values).map(([secretKey, remoteRef]) => ({
					secretKey,
					remoteRef
				}))
			}
		})
	}
}
