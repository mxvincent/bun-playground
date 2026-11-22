// Stakater reloader annotations
export enum ReloaderAnnotation {
	RELOAD_ON_CONFIGMAP_CHANGE = 'configmap.reloader.stakater.com/reload',
	RELOAD_ON_SECRET_CHANGE = 'secret.reloader.stakater.com/reload'
}
