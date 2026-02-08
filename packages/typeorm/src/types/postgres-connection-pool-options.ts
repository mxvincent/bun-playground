export class PostgresConnectionPoolOptions {
	/**
	 * Number of milliseconds to wait before timing out when connecting a new client
	 * Set to 0 to disable timeout
	 * @default 0 (no timeout)
	 */
	connectionTimeoutMillis: number = 0

	/**
	 * Number of milliseconds a client must sit idle in the pool and not be checked out before it is disconnected from the backend and discarded
	 * Set to 0 to disable auto-disconnection of idle clients
	 * 	@default 10000 (10 seconds)
	 */
	idleTimeoutMillis?: number = 10_000

	/**
	 * Maximum number of clients the pool should contain
	 * @default 10
	 */
	max: number = 10

	/**
	 * Default behavior is the pool will keep clients open & connected to the backend
	 * until idleTimeoutMillis expire for each client and node will maintain a ref
	 * to the socket on the client, keeping the event loop alive until all clients are closed
	 * after being idle or the pool is manually shutdown with `pool.end()`.
	 * Setting `allowExitOnIdle: true` in the config will allow the node event loop to exit
	 * as soon as all clients in the pool are idle, even if their socket is still open
	 * to the postgres server.  This can be handy in scripts & tests
	 * where you don't want to wait for your clients to go idle before your process exits.
	 * @default false
	 */
	releaseConnections: boolean = true

	constructor(options: Partial<PostgresConnectionPoolOptions>) {
		Object.assign<PostgresConnectionPoolOptions, Partial<PostgresConnectionPoolOptions>>(this, options)
	}
}
