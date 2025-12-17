import { EnvValue } from '@package/core'
import { Type } from '@package/json-schema'

export const schema = Type.Object({
	keepAliveTimeoutInMilliseconds: Type.Integer({
		description: 'TCP connection keepalive timout. This value should be greater than proxy keepalive timeout.',
		default: 5000,
		minimum: 1000,
		maximum: 3600000
	}),
	host: Type.String({
		description: 'Server listening hostname.',
		default: '127.0.0.1'
	}),
	port: Type.Integer({
		description: 'Server listening port.',
		default: 4000,
		minimum: 1024,
		maximum: 65535
	})
})

export const environment = {
	keepAliveTimeoutInMilliseconds: EnvValue.number('SERVER_KEEP_ALIVE_TIMEOUT'),
	host: EnvValue.string('SERVER_HOST'),
	port: EnvValue.number('SERVER_PORT')
}
