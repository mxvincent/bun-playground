import { bun, CONFIG_FILE_NAME, defineNamespace, ExternalSecret, packageVersion, WebService } from '@package/kubernetes'
import { Application } from '#/interfaces/application'
import { PostgresConfig } from '#/interfaces/config'

export const accountService = defineNamespace({
	name: 'account-service',
	application: Application.ACCOUNT,
	revision: () => packageVersion('applications/account'),
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
