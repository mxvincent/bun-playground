export enum InterruptionSignal {
	SIGINT = 'SIGINT',
	SIGTERM = 'SIGTERM'
}

export const INTERRUPTION_SIGNALS = Object.values(InterruptionSignal)

export type TeardownFunction = () => Promise<void>

const teardownFunctions = new Set<TeardownFunction>()

let isListening = false

/**
 * Run the teardown functions then exit on an interruption signal
 * The listeners are only added with the first teardown function: a signal listener disables the default exit
 */
const listenToInterruptionSignals = () => {
	if (isListening) {
		return
	}
	isListening = true
	for (const signal of INTERRUPTION_SIGNALS) {
		process.on(signal, async () => {
			await runTeardownFunctions()
			process.exit(0)
		})
	}
}

/**
 * Register a function that will be called before the process is interrupted
 */
export const beforeProcessShutdown = (teardownFunction: TeardownFunction) => {
	teardownFunctions.add(teardownFunction)
	listenToInterruptionSignals()
}

/**
 * Call every registered teardown function and wait for all of them to settle
 */
export const runTeardownFunctions = async (): Promise<void> => {
	await Promise.allSettled([...teardownFunctions].map((teardownFunction) => teardownFunction()))
}
