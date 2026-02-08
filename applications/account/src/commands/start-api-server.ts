import { logger, syncLogger } from '@package/telemetry'
import { initializeAppServer } from '#/core/api-server'
import { config } from '#/core/config'

const startAppServer = async () => {
	logger.info(`[app] initialization started`)
	const app = await initializeAppServer()
	await app.listen({
		host: config.server.host,
		port: config.server.port,
		listenTextResolver: (address) => `[app] server listening on ${address}`
	})
}

startAppServer().catch((error) => {
	syncLogger.fatal(error)
	process.exit(1)
})
