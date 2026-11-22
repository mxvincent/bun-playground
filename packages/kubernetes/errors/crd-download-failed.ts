import { BaseError } from '@package/errors'

/**
 * A CRD bundle cannot be downloaded
 */
export class KubernetesCrdDownloadFailedError extends BaseError {
	code = 'KUBERNETES_CRD_DOWNLOAD_FAILED'
	readonly url: string
	readonly responseStatus: number

	constructor(url: string, response: { status: number; statusText: string }) {
		super(`Failed to download ${url}: ${response.status} ${response.statusText}`)
		this.url = url
		this.responseStatus = response.status
	}

	override toJSON() {
		return { ...super.toJSON(), url: this.url, responseStatus: this.responseStatus }
	}
}
