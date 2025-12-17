import { invariant } from '@package/core'
import { randomUUID } from 'crypto'
import { getManagementApiAuthorizationHeader, getManagementApiConfigUrl } from '../config'
import { RabbitMQManagementAPIError } from '../errors/rabbitmq-management-api-error'
import type { AmqpConfig } from '../schemas/config'
import type { TopicBinding } from '../types/topic'
import type { ManagementApiQueue, ManagementApiQueueBinding } from './types'

export class RabbitMQManagementAPI {
	readonly config: AmqpConfig
	constructor(config: AmqpConfig) {
		this.config = config
	}

	private get apiBaseUrl() {
		return getManagementApiConfigUrl(this.config)
	}

	private get encodedVhost() {
		return encodeURIComponent(this.config.connection.vhost)
	}

	async listQueues(): Promise<ManagementApiQueue[]> {
		const response = await fetch(`${this.apiBaseUrl}/api/queues/${encodeURIComponent(this.config.connection.vhost)}`, {
			headers: new Headers({
				Authorization: getManagementApiAuthorizationHeader(this.config)
			})
		})
		if (response.status !== 200) {
			throw new RabbitMQManagementAPIError('[RabbitMQ] List queues query failed.', {
				statusCode: response.status,
				statusText: response.statusText
			})
		}
		return (await response.json()) as Array<ManagementApiQueue>
	}

	async getQueue(name: string): Promise<ManagementApiQueue | null> {
		const url = `${this.apiBaseUrl}/api/queues/${this.encodedVhost}/${name}`
		const response = await fetch(url, {
			headers: new Headers({
				Authorization: getManagementApiAuthorizationHeader(this.config)
			})
		})
		switch (response.status) {
			case 404:
				return null
			case 200:
				return (await response.json()) as ManagementApiQueue
			default:
				throw new Error(`Unexpected response status ${response.status} for ${url}.`)
		}
	}

	async listQueueBindings(queue: string): Promise<TopicBinding[]> {
		const response = await fetch(`${this.apiBaseUrl}/api/queues/${this.encodedVhost}/${queue}/bindings`, {
			headers: new Headers({
				Authorization: getManagementApiAuthorizationHeader(this.config)
			})
		})
		if (response.status !== 200) {
			throw new RabbitMQManagementAPIError('[RabbitMQ] List queue bindings query failed.', {
				statusCode: response.status,
				statusText: response.statusText
			})
		}
		const apiResponse = (await response.json()) as Array<ManagementApiQueueBinding>
		return apiResponse
			.filter((item) => item.source.length && item.destination_type === 'queue')
			.map((item) => ({
				exchange: item.source,
				routingKey: item.routing_key
			}))
	}

	async getQueueOrFail(name: string): Promise<ManagementApiQueue> {
		const queue = await this.getQueue(name)
		return invariant(queue, `Queue ${name} not found.`)
	}

	async listShovels(): Promise<Record<string, unknown>[]> {
		const response = await fetch(`${this.apiBaseUrl}/api/parameters/shovel/${this.encodedVhost}`, {
			headers: new Headers({
				Authorization: getManagementApiAuthorizationHeader(this.config),
				'Content-Type': 'application/json'
			})
		})
		if (response.status !== 200) {
			throw new RabbitMQManagementAPIError('[RabbitMQ] List shovels query failed.', {
				statusCode: response.status,
				statusText: response.statusText
			})
		}
		return (await response.json()) as Record<string, unknown>[]
	}

	async putShovel(options: { sourceQueue: string; destinationQueue: string; prefetchCount?: number }) {
		const { vhost } = this.config.connection
		const id = randomUUID()
		const uri = `amqp:///${encodeURIComponent(vhost)}`
		const value = {
			'src-uri': uri,
			'src-queue': options.sourceQueue,
			'src-protocol': 'amqp091',
			'src-prefetch-count': options.prefetchCount ?? 1000,
			'src-delete-after': 'queue-length',
			'dest-protocol': 'amqp091',
			'dest-uri': uri,
			'dest-add-forward-headers': false,
			'ack-mode': 'on-confirm',
			'dest-queue': options.destinationQueue,
			'src-consumer-args': {}
		}
		await fetch(`${this.apiBaseUrl}/api/parameters/shovel/${encodeURIComponent(vhost)}/${id}`, {
			method: 'PUT',
			body: JSON.stringify({ value }),
			headers: new Headers({
				Authorization: getManagementApiAuthorizationHeader(this.config),
				'Content-Type': 'application/json'
			})
		})
		return { id, value }
	}

	async deleteShovel(id: string) {
		const { vhost } = this.config.connection
		await fetch(`${this.apiBaseUrl}/api/parameters/shovel/${encodeURIComponent(vhost)}/${id}`, {
			method: 'DELETE',
			headers: new Headers({
				Authorization: getManagementApiAuthorizationHeader(this.config),
				'Content-Type': 'application/json'
			})
		})
	}
}
