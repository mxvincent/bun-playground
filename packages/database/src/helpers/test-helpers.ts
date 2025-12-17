import { randomUUID } from 'node:crypto'
import type { ObjectLiteral } from '@package/core'
import type { PageEdge, PaginationCursorTransformer } from '@package/query-params'
import { range } from 'es-toolkit'

export const slice = <T extends ObjectLiteral>(
	collection: T[],
	options: {
		take: number
		skip?: number
		cursorTransformer: PaginationCursorTransformer<T>
	}
): PageEdge<T>[] => {
	if (!collection.length) {
		throw new Error('collection can not be empty')
	}
	if (options.take < 1) {
		throw new Error('take parameter should be >= 1')
	}
	options.skip ??= 0
	const data = collection.slice(options.skip, options.skip + options.take)
	return data.map((node) => ({
		node,
		cursor: options.cursorTransformer.encode(node)
	}))
}

export interface Author {
	id: string
	createdAt: Date
	name: string
	age: number
	gender: 'female' | 'male' | 'unknown'
}

const startingDate = new Date('2020-01-01T00:00:00Z')
const addSeconds = (date: Date, n: number): Date => new Date(date.getTime() + n * 1000)

export const createAuthors = (n: number, dateStep = 1, useSequentialIds = true): Author[] => {
	return range(0, n <= 10 ** 12 ? n : 10 ** 12).map((i) => {
		const id = useSequentialIds ? `00000000-0000-0000-0000-${String(i).padStart(12, '0')}` : randomUUID()
		return {
			id,
			name: `author-${id.slice(-12)}`,
			createdAt: addSeconds(startingDate, Math.trunc(i / dateStep)),
			age: i % 100,
			gender: ['female', 'male', 'unknown'][n % 3] as Author['gender']
		}
	})
}

export interface DateContainer {
	id: string
	a: Date
	b: Date | null
}

export const createDateContainers = (n: number, dateStep = 1): DateContainer[] => {
	return range(0, n <= 10 ** 6 ? n : 10 ** 6).map((i) => {
		return {
			id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
			a: addSeconds(startingDate, Math.floor(i / dateStep)),
			b: i % 2 === 0 ? null : addSeconds(startingDate, Math.floor(i / dateStep))
		}
	})
}
