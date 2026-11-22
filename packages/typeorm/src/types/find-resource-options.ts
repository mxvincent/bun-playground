import type { FindOneOptions, FindOptionsWhere, ObjectLiteral } from 'typeorm'

export type RequiredProperties<T, K extends keyof T> = Omit<T, K> & {
	[P in K]-?: T[P]
}

export type FindResourceWhere<T extends ObjectLiteral> = FindOptionsWhere<T>
export type FindResourceOptions<T extends ObjectLiteral> = Omit<FindOneOptions<T>, 'where'>
