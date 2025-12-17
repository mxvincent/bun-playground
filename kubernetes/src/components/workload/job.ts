import type { Duration } from 'cdk8s'
import { Job as CDKJob, RestartPolicy } from 'cdk8s-plus-33'
import { WorkloadComponent, type WorkloadComponentOptions } from '#/components/workload-component'
import { ArgoCDAnnotation, ArgocdHook, ArgocdHookDeletePolicy } from '#/plugins/argocd'

export interface JobOptions extends WorkloadComponentOptions {
	hook?: ArgocdHook
	deletePolicy?: ArgocdHookDeletePolicy
	activeDeadline?: Duration
}

export class Job extends WorkloadComponent<JobOptions> {
	generate() {
		const { context, options } = this

		// Configure job
		const job = new CDKJob(context.chart, context.name, {
			metadata: context.metadata,
			dockerRegistryAuth: options.imageRegistryAuth?.secret,
			restartPolicy: RestartPolicy.ON_FAILURE,
			activeDeadline: options.activeDeadline,
			podMetadata: context.metadata,
			securityContext: this.securityContext
		})
		job.metadata.addAnnotation(ArgoCDAnnotation.SYNC_OPTIONS, 'Replace=true')
		job.metadata.addAnnotation(ArgoCDAnnotation.HOOK, options.hook ?? ArgocdHook.SYNC)
		job.metadata.addAnnotation(
			ArgoCDAnnotation.HOOK_DELETE_POLICY,
			options.deletePolicy ?? ArgocdHookDeletePolicy.BEFORE_CREATION
		)

		// Configure job container
		const container = job.addContainer(this.containerProps)

		// Inject configuration
		this.mountConfiguration(job, container)
	}
}
