import { expect, test } from 'bun:test'
import { TimeoutError, withTimeout } from './with-timeout'

test('resolves with the value of the callback promise', async () => {
	await expect(withTimeout(async () => 'value', 10)).resolves.toBe('value')
})

test('resolves with the value of a sync callback', async () => {
	await expect(withTimeout(() => 'value', 10)).resolves.toBe('value')
})

test('rejects with the error of the callback', async () => {
	await expect(withTimeout(() => Promise.reject(new Error('failure')), 10)).rejects.toThrow(
		expect.objectContaining({ constructor: Error, message: 'failure' })
	)
})

test('rejects with a TimeoutError when the callback does not settle in time', async () => {
	const neverSettles = () => new Promise<never>(() => {})
	await expect(withTimeout(neverSettles, 1, 'task')).rejects.toThrow(
		expect.objectContaining({ constructor: TimeoutError, message: 'task did not complete after 1 ms' })
	)
})
