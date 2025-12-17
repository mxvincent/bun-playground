import { pino } from "pino";
import type { AmqpConfig } from "../src";

export const config: AmqpConfig = {
	connection: {
		host: "rabbitmq.tld",
		port: 5672,
		vhost: "mxvincent",
		username: "mxvincent",
		password: "mxvincent",
		timeoutInSeconds: 60,
	},
	managementApi: {
		url: "https://rabbitmq.tld",
	},
	logger: pino({ level: "info" }),
	features: {
		messageProcessingRetry: false,
	},
};
