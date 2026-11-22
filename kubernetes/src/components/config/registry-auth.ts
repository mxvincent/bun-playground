import { type ISecret, Secret } from 'cdk8s-plus-33'
import type { Context } from '#/helpers/context'
import {
	ExternalSecret as ExternalSecretResource,
	ExternalSecretSpecDataRemoteRefConversionStrategy,
	ExternalSecretSpecDataRemoteRefDecodingStrategy,
	ExternalSecretSpecTargetCreationPolicy
} from '#/imports/external-secrets.io'
import { EXTERNAL_SECRET_REFRESH_INTERVAL, type ExternalSecret, SCALEWAY_SECRET_STORE } from '#/plugins/external-secret'

/**
 * Registry the images of a namespace are pulled from
 */
export interface ImageRegistry {
	/** Registry and owner of the images, e.g. `ghcr.io/mxvincent` */
	readonly url: string
	/** Secret holding a complete `dockerconfigjson` for the registry; images are pulled anonymously when omitted */
	readonly auth?: ExternalSecret
}

/**
 * Pull secret of an image registry
 *
 * The remote secret must already hold a complete `dockerconfigjson`: it is copied as is into a
 * `kubernetes.io/dockerconfigjson` secret.
 */
export class ImageRegistryAuth {
	readonly secret: ISecret

	constructor(context: Context, auth: ExternalSecret) {
		const { chart } = context
		// The Kubernetes namespace already scopes the secret to its application and environment
		const secretName = 'docker-auth'
		this.secret = Secret.fromSecretName(chart, secretName, secretName)
		new ExternalSecretResource(chart, `${secretName}-secret`, {
			metadata: { name: secretName },
			spec: {
				secretStoreRef: SCALEWAY_SECRET_STORE,
				refreshInterval: EXTERNAL_SECRET_REFRESH_INTERVAL,
				target: {
					name: secretName,
					creationPolicy: ExternalSecretSpecTargetCreationPolicy.OWNER,
					template: {
						type: 'kubernetes.io/dockerconfigjson',
						data: {
							'.dockerconfigjson': '{{ .secret | toString }}'
						}
					}
				},
				data: [
					{
						secretKey: 'secret',
						remoteRef: {
							conversionStrategy: ExternalSecretSpecDataRemoteRefConversionStrategy.DEFAULT,
							decodingStrategy: ExternalSecretSpecDataRemoteRefDecodingStrategy.NONE,
							key: `name:${auth.name}`,
							version: 'latest'
						}
					}
				]
			}
		})
	}
}
