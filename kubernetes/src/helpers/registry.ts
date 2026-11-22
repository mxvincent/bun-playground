import type { ImageRegistry } from '#/components/config/registry-auth'
import { ExternalSecret } from '#/plugins/external-secret'

/**
 * Registry of the application images built by this repository
 */
export const IMAGE_REGISTRY: ImageRegistry = {
	url: 'ghcr.io/mxvincent',
	/** Scaleway entry holding a complete `dockerconfigjson` for ghcr.io */
	auth: new ExternalSecret('image-registry-auth')
}
