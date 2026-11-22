import { Deployment, Ingress, IngressBackend, Secret } from 'cdk8s-plus-33'
import {
	WorkloadComponent,
	type WorkloadComponentOptions,
	type WorkloadSettings
} from '#/components/workload-component'
import type { ComponentContext } from '#/helpers/context'
import { CertManagerAnnotation } from '#/plugins/cert-manager'
import { type IngressAnnotations, type IngressConfig, NginxIngressAnnotation } from '#/plugins/ingress'

export interface WebServiceOptions extends WorkloadComponentOptions {
	readonly replicas?: number
	readonly ingress?: IngressConfig
}

export class WebService extends WorkloadComponent<WebServiceOptions> {
	static readonly HTTP_PORT = 4000

	generate(context: ComponentContext, settings: WorkloadSettings) {
		const { options } = this
		const name = (suffix: string) => `${context.name}-${suffix}`

		// Configure deployment
		const deployment = new Deployment(context.chart, name('deployment'), {
			metadata: context.metadata,
			dockerRegistryAuth: settings.imagePullSecret,
			replicas: options.replicas ?? 1,
			podMetadata: context.metadata,
			securityContext: this.securityContext
		})

		// Configure deployment container
		const container = deployment.addContainer({
			...this.containerProps(context, settings),
			ports: [{ name: 'http', number: WebService.HTTP_PORT }]
		})

		// Inject configuration
		this.mountConfiguration(deployment, container, settings)

		// Expose application with a service
		const service = deployment.exposeViaService({
			name: deployment.name
		})

		// Expose application with and ingress (optional)
		if (options.ingress) {
			const certSecret = Secret.fromSecretName(context.chart, name('ingress-cert'), `${context.name}-cert`)
			const annotation = (key: keyof IngressAnnotations, defaultValue: unknown): string => {
				return String(options.ingress?.annotations?.[key] ?? defaultValue)
			}
			const ingress = new Ingress(context.chart, name('ingress'), {
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
						[NginxIngressAnnotation.SSL_REDIRECT]: annotation('sslRedirect', true)
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
