import * as pinoSerializer from 'pino-std-serializers'

export const serializers = {
	error: (error: unknown) => {
		if (error instanceof Error) {
			return pinoSerializer.err(error)
		}
		return error
	},
	request: pinoSerializer.req,
	response: pinoSerializer.res
}
