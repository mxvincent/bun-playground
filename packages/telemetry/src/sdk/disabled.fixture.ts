/**
 * Process started by sdk.test.ts: it imports the package without starting the SDK, then waits to be interrupted.
 */
import { logger } from '../index'

// Keep the process alive until a signal stops it
setInterval(() => undefined, 1000)

logger.info('telemetry is disabled')
console.log('ready')
