import { Names } from 'cdk8s'
import { type ISecret, Secret } from 'cdk8s-plus-33'
import type { Context } from '#/helpers/context'
import {
	ExternalSecretV1Beta1,
	ExternalSecretV1Beta1SpecDataRemoteRefConversionStrategy,
	ExternalSecretV1Beta1SpecDataRemoteRefDecodingStrategy,
	ExternalSecretV1Beta1SpecTargetCreationPolicy
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
		const resourceId = 'docker-auth'
		const secretName = Names.toDnsLabel(chart, {
			extra: [resourceId],
			includeHash: false
		})
		this.secret = Secret.fromSecretName(chart, resourceId, secretName)
		new ExternalSecretV1Beta1(chart, `${resourceId}-secret`, {
			spec: {
				secretStoreRef: SCALEWAY_SECRET_STORE,
				refreshInterval: EXTERNAL_SECRET_REFRESH_INTERVAL,
				target: {
					name: secretName,
					creationPolicy: ExternalSecretV1Beta1SpecTargetCreationPolicy.OWNER,
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
							conversionStrategy: ExternalSecretV1Beta1SpecDataRemoteRefConversionStrategy.DEFAULT,
							decodingStrategy: ExternalSecretV1Beta1SpecDataRemoteRefDecodingStrategy.NONE,
							key: `name:${auth.name}`,
							version: 'latest'
						}
					}
				]
			}
		})
	}
}
