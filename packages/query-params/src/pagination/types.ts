export interface PageEdge<T> {
	cursor: string
	node: T
}

export interface Page<T> {
	edges: PageEdge<T>[]
	hasNextPage: boolean
	totalCount: number | null
}
