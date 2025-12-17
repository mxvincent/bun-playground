import {
	type ComparisonFilter,
	type Filter,
	isArrayComparisonFilter,
	isComparisonFilter,
	isLogicalFilter,
	isValueComparisonFilter,
	type LogicalFilter,
	LogicalOperator
} from '@package/query-params'
import { Brackets, type ObjectLiteral, type WhereExpressionBuilder } from 'typeorm'
import { generateComparisonString } from './comparison'
import { QueryUtils } from './generateParameterName'

/**
 * Apply comparison filter to a query
 */
export const applyComparisonFilter = (
	query: WhereExpressionBuilder,
	filter: ComparisonFilter,
	siblingRelation: LogicalOperator = LogicalOperator.AND
): WhereExpressionBuilder => {
	const parameterName = QueryUtils.generateParameterName()
	const comparisonString = generateComparisonString(filter, parameterName)

	let comparisonParameters: ObjectLiteral | undefined
	if (isArrayComparisonFilter(filter)) {
		comparisonParameters = { [parameterName]: filter.values }
	} else if (isValueComparisonFilter(filter)) {
		comparisonParameters = { [parameterName]: filter.value }
	}

	if (siblingRelation === LogicalOperator.AND) {
		query.andWhere(comparisonString, comparisonParameters)
	} else if (siblingRelation === LogicalOperator.OR) {
		query.orWhere(comparisonString, comparisonParameters)
	}

	return query
}

/**
 * Apply logical filter on query
 * Logical filter is applied in query brackets
 * @param query - base query
 * @param filter - logical filter
 * @param siblingRelation - logical relation with sibling filters
 */
export const applyLogicalFilter = (
	query: WhereExpressionBuilder,
	{ operator, filters }: LogicalFilter,
	siblingRelation: LogicalOperator = LogicalOperator.AND
): WhereExpressionBuilder => {
	const brackets = new Brackets((bracketsQuery) => {
		for (const nestedFilter of filters) {
			if (isComparisonFilter(nestedFilter)) {
				applyComparisonFilter(bracketsQuery, nestedFilter, operator)
			}
			if (isLogicalFilter(nestedFilter)) {
				applyLogicalFilter(bracketsQuery, nestedFilter, operator)
			}
		}
	})
	if (siblingRelation === LogicalOperator.AND) {
		query.andWhere(brackets)
	}
	if (siblingRelation === LogicalOperator.OR) {
		query.orWhere(brackets)
	}
	return query
}

/**
 * Apply many filters to a query
 */
export const applyFilters = (
	query: WhereExpressionBuilder,
	filters: Filter[],
	siblingRelation: LogicalOperator = LogicalOperator.AND
): WhereExpressionBuilder => {
	for (const filter of filters) {
		if (isComparisonFilter(filter)) {
			applyComparisonFilter(query, filter, siblingRelation)
		}
		if (isLogicalFilter(filter)) {
			applyLogicalFilter(query, filter, siblingRelation)
		}
	}
	return query
}
