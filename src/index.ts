import { handlers } from './handlers/index.js'
import { makeRequestRouter } from './routing/requestRouter.js'

export type { Env } from './types.js'

export default { fetch: makeRequestRouter(handlers) }
