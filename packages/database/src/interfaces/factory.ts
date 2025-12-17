import type { ObjectLiteral } from '@package/core'

export type Factory<TResult extends ObjectLiteral, TValues = Partial<TResult>> = (values?: TValues) => TResult
