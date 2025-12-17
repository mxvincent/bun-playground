import { Deployment, Ingress, IngressBackend, Secret } from 'cdk8s-plus-33'
import { WorkloadComponent, type WorkloadComponentOptions } from '#/components/workload-component'
import { CertManagerAnnotation } from '#/plugins/cert-manager'
import {
	IngressAnnotation,
	type IngressAnnotations,
	type IngressConfig,
	NginxIngressAnnotation
} from '#/plugins/ingress'

export interface WebServiceOptions extends WorkloadComponentOptions {
	readonly replicas?: number
	readonly ingress?: IngressConfig
}

export class WebService extends WorkloadComponent<WebServiceOptions> {
	static readonly HTTP_PORT = 4000

	name(suffix?: string) {
		return suffix ? `${this.context.name}-${suffix}` : this.context.name
	}

	generate() {
		const { context, options } = this

		// Configure deployment
		const deployment = new Deployment(context.chart, this.name('deployment'), {
			metadata: context.metadata,
			dockerRegistryAuth: options.imageRegistryAuth?.secret,
			replicas: options.replicas ?? 1,
			podMetadata: context.metadata,
			securityContext: this.securityContext
		})

		// Configure deployment container
		const container = deployment.addContainer({
			...this.containerProps,
			ports: [{ name: 'http', number: WebService.HTTP_PORT }]
		})

		// Inject configuration
		this.mountConfiguration(deployment, container)

		// Expose application with a service
		const service = deployment.exposeViaService({
			name: deployment.name
		})

		// Expose application with and ingress (optional)
		if (options.ingress) {
			const certSecret = Secret.fromSecretName(context.chart, this.name('ingress-cert'), `${context.name}-cert`)
			const annotation = (key: keyof IngressAnnotations, defaultValue: unknown): string => {
				return String(options.ingress?.annotations?.[key] ?? defaultValue)
			}
			const ingress = new Ingress(context.chart, this.name('ingress'), {
				tls: [
					{
						hosts: [options.ingress.host],
						secret: certSecret
					}
				],
				metadata: {
					...context.metadata,
					annotations: {
						[CertManagerAnnotation.CERT_ISSUER]: annotation('certIssuer', 'acme-http'),
						[IngressAnnotation.SSL_REDIRECT]: annotation('sslRedirect', true)
					}
				}
			})
			ingress.addHostRule(options.ingress.host, options.ingress.path ?? '/', IngressBackend.fromService(service))
			if (options.ingress.annotations?.proxyBodySize) {
				ingress.metadata.addAnnotation(
					NginxIngressAnnotation.PROXY_BODY_SIZE,
					options.ingress.annotations.proxyBodySize
				)
			}
		}
	}
}
