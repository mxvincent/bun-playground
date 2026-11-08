import { expect, mock, test } from 'bun:test'
import { beforeProcessShutdown, runTeardownFunctions } from './hooks'

test('runs every registered teardown function, even when one rejects', async () => {
	const failing = mock(() => Promise.reject(new Error('teardown failed')))
	const succeeding = mock(() => Promise.resolve())
	beforeProcessShutdown(failing)
	beforeProcessShutdown(succeeding)

	await runTeardownFunctions()

	expect(failing).toHaveBeenCalledTimes(1)
	expect(succeeding).toHaveBeenCalledTimes(1)
})
