export const isInArray = <T>(array: T[]): ((item: T) => boolean) => {
	return (item) => array.includes(item)
}
