import type { KeyOf, ObjectLiteral } from '@package/core'
import { type Sort, SortDirection } from '@package/query-params'

/**
 * Sort an array matching PostgreSQL NULL ordering:
 * ASC  → NULLS LAST  (null treated as largest)
 * DESC → NULLS FIRST (null treated as largest)
 */
export function sortArrayWith<T extends ObjectLiteral>(array: T[], sorts: Sort<KeyOf<T>>[]) {
	return [...array].sort((a, b) => {
		for (const { direction, path } of sorts) {
			const aVal = a[path]
			const bVal = b[path]
			const aNull = aVal == null
			const bNull = bVal == null

			if (aNull && bNull) continue
			// null is always "largest": goes last in ASC, first in DESC
			if (aNull) return direction === SortDirection.ASC ? 1 : -1
			if (bNull) return direction === SortDirection.ASC ? -1 : 1

			if (aVal < bVal) return direction === SortDirection.ASC ? -1 : 1
			if (aVal > bVal) return direction === SortDirection.ASC ? 1 : -1
		}
		return 0
	})
}
