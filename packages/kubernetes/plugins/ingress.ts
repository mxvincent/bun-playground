export type IngressAnnotations = {
	sslRedirect: boolean
	proxyBodySize: string
	certIssuer: string
}

export type IngressConfig = {
	host: string
	path?: string
	annotations?: Partial<IngressAnnotations>
}

export enum NginxIngressAnnotation {
	PROXY_BODY_SIZE = 'nginx.ingress.kubernetes.io/proxy-body-size',
	SSL_REDIRECT = 'nginx.ingress.kubernetes.io/ssl-redirect'
}
