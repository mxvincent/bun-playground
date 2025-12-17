import { type ComparisonFilter, ComparisonOperator } from '@package/query-params'

type ComparisonStringFactoryOptions = { path: string; parameterName: string }
const factories = new Map<ComparisonOperator, (options: ComparisonStringFactoryOptions) => string>()

/**
 * Register default comparison string factories
 */
factories.set(ComparisonOperator.EQUAL, ({ path, parameterName }) => {
	return `${path} = :${parameterName}`
})
factories.set(ComparisonOperator.NOT_EQUAL, ({ path, parameterName }) => {
	return `${path} <> :${parameterName}`
})
factories.set(ComparisonOperator.GREATER_THAN, ({ path, parameterName }) => {
	return `${path} > :${parameterName}`
})
factories.set(ComparisonOperator.GREATER_THAN_OR_EQUAL, ({ path, parameterName }) => {
	return `${path} >= :${parameterName}`
})
factories.set(ComparisonOperator.LESS_THAN, ({ path, parameterName }) => {
	return `${path} < :${parameterName}`
})
factories.set(ComparisonOperator.LESS_THAN_OR_EQUAL, ({ path, parameterName }) => {
	return `${path} <= :${parameterName}`
})
factories.set(ComparisonOperator.LIKE, ({ path, parameterName }) => {
	return `CAST(${path} as TEXT) LIKE :${parameterName}`
})
factories.set(ComparisonOperator.NOT_LIKE, ({ path, parameterName }) => {
	return `CAST(${path} as TEXT) NOT LIKE :${parameterName}`
})
factories.set(ComparisonOperator.MATCH, ({ path, parameterName }) => {
	return `CAST(${path} as TEXT) ~ :${parameterName}`
})
factories.set(ComparisonOperator.INSENSITIVE_MATCH, ({ path, parameterName }) => {
	return `CAST(${path} as TEXT) ~* :${parameterName}`
})
factories.set(ComparisonOperator.IN, ({ path, parameterName }) => {
	return `${path} IN (:...${parameterName})`
})
factories.set(ComparisonOperator.NOT_IN, ({ path, parameterName }) => {
	return `${path} NOT IN (:...${parameterName})`
})
factories.set(ComparisonOperator.NULL, ({ path }) => {
	return `${path} IS NULL`
})
factories.set(ComparisonOperator.NOT_NULL, ({ path }) => {
	return `${path} IS NOT NULL`
})

/**
 * Register comparison string builder for an operator
 * @param operator - comparison operator
 * @param comparator - function used to generate a comparison factory
 * @example
 * registerComparisonStringFactory('neq', (parameterName) => `!= :${parameterName}`)
 */
export const registerComparisonStringFactory = (
	operator: ComparisonOperator,
	comparator: (options: ComparisonStringFactoryOptions) => string
): void => {
	factories.set(operator, comparator)
}

/**
 * Use registered factory to generate comparison string
 */
export const generateComparisonString = (filter: ComparisonFilter, parameterName: string): string => {
	const generateWhereString = factories.get(filter.operator)
	if (typeof generateWhereString === 'function') {
		return generateWhereString({ path: filter.path, parameterName })
	}
	throw new Error(`Operator not supported ${filter.operator}`)
}
