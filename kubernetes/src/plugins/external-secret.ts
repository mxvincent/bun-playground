import {
	type ExternalSecretSpecDataRemoteRef,
	ExternalSecretSpecDataRemoteRefConversionStrategy,
	ExternalSecretSpecDataRemoteRefDecodingStrategy,
	ExternalSecretSpecDataRemoteRefMetadataPolicy,
	type ExternalSecretSpecSecretStoreRef,
	ExternalSecretSpecSecretStoreRefKind
} from '#/imports/external-secrets.io'

export const EXTERNAL_SECRET_REFRESH_INTERVAL = '1h'
export const SCALEWAY_SECRET_STORE: ExternalSecretSpecSecretStoreRef = {
	kind: ExternalSecretSpecSecretStoreRefKind.CLUSTER_SECRET_STORE,
	name: 'scaleway'
}

/**
 * Helpers used to transform secret values
 */
export type SecretValueTransformHelper = 'toString'

export class ExternalSecretRef {
	readonly externalSecretName: string
	readonly remoteRef: ExternalSecretSpecDataRemoteRef

	constructor(secretName: string, options: { property: string; version?: string }) {
		this.externalSecretName = secretName
		this.remoteRef = {
			key: `name:${secretName}`,
			property: options.property,
			conversionStrategy: ExternalSecretSpecDataRemoteRefConversionStrategy.DEFAULT,
			decodingStrategy: ExternalSecretSpecDataRemoteRefDecodingStrategy.NONE,
			version: options.version ?? 'latest',
			metadataPolicy: ExternalSecretSpecDataRemoteRefMetadataPolicy.NONE
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

	ref(property: string, options: { version?: string } = {}): ExternalSecretRef {
		return new ExternalSecretRef(this.name, { property, version: options.version })
	}
}
