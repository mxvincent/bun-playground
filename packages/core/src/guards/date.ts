export const isDate = (value: unknown): value is Date => {
	return typeof value === 'object' && value instanceof Date
}
