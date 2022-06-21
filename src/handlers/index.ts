import { Env, HTTPMethod } from '../types'
import { DELETEHandler } from './delete'
import { GETHandler } from './get'
import { HEADHandler } from './head'
import { PUTHandler } from './put'

/**
 * Some useful context elements to pass to the handlers
 */
export interface RequestContext {
  /** The URL object for this request */
  requestURL: URL
  /** The path of this request (https://example.com/example/path -> '/example/path') */
  requestPath: string
}

/**
 * Defines an HTTPHandler that can be matched agaisnt a method and path to handle a request
 */
export interface RequestHandler {
  /** The method (or methods) to match, if any */
  method?: HTTPMethod | HTTPMethod[]
  /** The path (or paths) to match, if any */
  path?: string | string[]
  /**
   * The function to call to handle the request
   * @param request The request to handle
   * @param env The environment to use
   * @param ctx The context to use
   * @returns The response to return
   */
  fetch: (
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    reqCtx: RequestContext,
  ) => Promise<Response>
}

/** The handlers that were defined. This shouldbe moved elsewhere if this was a library but ah well */
export const handlers = [GETHandler, HEADHandler, PUTHandler, DELETEHandler]
