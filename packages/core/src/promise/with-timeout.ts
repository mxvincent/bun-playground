import { BaseError } from '@package/errors'

export class TimeoutError extends BaseError {
	override code = 'TIMEOUT_ERROR'

	constructor(timeoutMs: number, taskName?: string) {
		super(`${taskName ?? 'Task'} did not complete after ${timeoutMs} ms`)
	}
}

/**
 * Wrap async code around a timeout to prevent never ending operations
 *
 * Callback can return a value (i.e. not a promise). In that case this function
 * resolves its promise with the callback's return value and no timeout is scheduled.
 * There is no reason to use this function with sync callbacks; this behavior has been implemented
 * to prevent developer mistakes (e.g. when using this function in a JS environment).
 *
 * Note: as JS promises cannot be cancelled, when a timeout occurs, the callback's promise may still
 * hold handles open (e.g. timeouts, streams) and prevent graceful script exit.
 *
 * @param callback Code to wrap
 * @param timeoutInMs Timeout value, in milliseconds
 * @param taskName Optional task name used error thrown when timeout
 * @returns
 */
export function withTimeout<T>(callback: () => Promise<T> | T, timeoutInMs: number, taskName?: string): Promise<T> {
	return new Promise((resolve, reject) => {
		// Run callback
		const promiseOrValue = callback()

		// callback returned a value (i.e. sync callback), then return it right away (no timeout needed)
		if (!(promiseOrValue instanceof Promise)) {
			resolve(promiseOrValue)
			return
		}

		// callback returned a Promise, timeout setup needed
		const timeout = setTimeout(() => {
			reject(new TimeoutError(timeoutInMs, taskName))
		}, timeoutInMs)

		// Fulfill "wrapper promise" when callback's promise fulfills
		promiseOrValue.then(resolve, reject).finally(() => {
			clearTimeout(timeout)
		})
	})
}
