export type IngressAnnotations = {
	sslRedirect: boolean
	proxyBodySize: string
	certIssuer: string
}

export type IngressConfig = {
	host: string
	path?: string
	annotations?: IngressAnnotations
}

export enum IngressAnnotation {
	SSL_REDIRECT = 'ingress.kubernetes.io/ssl-redirect'
}

export enum NginxIngressAnnotation {
	PROXY_BODY_SIZE = 'nginx.ingress.kubernetes.io/proxy-body-size'
}
