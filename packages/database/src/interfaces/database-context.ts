export interface DatabaseContext {
	get isTransactionActive(): boolean
	startTransaction(): Promise<void>
	rollbackTransaction(): Promise<void>
	commitTransaction(): Promise<void>
}
