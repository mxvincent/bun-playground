import { randomBytes } from 'crypto'
import { Alphabet } from '../string/alphabets'

/**
 * High-performance random string generator using crypto.randomBytes
 * with bias mitigation through rejection sampling
 */
export class RandomStringGenerator {
	private readonly alphabet: string
	private readonly alphabetLength: number
	private readonly mask: number
	private readonly step: number

	constructor(alphabet: string = Alphabet.ALPHANUMERIC) {
		if (alphabet.length === 0) {
			throw new Error('Alphabet cannot be empty')
		}
		if (alphabet.length > 256) {
			throw new Error('Alphabet length cannot exceed 256')
		}

		this.alphabet = alphabet
		this.alphabetLength = alphabet.length

		// Calculate mask for efficient bit operations
		// Find the smallest power of 2 >= alphabet length
		this.mask = (2 << (31 - Math.clz32(alphabet.length - 1))) - 1

		// Calculate step size for buffer efficiency
		// This determines how many bytes we need per character on average
		this.step = Math.ceil((1.6 * this.mask * alphabet.length) / this.alphabetLength)
	}

	/**
	 * Generate a random string of specified length
	 * Uses rejection sampling to ensure uniform distribution
	 */
	generate(length: number): string {
		if (length <= 0) {
			throw new Error('Length must be positive')
		}

		const result: string[] = new Array(length)
		let resultIndex = 0

		// Generate random bytes in batches for better performance
		const bytes = randomBytes(this.step)
		let byteIndex = 0

		while (resultIndex < length) {
			// Need more random bytes
			if (byteIndex >= bytes.length) {
				randomBytes(this.step).copy(bytes, 0)
				byteIndex = 0
			}

			const randomValue = bytes[byteIndex++]! & this.mask

			// Rejection sampling: only use value if it's within the alphabet range, this ensures uniform distribution
			if (randomValue < this.alphabetLength) {
				result[resultIndex++] = this.alphabet[randomValue]!
			}
		}

		return result.join('')
	}
}

export const randomStringGenerator = new RandomStringGenerator()
