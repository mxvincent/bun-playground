import { http } from "msw";
import { setupServer } from "msw/node";
import type {
	ManagementApiQueue,
	ManagementApiQueueBinding,
} from "../src/management/types";
import { config } from "./config";

export const fakeBindings: Record<string, ManagementApiQueueBinding[]> = {
	["test-queue"]: [
		{
			source: "",
			vhost: config.connection.vhost,
			destination: "test-queue",
			destination_type: "queue",
			routing_key: "test-queue",
			arguments: {},
			properties_key: "test-queue",
		},
		{
			source: "loan",
			vhost: "aria",
			destination: "test-queue",
			destination_type: "queue",
			routing_key: "loan.created",
			arguments: {},
			properties_key: "loan.created",
		},
		{
			source: "loan",
			vhost: "aria",
			destination: "test-queue",
			destination_type: "queue",
			routing_key: "loan.updated",
			arguments: {},
			properties_key: "loan.updated",
		},
	],
};

export const fakeQueues: Record<string, ManagementApiQueue> = {
	["test-queue"]: {
		type: "quorum",
		name: "test-queue",
		arguments: {},
		durable: true,
		exclusive: false,
		head_message_timestamp: null,
		messages: 0,
		message_stats: {
			ack: 0,
			deliver: 0,
			deliver_get: 0,
			deliver_no_ack: 0,
			get: 0,
			get_empty: 0,
			get_no_ack: 0,
			redeliver: 0,
		},
	},
};

export const managementApiServer = setupServer(
	http.get(`https://rabbitmq.tld/api/queues/:vhost/:queue/bindings`, (info) => {
		if (info.params.vhost !== config.connection.vhost) {
			return new Response(null, { status: 404 });
		}
		return new Response(
			JSON.stringify(fakeBindings[info.params.queue as string]),
			{ status: 200 },
		);
	}),
	http.get(`https://rabbitmq.tld/api/queues/:vhost/:queue`, (info) => {
		if (info.params.vhost !== config.connection.vhost) {
			return new Response(null, { status: 404 });
		}
		return new Response(
			JSON.stringify(fakeQueues[info.params.queue as string]),
			{ status: 200 },
		);
	}),
);
