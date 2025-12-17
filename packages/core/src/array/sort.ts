export type SortResult = -1 | 0 | 1

export function ascending<T>(a: T, b: T): SortResult {
	return a < b ? -1 : a > b ? 1 : 0
}

export function descending<T>(a: T, b: T): SortResult {
	return a > b ? -1 : a < b ? 1 : 0
}
