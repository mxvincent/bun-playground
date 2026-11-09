import { expect, it } from 'bun:test'
import {
	ARRAY_COMPARISON_OPERATORS,
	ComparisonOperator,
	NULL_COMPARISON_OPERATORS,
	VALUE_COMPARISON_OPERATORS
} from './operators'

it('the array, null and value families hold every comparison operator exactly once', () => {
	const families = [...ARRAY_COMPARISON_OPERATORS, ...NULL_COMPARISON_OPERATORS, ...VALUE_COMPARISON_OPERATORS]
	expect(families.toSorted()).toStrictEqual(Object.values(ComparisonOperator).toSorted())
})
