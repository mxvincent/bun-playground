import { WorkloadConfig } from '#/components/config/workload-config'
import { WorkloadEnvironment } from '#/components/config/workload-environment'
import { CONFIG_FILE_NAME } from '#/components/shared'
import { WebService } from '#/components/workload/web-service'
import type { WorkloadComponent } from '#/components/workload-component'
import { ApplicationChart } from '#/helpers/chart'
import { node } from '#/helpers/command'
import { ApplicationContext, type ComponentContext, type Context, type Provider } from '#/helpers/context'
import { ExternalSecret } from '#/plugins/external-secret'
import { PostgresConfig } from '#helpers/config'
import { Application } from '#interfaces/application'
import type { Environment } from '#interfaces/environment'

const environment: Provider<WorkloadEnvironment> = (context: Context) => {
	return WorkloadEnvironment.register(context, {
		AUTH_CLIENT_ID: 'account-service'
	})
}

const config: Provider<WorkloadConfig> = (context: Context) => {
	const secrets = new ExternalSecret(`${context.environment}-${context.application}`)
	return WorkloadConfig.register(context, {
		[CONFIG_FILE_NAME]: {
			app: {
				logLevel: 'info',
				timeZone: 'UTC'
			},
			database: {
				type: 'postgres',
				host: secrets.ref(PostgresConfig.HOST),
				port: secrets.ref(PostgresConfig.PORT),
				database: secrets.ref(PostgresConfig.DATABASE),
				username: secrets.ref(PostgresConfig.USERNAME),
				password: secrets.ref(PostgresConfig.PASSWORD)
			}
		}
	})
}

export class AccountService extends ApplicationChart {
	constructor(environment: Environment) {
		super(new ApplicationContext(environment, Application.ACCOUNT))
	}

	components(context: ApplicationContext): WorkloadComponent[] {
		return [
			new WebService(context.component('app-server'), {
				command: node('app-server.js')
			})
		]
	}

	config(context: ComponentContext): WorkloadConfig {
		return config(context)
	}

	environment(context: ComponentContext) {
		return environment(context)
	}
}
