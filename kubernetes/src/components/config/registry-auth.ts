import { Names } from 'cdk8s'
import { type ISecret, Secret } from 'cdk8s-plus-33'
import type { Context } from '#/helpers/context'
import {
	ExternalSecretV1Beta1,
	ExternalSecretV1Beta1SpecDataRemoteRefConversionStrategy,
	ExternalSecretV1Beta1SpecDataRemoteRefDecodingStrategy,
	ExternalSecretV1Beta1SpecSecretStoreRefKind,
	ExternalSecretV1Beta1SpecTargetCreationPolicy
} from '#/imports/external-secrets.io'
import { EXTERNAL_SECRET_REFRESH_INTERVAL } from '#/plugins/external-secret'

export class ImageRegistryAuth {
	context: Context
	secret: ISecret
	resourceId = 'docker-auth'
	externalSecretName = 'image-registry-auth'

	constructor(context: Context) {
		this.context = context
		this.secret = this.createDockerRegistryAuthSecret()
	}

	/**
	 * Create docker registry auth secret
	 */
	private createDockerRegistryAuthSecret(): ISecret {
		const { chart } = this.context
		const secretName = Names.toDnsLabel(chart, {
			extra: ['docker-auth'],
			includeHash: false
		})
		const secret = Secret.fromSecretName(chart, this.resourceId, secretName)
		new ExternalSecretV1Beta1(chart, `${this.resourceId}-secret`, {
			spec: {
				secretStoreRef: {
					kind: ExternalSecretV1Beta1SpecSecretStoreRefKind.CLUSTER_SECRET_STORE,
					name: 'scaleway'
				},
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
							key: `name:${this.externalSecretName}`,
							version: 'latest'
						}
					}
				]
			}
		})
		return secret
	}
}
