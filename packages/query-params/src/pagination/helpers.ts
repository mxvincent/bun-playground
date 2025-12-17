import type { ObjectLiteral } from '@package/core'
import type { Page } from './types'

export function createEmptyPage<T extends ObjectLiteral>(): Page<T> {
	return {
		edges: [],
		hasNextPage: false,
		totalCount: 0
	}
}
