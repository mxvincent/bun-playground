import { ValidationError } from '@package/errors'

export class QueryStringParameterValidationError extends ValidationError<string> {
	override code = 'QUERY_STRING_PARAMETER_VALIDATION_ERROR'
}
