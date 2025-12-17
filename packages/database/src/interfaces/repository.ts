import type { KeyOf, ObjectLiteral } from '@package/core'
import type { ComparisonFilter, FindQueryParameters, Page, PageQueryParameters } from '@package/query-params'

export interface RepositoryGetPage<TEntity extends ObjectLiteral> {
	getPage(parameters: PageQueryParameters<KeyOf<TEntity>>): Promise<Page<TEntity>>
}

export interface RepositoryFindOne<TEntity extends ObjectLiteral> {
	findOne(filters: ComparisonFilter<KeyOf<TEntity>>[]): Promise<TEntity | null>
}

export interface RepositoryFindOneOrFail<TEntity extends ObjectLiteral> {
	findOneOrFail(filters: ComparisonFilter<KeyOf<TEntity>>[]): Promise<TEntity>
}

export interface RepositoryFindMany<TEntity extends ObjectLiteral> {
	findMany(options: FindQueryParameters<KeyOf<TEntity>>): Promise<TEntity[]>
}

export interface RepositoryCreate<TEntity extends ObjectLiteral, TCreate = Partial<TEntity>> {
	create(values: TCreate): Promise<TEntity>
}

export interface RepositoryUpdate<TEntity extends ObjectLiteral, TUpdate = Partial<TEntity>> {
	update(entity: TEntity, values: TUpdate): Promise<TEntity>
}

export interface RepositoryDelete<TEntity extends ObjectLiteral> {
	delete(entity: TEntity): Promise<TEntity>
}

export interface RepositoryRead<TEntity extends ObjectLiteral>
	extends RepositoryFindOne<TEntity>,
		RepositoryFindOneOrFail<TEntity>,
		RepositoryGetPage<TEntity> {}

/**
 * Shortcut for a CRUD repository
 */
export interface Repository<TEntity extends ObjectLiteral, TCreate = Partial<TEntity>, TUpdate = Partial<TEntity>>
	extends RepositoryRead<TEntity>,
		RepositoryCreate<TEntity, TCreate>,
		RepositoryUpdate<TEntity, TUpdate>,
		RepositoryDelete<TEntity> {}
