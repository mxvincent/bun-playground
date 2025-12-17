export class Sequence {
	value: number

	constructor(initialValue: number = -1) {
		this.value = initialValue
	}

	next() {
		this.value += 1
		return this.value
	}
}
