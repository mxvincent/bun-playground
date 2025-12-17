export enum LogicalOperator {
	AND = 'and',
	OR = 'or'
}

export const LOGICAL_OPERATORS = [LogicalOperator.AND, LogicalOperator.OR] as const

export enum ComparisonOperator {
	EQUAL = 'equal',
	NOT_EQUAL = 'notEqual',
	LESS_THAN = 'lessThan',
	LESS_THAN_OR_EQUAL = 'lessThanOrEqual',
	GREATER_THAN = 'greaterThan',
	GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual',
	LIKE = 'like',
	NOT_LIKE = 'notLike',
	MATCH = 'match',
	INSENSITIVE_MATCH = 'insensitiveMatch',
	IN = 'in',
	NOT_IN = 'notIn',
	NULL = 'null',
	NOT_NULL = 'notNull'
}

export const ARRAY_COMPARISON_OPERATORS = [ComparisonOperator.IN, ComparisonOperator.NOT_IN] as const
export type ArrayComparisonOperator = (typeof ARRAY_COMPARISON_OPERATORS)[number]

export const NULL_COMPARISON_OPERATORS = [ComparisonOperator.NULL, ComparisonOperator.NOT_NULL] as const
export type NullComparisonOperator = (typeof NULL_COMPARISON_OPERATORS)[number]

export const VALUE_COMPARISON_OPERATORS = [
	ComparisonOperator.EQUAL,
	ComparisonOperator.NOT_EQUAL,
	ComparisonOperator.LESS_THAN,
	ComparisonOperator.LESS_THAN_OR_EQUAL,
	ComparisonOperator.GREATER_THAN,
	ComparisonOperator.GREATER_THAN_OR_EQUAL,
	ComparisonOperator.LIKE,
	ComparisonOperator.NOT_LIKE,
	ComparisonOperator.MATCH,
	ComparisonOperator.INSENSITIVE_MATCH
] as const
export type ValueComparisonOperator = (typeof VALUE_COMPARISON_OPERATORS)[number]

export const COMPARISON_OPERATORS = [
	...ARRAY_COMPARISON_OPERATORS,
	...NULL_COMPARISON_OPERATORS,
	...VALUE_COMPARISON_OPERATORS
] as const

export const FILTER_OPERATORS = [...LOGICAL_OPERATORS, ...COMPARISON_OPERATORS] as const
export type FilterOperator = (typeof FILTER_OPERATORS)[number]
