import { HTTPMethod } from '../types'

/**
 * Try and see if the incoming request method matches against the handler's defined filters
 * @param method The method (or methods) to check for matches with, if any
 * @param requestMethod The method to match against
 * @returns If the request method matched any methods, these matches must be exact (method === requestMethod)
 */
export function methodMatch(
  method: HTTPMethod | HTTPMethod[] | undefined,
  requestMethod: HTTPMethod,
): boolean {
  if (!method) {
    return true
  }

  if (typeof method === 'string') {
    return method === requestMethod
  }

  return method.includes(requestMethod)
}

/**
 * Try and see if the incoming request path matches against the handler's defined paths
 *
 * TODO: add param/* matching
 *
 * @param path The path (or paths) to check for matches with, if any
 * @param requestPath The path to match against
 * @returns If the request path matched any paths, these paths must be exact (path === requestPath)
 */
export function pathMatch(
  path: string | string[] | undefined,
  requestPath: string,
): boolean {
  if (!path) {
    return true
  }

  if (typeof path === 'string') {
    return path === requestPath
  }

  return path.includes(requestPath)
}
