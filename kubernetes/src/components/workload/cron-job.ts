import type { Cron } from 'cdk8s'
import { CronJob as CDKCronJob, ConcurrencyPolicy, RestartPolicy } from 'cdk8s-plus-33'
import {
	WorkloadComponent,
	type WorkloadComponentOptions,
	type WorkloadSettings
} from '#/components/workload-component'
import type { ComponentContext } from '#/helpers/context'

export interface CronJobOptions extends WorkloadComponentOptions {
	readonly schedule: Cron
}

export class CronJob extends WorkloadComponent<CronJobOptions> {
	generate(context: ComponentContext, settings: WorkloadSettings) {
		const { options } = this

		// Configure job
		const job = new CDKCronJob(context.chart, context.name, {
			metadata: context.metadata,
			dockerRegistryAuth: settings.imagePullSecret,
			schedule: options.schedule,
			concurrencyPolicy: ConcurrencyPolicy.FORBID,
			restartPolicy: RestartPolicy.ON_FAILURE,
			successfulJobsRetained: 3,
			podMetadata: context.metadata,
			securityContext: this.securityContext
		})

		// Configure job container
		const container = job.addContainer(this.containerProps(context, settings))

		// Inject configuration
		this.mountConfiguration(job, container, settings)
	}
}
