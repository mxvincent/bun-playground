export enum InterruptionSignal {
	SIGINT = 'SIGINT',
	SIGTERM = 'SIGTERM'
}

export const INTERRUPTION_SIGNALS = Object.values(InterruptionSignal)

export type TeardownFunction = () => Promise<void>

const teardownFunctions = new Set<TeardownFunction>()

/**
 * Register a function that will be called before the process is interrupted
 */
export const beforeProcessShutdown = (teardownFunction: TeardownFunction) => {
	teardownFunctions.add(teardownFunction)
}

for (const signal of INTERRUPTION_SIGNALS) {
	process.on(signal, async () => {
		if (teardownFunctions.size) {
			await Promise.allSettled(teardownFunctions)
			process.exit(0)
		}
	})
}
