export const asArray = <T = unknown>(value: T | T[]): T[] => {
	return Array.isArray(value) ? value : [value]
}
