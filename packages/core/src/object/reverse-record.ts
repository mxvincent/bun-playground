export const reverseRecord = <T extends Record<string, string>>(record: T): { [K in keyof T as T[K]]: K } => {
	return Object.entries(record).reduce((o, [k, v]) => Object.assign(o, { [v]: k }), {} as { [K in keyof T as T[K]]: K })
}
