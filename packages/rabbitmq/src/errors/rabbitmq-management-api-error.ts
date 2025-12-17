export class RabbitMQManagementAPIError extends Error {
	statusCode: number
	statusText: string
	constructor(message: string, error: { statusCode: number; statusText: string }) {
		super(message)
		this.statusCode = error.statusCode
		this.statusText = error.statusText
	}
}
