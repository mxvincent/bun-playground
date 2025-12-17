export type TopicBinding = {
	exchange: string
	routingKey: string
}

export type TopicConfig = {
	type: 'topic'
	name: string
}

export type ExchangeConfig = TopicConfig
