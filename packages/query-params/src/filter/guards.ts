import { isString } from 'es-toolkit'
import {
	ArrayComparisonFilter,
	ComparisonFilter,
	type Filter,
	LogicalFilter,
	NullComparisonFilter,
	ValueComparisonFilter
} from './filters'
import {
	ARRAY_COMPARISON_OPERATORS,
	type ArrayComparisonOperator,
	LOGICAL_OPERATORS,
	type LogicalOperator,
	NULL_COMPARISON_OPERATORS,
	type NullComparisonOperator,
	VALUE_COMPARISON_OPERATORS,
	type ValueComparisonOperator
} from './operators'

/**
 * Check if the value is ArrayComparisonOperator
 */
export const isArrayComparisonOperator = (value: unknown): value is ArrayComparisonOperator => {
	return isString(value) && ARRAY_COMPARISON_OPERATORS.includes(value as never)
}

/**
 * Check if the value is NullComparisonOperator
 */
export const isNullComparisonOperator = (value: unknown): value is NullComparisonOperator => {
	return isString(value) && NULL_COMPARISON_OPERATORS.includes(value as never)
}

/**
 * Check if the value is ValueComparisonOperator
 */
export const isValueComparisonOperator = (value: unknown): value is ValueComparisonOperator => {
	return isString(value) && VALUE_COMPARISON_OPERATORS.includes(value as never)
}

/**
 * Check if the value is a LogicalOperator
 */
export const isLogicalOperator = (value: unknown): value is LogicalOperator => {
	return isString(value) && LOGICAL_OPERATORS.includes(value as never)
}

/**
 * Check if the value is a ComparisonFilter
 */
export const isComparisonFilter = (value: unknown): value is ComparisonFilter => {
	return value instanceof ComparisonFilter
}

/**
 * Check if the value is a LogicalFilter
 */
export const isLogicalFilter = (value: unknown): value is LogicalFilter => {
	return value instanceof LogicalFilter
}

/**
 * Check if the value is an `ArrayComparisonFilter`
 */
export const isArrayComparisonFilter = (value: unknown): value is ArrayComparisonFilter => {
	return value instanceof ArrayComparisonFilter
}

/**
 * Check if the value is a `NullComparisonFilter`
 */
export const isNullComparisonFilter = (value: unknown): value is NullComparisonFilter => {
	return value instanceof NullComparisonFilter
}

/**
 * Check if the value is a `ValueComparisonFilter`
 */
export const isValueComparisonFilter = (value: unknown): value is ValueComparisonFilter => {
	return value instanceof ValueComparisonFilter
}

/**
 * Check if the value is a Filter
 */
export const isFilter = (value: unknown): value is Filter => {
	return isComparisonFilter(value) || isLogicalFilter(value)
}
