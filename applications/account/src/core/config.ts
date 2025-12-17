import process from 'node:process'
import { type DeriveJsonType, getPackageRootPath, readJsonFileSync, removeUndefined } from '@package/core'
import { JsonSchemaValidationError, type Static, type TSchema, Type, validate } from '@package/json-schema'
import { logger, serializers } from '@package/telemetry'
import { toMerged } from 'es-toolkit'
import * as app from '#/config/app'
import * as database from '#/config/database'
import * as server from '#/config/server'

const { CONFIG_FILE_PATH } = process.env
const getConfigFilePath = (): string => {
	if (CONFIG_FILE_PATH) {
		return CONFIG_FILE_PATH
	}
	const packageRootPath = getPackageRootPath(__dirname)
	const environment = process.env.NODE_ENV
	if (!environment || environment === 'test') {
		return `${packageRootPath}/config.test.json`
	}
	return `${packageRootPath}/config.json`
}

const loadConfig = <T extends TSchema>(schema: T, configFromEnvironment: DeriveJsonType<Static<T>>): Static<T> => {
	try {
		const path = getConfigFilePath()
		let configFromFile = {}
		try {
			configFromFile = readJsonFileSync(getConfigFilePath())
			logger.info({ path }, 'Config file loaded.')
		} catch (error) {
			if (CONFIG_FILE_PATH) {
				logger.warn({ error, path }, 'Failed to load config file.')
			}
		}
		return validate(schema, toMerged(configFromFile, removeUndefined(configFromEnvironment ?? {})), {
			coerce: true
		})
	} catch (error) {
		if (error instanceof JsonSchemaValidationError) {
			logger.fatal(
				{
					validation: error.errors,
					error: serializers.error(error)
				},
				error.message
			)
		}
		throw error
	}
}

export const config = loadConfig(
	Type.Object({
		app: app.schema,
		database: database.schema,
		server: server.schema
	}),
	{
		app: app.environment,
		database: database.environment,
		server: server.environment
	}
)
