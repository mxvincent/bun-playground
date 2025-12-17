import {
	type ExternalSecretV1Beta1SpecDataRemoteRef,
	ExternalSecretV1Beta1SpecDataRemoteRefConversionStrategy,
	ExternalSecretV1Beta1SpecDataRemoteRefDecodingStrategy,
	ExternalSecretV1Beta1SpecDataRemoteRefMetadataPolicy,
	type ExternalSecretV1Beta1SpecSecretStoreRef,
	ExternalSecretV1Beta1SpecSecretStoreRefKind
} from '#/imports/external-secrets.io'

export const EXTERNAL_SECRET_REFRESH_INTERVAL = '1h'
export const EXTERNAL_SECRET_STORE: ExternalSecretV1Beta1SpecSecretStoreRef = {
	kind: ExternalSecretV1Beta1SpecSecretStoreRefKind.CLUSTER_SECRET_STORE,
	name: 'gcp'
}

/**
 * Helpers used to transform secret values
 */
export type SecretValueTransformHelper = 'toString'

export class ExternalSecretRef {
	readonly externalSecretName: string
	readonly remoteRef: ExternalSecretV1Beta1SpecDataRemoteRef

	constructor(secretName: string, options: { property: string; version?: string }) {
		this.externalSecretName = secretName
		this.remoteRef = {
			key: `name:${secretName}`,
			property: options.property,
			conversionStrategy: ExternalSecretV1Beta1SpecDataRemoteRefConversionStrategy.DEFAULT,
			decodingStrategy: ExternalSecretV1Beta1SpecDataRemoteRefDecodingStrategy.NONE,
			version: 'latest',
			metadataPolicy: ExternalSecretV1Beta1SpecDataRemoteRefMetadataPolicy.NONE
		}
	}

	/**
	 * Generate an id used to link the template placeholder to the generated secret value
	 */
	get key(): string {
		if (this.remoteRef.property) {
			return this.formatId(`${this.externalSecretName}_${this.remoteRef.property}`)
		}
		return this.formatId(this.externalSecretName)
	}

	/**
	 * Generate a placeholder to replace external secret reference in the template
	 */
	placeholder(transform: SecretValueTransformHelper = 'toString') {
		return `{{ .${this.key} | ${transform} }}`
	}

	private formatId(value: string): string {
		return value.replace(/-/g, '_').toUpperCase()
	}
}

/**
 * Create an external secret property reference
 */
export class ExternalSecret {
	readonly name: string

	constructor(name: string) {
		this.name = name
	}

	ref(property: string): ExternalSecretRef {
		return new ExternalSecretRef(this.name, { property })
	}
}
