import { base64Decode } from '@package/core'
import {
	ArrayComparisonFilter,
	type ComparisonFilter,
	type Filter,
	isArrayComparisonOperator,
	isLogicalOperator,
	isNullComparisonOperator,
	isValueComparisonOperator,
	LogicalFilter,
	NullComparisonFilter,
	ValueComparisonFilter
} from '@package/query-params'
import { isString } from 'es-toolkit'
import { QueryStringParameterValidationError } from '../shared/errors'
import { decodeFilterOperator } from './transformers'

/**
 * Filters can be nested when we use logical filters
 * We need to get all filters from the top level as string
 * For the following input: 'eq(a,a),or(eq(b,b),eq(c,c))'
 * We have two filters on top level:
 *   - Filter.equal(a,a)
 *   - Or(Filter.equal(b,b),Filter.equal(c,c))
 */
export const parseLogicalFilterParameters = (input: string): string[] => {
	if (!isString(input)) {
		throw new TypeError(`input should be a string`)
	}
	const result: string[] = []
	let depth = 0
	let start = 0
	for (let index = 0; index < input.length; index += 1) {
		if (input[index] === '(') {
			depth += 1
		} else if (input[index] === ')') {
			depth -= 1
			if (depth === 0) {
				input.slice(start, index + 1)
				result.push(input.slice(start, index + 1))
				start = index + 2
			}
		}
	}
	return result
}

/**
 * Parse filter string
 */
const parseFilter = (filterString: string, decode = base64Decode): ComparisonFilter | LogicalFilter => {
	const matches = filterString.match(/^((?<operator>[a-z]+)\()?(?<parameters>.*)\)$/i)

	if (!matches?.groups) {
		throw new QueryStringParameterValidationError(`Malformed filter`, [filterString])
	}

	const operator = decodeFilterOperator(matches.groups.operator)
	if (!operator) {
		throw new QueryStringParameterValidationError(`Operator is not supported`, [filterString])
	}

	if (!matches.groups.parameters) {
		throw new QueryStringParameterValidationError(`Can not extract parameters`, [filterString])
	}

	if (isLogicalOperator(operator)) {
		const filters = parseLogicalFilterParameters(matches.groups.parameters).map((filter) => parseFilter(filter, decode))
		return new LogicalFilter(operator, filters)
	}

	const parameters = matches.groups.parameters.split(',')
	const path = parameters.shift()
	if (!path) {
		throw new QueryStringParameterValidationError(`Can not extract filter path`, [filterString])
	}

	if (isValueComparisonOperator(operator)) {
		const [value] = parameters
		if (value === undefined) {
			throw new QueryStringParameterValidationError(`Can not extract filter value`, [filterString])
		}
		return new ValueComparisonFilter(operator, path, decode(value))
	}

	if (isNullComparisonOperator(operator)) {
		return new NullComparisonFilter(operator, path)
	}

	if (isArrayComparisonOperator(operator)) {
		return new ArrayComparisonFilter(
			operator,
			path,
			parameters.map((value) => decode(value))
		)
	}

	throw new QueryStringParameterValidationError(`Filter is not valid`, [filterString])
}

/**
 * Extract filter params from a parsed query string
 */
export const parseFilters = (filters: string[] | string, decode = decodeURIComponent): Filter[] => {
	if (isString(filters)) {
		return [parseFilter(filters, decode)]
	}
	if (Array.isArray(filters)) {
		return filters.filter(isString).map((filter) => parseFilter(filter, decode))
	}
	return []
}
