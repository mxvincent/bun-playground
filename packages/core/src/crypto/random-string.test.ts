import { expect, test } from 'bun:test'
import { Alphabet } from '../string/alphabets'
import { RandomStringGenerator } from './random-string'

test('should use alphanumeric as default alphabet', () => {
	const generator = new RandomStringGenerator()

	const result = generator.generate(256)

	expect(result).toMatch(new RegExp(`^[${Alphabet.ALPHANUMERIC}]{256}$`))
})

test('should generate custom alphabet', () => {
	const generator = new RandomStringGenerator(Alphabet.CROCKFORD)

	const result = generator.generate(256)

	expect(result).toMatch(new RegExp(`^[${Alphabet.CROCKFORD}]{256}$`))
})
