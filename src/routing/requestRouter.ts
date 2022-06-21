import { RequestHandler } from '../handlers'
import { methodMatch, pathMatch } from './requestMatch'
import { Env, HTTPMethod } from '../types'

/**
 * A RequestRouter will try to match incoming requests to one or more request handlers
 * @param request The request to match against
 * @param env The environment to use
 * @param ctx The context to use
 * @returns The response to return
 */
export type RequestRouter = (
  request: Request,
  env: Env,
  ctx: ExecutionContext,
) => Promise<Response>

/**
 * Create a new RequestRouter to match against some request handlers
 * @param handlers The handlers to use
 * @returns A RequestRouter that will try to match incoming requests to one or more request handlers
 */
export function makeRequestRouter(handlers: RequestHandler[]): RequestRouter {
  return async (request, env, ctx) => {
    const requestURL = new URL(request.url)
    const requestPath = requestURL.pathname

    for (const handler of handlers) {
      if (
        methodMatch(handler.method, request.method as HTTPMethod) &&
        pathMatch(handler.path, requestPath)
      ) {
        return handler.fetch(request, env, ctx, { requestURL, requestPath })
      }
    }

    return new Response('No handler found for that request', { status: 405 })
  }
}
