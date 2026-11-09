import { describe, expect, test } from 'bun:test'
import {
	BadRequestError,
	ConflictError,
	ForbiddenError,
	InternalServerError,
	MethodNotAllowedError,
	NotFoundError,
	NotImplementedError,
	ResourceNotFoundError,
	UnauthorizedError,
	UnprocessableEntityError,
	UnsupportedMediaTypeError,
	ValidationError
} from './index'

describe('BaseError', () => {
	test('toJSON() returns the status code, the message and the code', () => {
		expect(new NotFoundError('missing').toJSON()).toStrictEqual({
			statusCode: 404,
			message: 'missing',
			code: 'NOT_FOUND'
		})
	})

	test('name is the name of the concrete class', () => {
		expect(new NotFoundError('missing').name).toBe('NotFoundError')
	})

	test('toString() prefixes the message with the code', () => {
		expect(new NotFoundError('missing').toString()).toBe('[NOT_FOUND] missing')
	})
})

test('ValidationError.toJSON() adds the reasons', () => {
	expect(new ValidationError('invalid', ['reason']).toJSON()).toStrictEqual({
		statusCode: 400,
		message: 'invalid',
		code: 'VALIDATION_ERROR',
		reasons: ['reason']
	})
})

describe('ResourceNotFoundError', () => {
	test('toJSON() adds the resource type and id', () => {
		expect(new ResourceNotFoundError('organization', 'id-1').toJSON()).toStrictEqual({
			statusCode: 404,
			message: 'Resource not found',
			code: 'RESOURCE_NOT_FOUND',
			resource: { type: 'organization', id: 'id-1' }
		})
	})

	test('toString() appends a string id', () => {
		expect(new ResourceNotFoundError('organization', 'id-1').toString()).toBe(
			'[RESOURCE_NOT_FOUND] Resource not found: id-1'
		)
	})

	test('toString() appends the entries of an object id', () => {
		expect(new ResourceNotFoundError('member', { organizationId: 'o', userId: 'u' }).toString()).toBe(
			'[RESOURCE_NOT_FOUND] Resource not found: organizationId=o,userId=u'
		)
	})

	test('toString() serializes the nested values of an object id as JSON', () => {
		expect(new ResourceNotFoundError('member', { key: { organizationId: 'o' } }).toString()).toBe(
			'[RESOURCE_NOT_FOUND] Resource not found: key={"organizationId":"o"}'
		)
	})

	test('toJSON() adds only the resource type when there is neither an id nor filters', () => {
		expect(new ResourceNotFoundError('organization').toJSON()).toStrictEqual({
			statusCode: 404,
			message: 'Resource not found',
			code: 'RESOURCE_NOT_FOUND',
			resource: { type: 'organization' }
		})
	})

	test('toString() appends nothing when there is neither an id nor filters', () => {
		expect(new ResourceNotFoundError('organization').toString()).toBe('[RESOURCE_NOT_FOUND] Resource not found')
	})

	const filters = [{ toJSON: () => ({ type: 'comparison', operator: 'equal', path: 'name', value: 'aria' }) }]

	test('toJSON() adds the resource type and the filters of a lookup by filters', () => {
		expect(ResourceNotFoundError.fromFilters('organization', filters).toJSON()).toStrictEqual({
			statusCode: 404,
			message: 'Resource not found',
			code: 'RESOURCE_NOT_FOUND',
			resource: {
				type: 'organization',
				filters: [{ type: 'comparison', operator: 'equal', path: 'name', value: 'aria' }]
			}
		})
	})

	test('toString() appends the filters of a lookup by filters as JSON', () => {
		expect(ResourceNotFoundError.fromFilters('organization', filters).toString()).toBe(
			'[RESOURCE_NOT_FOUND] Resource not found: filters=[{"type":"comparison","operator":"equal","path":"name","value":"aria"}]'
		)
	})
})

test.each([
	[new BadRequestError('', []), 400, 'BAD_REQUEST'],
	[new UnauthorizedError(), 401, 'UNAUTHORIZED'],
	[new ForbiddenError(), 403, 'FORBIDDEN'],
	[new NotFoundError(), 404, 'NOT_FOUND'],
	[new MethodNotAllowedError(), 405, 'METHOD_NOT_ALLOWED'],
	[new ConflictError(), 409, 'CONFLICT'],
	[new UnsupportedMediaTypeError(), 415, 'UNSUPPORTED_MEDIA_TYPE'],
	[new UnprocessableEntityError(), 422, 'UNPROCESSABLE_ENTITY'],
	[new InternalServerError(), 500, 'INTERNAL_SERVER_ERROR'],
	[new NotImplementedError(), 501, 'NOT_IMPLEMENTED']
])('%p has status code %p and code %p', (error, statusCode, code) => {
	expect({ statusCode: error.statusCode, code: error.code }).toStrictEqual({ statusCode, code })
})
