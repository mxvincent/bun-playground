import type { ChannelWrapper } from 'amqp-connection-manager'

export type TopicDestination = {
	type: 'topic'
	name: string
	routingKey: string
}
export type QueueDestination = {
	type: 'queue'
	name: string
}

export type MessageDestination = TopicDestination | QueueDestination

export type AmqpPublishOptions = {
	destination: MessageDestination
	channel?: ChannelWrapper
}
