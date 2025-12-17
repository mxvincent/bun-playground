import { createHash } from 'crypto'

const hash = (algorithm: string, value: string): string => {
	return createHash(algorithm).update(value).digest('hex')
}

export const md5 = (value: string): string => hash('md5', value)

export const sha1 = (value: string): string => hash('sha1', value)
