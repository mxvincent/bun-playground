import type { ImageRegistry } from '../components/config/registry-auth'
import { ExternalSecret } from '../plugins/external-secret'

/**
 * Default registry of the application images
 */
export const DEFAULT_IMAGE_REGISTRY: ImageRegistry = {
	url: 'ghcr.io/mxvincent',
	/** Scaleway entry holding a complete `dockerconfigjson` for ghcr.io */
	auth: new ExternalSecret('image-registry-auth')
}
