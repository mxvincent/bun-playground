import { invariant, reverseRecord } from '@package/core'
import { SortDirection } from '@package/query-params'

export const SORT_DIRECTION_ENCODING_MAP: Record<SortDirection, string> = {
	[SortDirection.ASC]: 'asc',
	[SortDirection.DESC]: 'desc'
} as const

export const encodeSortDirection = (decoded: SortDirection): string => {
	return SORT_DIRECTION_ENCODING_MAP[decoded]
}

export const SORT_DIRECTION_DECODING_MAP = reverseRecord(SORT_DIRECTION_ENCODING_MAP)

export const decodeSortDirection = (encoded: string): SortDirection => {
	return invariant(SORT_DIRECTION_DECODING_MAP[encoded])
}
