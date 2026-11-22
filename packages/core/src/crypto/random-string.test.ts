import { expect, test } from 'bun:test'
import { InvalidRandomStringParameterError } from '../errors/invalid-random-string-parameter'
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

test.each<{ alphabet?: string; length: number; parameter: string; message: string; description: string }>([
	{
		alphabet: '',
		length: 8,
		parameter: 'alphabet',
		message: 'Alphabet cannot be empty',
		description: 'an empty alphabet'
	},
	{
		alphabet: 'a'.repeat(257),
		length: 8,
		parameter: 'alphabet',
		message: 'Alphabet length cannot exceed 256',
		description: 'an alphabet over 256 characters'
	},
	{ length: 0, parameter: 'length', message: 'Length must be positive', description: 'a length that is not positive' }
])('rejects $description', ({ alphabet, length, parameter, message }) => {
	expect(() => new RandomStringGenerator(alphabet).generate(length)).toThrow(
		expect.objectContaining({ constructor: InvalidRandomStringParameterError, parameter, message })
	)
})
