import { RandomStringGenerator } from '@package/core'

const randomString = new RandomStringGenerator()

export class QueryUtils {
	static generateParameterName = (size: number = 8) => randomString.generate(size)
}
