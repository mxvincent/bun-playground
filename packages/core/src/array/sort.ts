export type SortResult = -1 | 0 | 1

export const ascending = <T>(a: T, b: T): SortResult => {
	return a < b ? -1 : a > b ? 1 : 0
}

export const descending = <T>(a: T, b: T): SortResult => {
	return a > b ? -1 : a < b ? 1 : 0
}
