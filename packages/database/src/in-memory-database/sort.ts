import type { KeyOf, ObjectLiteral } from '@package/core'
import { type Sort, SortDirection } from '@package/query-params'
import { orderBy } from 'es-toolkit'

export function sortArrayWith<T extends ObjectLiteral>(array: T[], sorts: Sort<KeyOf<T>>[]) {
	const paths: KeyOf<T>[] = []
	const orders: ('asc' | 'desc')[] = []
	for (const { direction, path } of sorts) {
		paths.push(path)
		orders.push(direction === SortDirection.ASC ? 'asc' : 'desc')
	}
	return orderBy(array, paths, orders)
}
