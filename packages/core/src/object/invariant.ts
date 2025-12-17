export function invariant<T>(value: T | undefined | null, message: string = 'Value can not be undefined.'): T {
	if (!value) {
		throw new TypeError(message)
	}
	return value
}
