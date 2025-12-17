import { describe, expect, it } from 'bun:test'
import { ComparisonFilter, LogicalFilter } from '@package/query-params'
import { filterArrayWith } from './filter'

interface TestItem {
	id: string
	createdAt: Date
	name: string
	age: number
	city: string | null
}

const resources: TestItem[] = [
	{
		id: '1',
		createdAt: new Date('2000-01-01T00:00:01'),
		name: 'Alice',
		age: 25,
		city: 'Paris'
	},
	{
		id: '2',
		createdAt: new Date('2000-01-01T00:00:02'),
		name: 'Bob',
		age: 30,
		city: 'London'
	},
	{
		id: '3',
		createdAt: new Date('2000-01-01T00:00:03'),
		name: 'Charlie',
		age: 35,
		city: 'Paris'
	},
	{
		id: '4',
		createdAt: new Date('2000-01-01T00:00:04'),
		name: 'David',
		age: 25,
		city: 'Berlin'
	},
	{
		id: '5',
		createdAt: new Date('2000-01-01T00:00:05'),
		name: 'Eve',
		age: 40,
		city: null
	}
]

describe('comparison filters', () => {
	it('equal filter', () => {
		const filters = [ComparisonFilter.equal('age', '25')]
		const result = filterArrayWith(resources, filters)

		expect(result).toHaveLength(2)
		expect(result).toEqual([
			{
				id: '1',
				createdAt: new Date('2000-01-01T00:00:01'),
				name: 'Alice',
				age: 25,
				city: 'Paris'
			},
			{
				id: '4',
				createdAt: new Date('2000-01-01T00:00:04'),
				name: 'David',
				age: 25,
				city: 'Berlin'
			}
		])
	})

	it('not equal filter', () => {
		const filters = [ComparisonFilter.notEqual('age', '25')]
		const result = filterArrayWith(resources, filters)

		expect(result).toHaveLength(3)
		expect(result.map((r) => r.name)).toEqual(['Bob', 'Charlie', 'Eve'])
	})

	it('greater than filter', () => {
		const filters = [ComparisonFilter.greaterThan('age', '30')]
		const result = filterArrayWith(resources, filters)

		expect(result).toHaveLength(2)
		expect(result.map((r) => r.name)).toEqual(['Charlie', 'Eve'])
	})

	it('less than or equal filter', () => {
		const filters = [ComparisonFilter.lessThanOrEqual('age', '30')]
		const result = filterArrayWith(resources, filters)

		expect(result).toHaveLength(3)
		expect(result.map((r) => r.name)).toEqual(['Alice', 'Bob', 'David'])
	})

	it('like filter', () => {
		const filters = [ComparisonFilter.like('name', 'a')]
		const result = filterArrayWith(resources, filters)

		expect(result).toHaveLength(2)
		expect(result.map((r) => r.name)).toEqual(['Charlie', 'David'])
	})

	it('match filter (regex)', () => {
		const filters = [ComparisonFilter.match('name', '^[A-C]')]
		const result = filterArrayWith(resources, filters)

		expect(result).toHaveLength(3)
		expect(result.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Charlie'])
	})

	it('insensitive match filter (regex)', () => {
		const filters = [ComparisonFilter.insensitiveMatch('name', '^alice$')]
		const result = filterArrayWith(resources, filters)

		expect(result).toHaveLength(1)
		expect(result[0]).toHaveProperty('name', 'Alice')
	})

	it('in filter', () => {
		const filters = [ComparisonFilter.in('city', ['Paris', 'Berlin'])]
		const result = filterArrayWith(resources, filters)

		expect(result).toHaveLength(3)
		expect(result.map((r) => r.name)).toEqual(['Alice', 'Charlie', 'David'])
	})

	it('not in filter', () => {
		const filters = [ComparisonFilter.notIn('city', ['Paris', 'Berlin'])]
		const result = filterArrayWith(resources, filters)

		expect(result).toHaveLength(2)
		expect(result.map((r) => r.name)).toEqual(['Bob', 'Eve'])
	})

	it('null filter', () => {
		const filters = [ComparisonFilter.null('city')]
		const result = filterArrayWith(resources, filters)

		expect(result).toHaveLength(1)

		expect(result[0]).toHaveProperty('name', 'Eve')
	})

	it('not null filter', () => {
		const filters = [ComparisonFilter.notNull('city')]
		const result = filterArrayWith(resources, filters)

		expect(result).toHaveLength(4)
		expect(result.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Charlie', 'David'])
	})
})

describe('logical filters', () => {
	it('multiple filters with AND', () => {
		const filters = [ComparisonFilter.equal('city', 'Paris'), ComparisonFilter.greaterThan('age', '25')]
		const result = filterArrayWith(resources, filters)

		expect(result).toHaveLength(1)
		expect(result[0]).toHaveProperty('name', 'Charlie')
	})

	it('logical OR filter', () => {
		const filters = [
			LogicalFilter.or([ComparisonFilter.equal('city', 'Paris'), ComparisonFilter.equal('city', 'Berlin')])
		]
		const result = filterArrayWith(resources, filters)

		expect(result).toHaveLength(3)
		expect(result.map((r) => r.name)).toEqual(['Alice', 'Charlie', 'David'])
	})

	it('logical AND filter', () => {
		const filters = [
			LogicalFilter.and([ComparisonFilter.equal('city', 'Paris'), ComparisonFilter.greaterThan('age', '25')])
		]
		const result = filterArrayWith(resources, filters)

		expect(result).toHaveLength(1)
		expect(result[0]).toHaveProperty('name', 'Charlie')
	})

	it('nested logical filters with unique values', () => {
		const result = filterArrayWith(
			[
				{
					id: '1',
					createdAt: '2020-01-01T00:00:01.000Z'
				},
				{
					id: '2',
					createdAt: '2020-01-01T00:00:02.000Z'
				},
				{
					id: '3',
					createdAt: '2020-01-01T00:00:03.000Z'
				}
			],
			[
				LogicalFilter.or([
					ComparisonFilter.greaterThan('createdAt', '2020-01-01T00:00:01.000Z'),
					LogicalFilter.and([
						ComparisonFilter.equal('createdAt', '2020-01-01T00:00:01.000Z'),
						ComparisonFilter.greaterThan('id', '1')
					])
				])
			]
		)

		expect(result).toEqual([
			{
				id: '2',
				createdAt: '2020-01-01T00:00:02.000Z'
			},
			{
				id: '3',
				createdAt: '2020-01-01T00:00:03.000Z'
			}
		])
	})

	it('nested logical filters with non unique values', () => {
		const result = filterArrayWith(
			[
				{
					id: '1',
					createdAt: '2020-01-01T00:00:00.000Z'
				},
				{
					id: '2',
					createdAt: '2020-01-01T00:00:00.000Z'
				},
				{
					id: '3',
					createdAt: '2020-01-01T00:00:00.000Z'
				}
			],
			[
				LogicalFilter.or([
					ComparisonFilter.greaterThan('createdAt', '2020-01-01T00:00:00:000Z'),
					LogicalFilter.and([
						ComparisonFilter.equal('createdAt', '2020-01-01T00:00:00.000Z'),
						ComparisonFilter.greaterThan('id', '2')
					])
				])
			]
		)

		expect(result).toEqual([
			{
				id: '3',
				createdAt: '2020-01-01T00:00:00.000Z'
			}
		])
	})
})

it('empty filters returns all items', () => {
	const result = filterArrayWith(resources, [])

	expect(result).toHaveLength(5)
	expect(result).toEqual(resources)
})
