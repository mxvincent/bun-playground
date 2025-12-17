import type { JsonObject } from '@package/core'
import { arrayComparisonFilter, logicalFilter, nullComparisonFilter, valueComparisonFilter } from './factories'
import {
	type ArrayComparisonOperator,
	ComparisonOperator,
	LogicalOperator,
	type NullComparisonOperator,
	type ValueComparisonOperator
} from './operators'

export enum FilterType {
	COMPARISON = 'comparison',
	LOGICAL = 'logical'
}

export abstract class ComparisonFilter<T extends string = string> {
	static equal = valueComparisonFilter(ComparisonOperator.EQUAL)
	static notEqual = valueComparisonFilter(ComparisonOperator.NOT_EQUAL)
	static lessThan = valueComparisonFilter(ComparisonOperator.LESS_THAN)
	static lessThanOrEqual = valueComparisonFilter(ComparisonOperator.LESS_THAN_OR_EQUAL)
	static greaterThan = valueComparisonFilter(ComparisonOperator.GREATER_THAN)
	static greaterThanOrEqual = valueComparisonFilter(ComparisonOperator.GREATER_THAN_OR_EQUAL)
	static like = valueComparisonFilter(ComparisonOperator.LIKE)
	static notLike = valueComparisonFilter(ComparisonOperator.NOT_LIKE)
	static match = valueComparisonFilter(ComparisonOperator.MATCH)
	static insensitiveMatch = valueComparisonFilter(ComparisonOperator.INSENSITIVE_MATCH)

	static in = arrayComparisonFilter(ComparisonOperator.IN)
	static notIn = arrayComparisonFilter(ComparisonOperator.NOT_IN)

	static null = nullComparisonFilter(ComparisonOperator.NULL)
	static notNull = nullComparisonFilter(ComparisonOperator.NOT_NULL)

	readonly type = FilterType.COMPARISON
	readonly operator: ComparisonOperator
	readonly path: T

	protected constructor(operator: ComparisonFilter['operator'], path: T) {
		this.operator = operator
		this.path = path
	}

	toJSON() {
		return { type: this.type, operator: this.operator, path: this.path }
	}
}

export class LogicalFilter<T extends string = string> {
	static and = logicalFilter(LogicalOperator.AND)
	static or = logicalFilter(LogicalOperator.OR)

	readonly type = FilterType.LOGICAL
	readonly operator: LogicalOperator
	readonly filters: Filter<T>[]

	constructor(operator: LogicalOperator, filters: Filter<T>[]) {
		this.operator = operator
		this.filters = filters
	}

	toJSON(): JsonObject {
		return {
			type: this.type,
			operator: this.operator,
			filters: this.filters.map((filter) => filter.toJSON())
		}
	}
}

export class ArrayComparisonFilter<T extends string = string> extends ComparisonFilter<T> {
	declare readonly operator: ArrayComparisonOperator
	declare readonly values: string[]

	constructor(operator: ArrayComparisonOperator, path: T, values: string[]) {
		super(operator, path)
		this.values = values
	}

	override toJSON() {
		return { ...super.toJSON(), values: this.values }
	}
}

export class NullComparisonFilter<T extends string = string> extends ComparisonFilter<T> {
	declare readonly operator: NullComparisonOperator

	constructor(operator: NullComparisonOperator, path: T) {
		super(operator, path)
	}
}

export class ValueComparisonFilter<T extends string = string> extends ComparisonFilter<T> {
	declare readonly operator: ValueComparisonOperator
	declare readonly value: string

	constructor(operator: ValueComparisonOperator, path: T, value: string) {
		super(operator, path)
		this.value = value
	}

	override toJSON() {
		return { ...super.toJSON(), value: this.value }
	}
}

export type Filter<T extends string = string> = ComparisonFilter<T> | LogicalFilter<T>
