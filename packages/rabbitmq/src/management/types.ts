export type ManagementApiQueue = {
	name: string
	type: string
	arguments: Record<string, unknown>
	durable: boolean
	exclusive: boolean
	head_message_timestamp: number | null
	messages: number
	message_stats: {
		ack: number
		deliver: number
		deliver_get: number
		deliver_no_ack: number
		get: number
		get_empty: number
		get_no_ack: number
		redeliver: number
	}
}

export type ManagementApiQueueBinding = {
	source: string
	vhost: string
	destination: string
	destination_type: string
	routing_key: string
	arguments: Record<string, string>
	properties_key: string
}
