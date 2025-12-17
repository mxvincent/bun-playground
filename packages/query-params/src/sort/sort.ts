export enum SortDirection {
	ASC = 'asc',
	DESC = 'desc'
}

export const SORT_DIRECTIONS: SortDirection[] = Object.values(SortDirection)

export class Sort<T extends string = string> {
	readonly direction: SortDirection
	readonly path: T

	constructor(direction: SortDirection, path: T) {
		this.path = path
		this.direction = direction
	}

	static asc<T extends string = string>(path: T): Sort<T> {
		return new Sort(SortDirection.ASC, path)
	}

	static desc<T extends string = string>(path: T): Sort<T> {
		return new Sort<T>(SortDirection.DESC, path)
	}

	toString(): string {
		return `${this.direction}:${this.path}`
	}
}
