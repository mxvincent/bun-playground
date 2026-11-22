import { CONFIG_FILE_NAME } from '#/components/shared'
import { WebService } from '#/components/workload/web-service'
import { bun } from '#/helpers/command'
import { PostgresConfig } from '#/helpers/config'
import { defineNamespace } from '#/helpers/namespace'
import { IMAGE_REGISTRY } from '#/helpers/registry'
import { Application } from '#/interfaces/application'
import { ExternalSecret } from '#/plugins/external-secret'

export const accountService = defineNamespace({
	name: 'account-service',
	application: Application.ACCOUNT,
	imageRegistry: IMAGE_REGISTRY,
	config: (context) => {
		const secrets = new ExternalSecret(`${context.environment}-${context.application}`)
		return {
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
		}
	},
	environment: {
		AUTH_CLIENT_ID: 'account-service'
	},
	components: [
		new WebService({
			name: 'app-server',
			command: bun('applications/account/src/commands/start-api-server.ts'),
			config: {
				[CONFIG_FILE_NAME]: {
					server: {
						host: '0.0.0.0',
						port: WebService.HTTP_PORT
					}
				}
			}
		})
	]
})
