import { join } from 'node:path'

export interface CommandOptions {
	rootDir?: string
}

/**
 * Bun images run applications from source and keep the monorepo layout under `/app` (see the root dockerfile), so
 * `main` is relative to the workspace root, e.g. `applications/account/src/commands/start-api-server.ts`.
 */
export const bun = (main: string, options: CommandOptions = {}) => {
	options.rootDir ??= '/app'
	return ['/usr/local/bin/bun', join(options.rootDir, main)]
}
