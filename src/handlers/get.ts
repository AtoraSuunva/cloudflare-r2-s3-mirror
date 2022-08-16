import { RequestHandler } from '.'
import { Env } from '../types'
import { bodyOrNull, parseRange } from '../utils/parseData'
import {
  respondWithNotFound,
  respondWithObjectAndBody,
  respondWithRedirect,
} from '../utils/respond'
import { fetchAndCacheFromS3 } from '../utils/s3'

export const GETHandler: RequestHandler = {
  method: 'GET',
  async fetch(request, env, _ctx, { requestPath }) {
    const shortlink = await handleShortlinkRequest(env, requestPath)

    if (shortlink) {
      return shortlink
    }

    return handleObjectRequest(request, env, requestPath)
  },
}

async function handleShortlinkRequest(
  env: Env,
  requestPath: string,
): Promise<Response | null> {
  if (!('SHORTLINKS' in env)) return null
  const key = requestPath.slice(1) || '/'

  const value = await env.SHORTLINKS.get(key)

  if (value) {
    return respondWithRedirect(value)
  }

  return null
}

async function handleObjectRequest(
  request: Request,
  env: Env,
  requestPath: string,
): Promise<Response> {
  const key = requestPath.slice(1)
  const range = parseRange(request.headers.get('range')) ?? undefined
  // Prevent errors if the client sends invalid ETag headers
  const onlyIf = hasValidETagHeaders(request.headers)
    ? request.headers
    : undefined

  const object = await env.FILE_BUCKET.get(key, {
    range,
    onlyIf,
  })

  if (object) {
    return respondWithObjectAndBody(object, bodyOrNull(object), {
      hit: 'R2',
      range,
    })
  }

  // Not in R2, check S3
  const sucess = await fetchAndCacheFromS3(env, key)

  if (!sucess) {
    return respondWithNotFound()
  }

  // Get again for correct range
  const objectAgain = await env.FILE_BUCKET.get(key, {
    range,
    onlyIf,
  })

  if (objectAgain) {
    return respondWithObjectAndBody(objectAgain, bodyOrNull(objectAgain), {
      hit: 'R2',
      range,
    })
  }

  return new Response('Failed to cache object', { status: 500 })
}

const eTagRegex = /(P<weak>W\/)?"(P<value>.*)"/

const eTagHeaders = ['If-Match', 'If-None-Match']

/**
 * Checks if the ETag-related headers are valid for an ETag, since otherwise
 * R2 errors ungracefully on invalid ETag values
 * @param headers The headers to check
 * @returns If all the defined ETag-related headers are valid ETags
 */
function hasValidETagHeaders(headers: Headers): boolean {
  for (const header of eTagHeaders) {
    if (!isValidETagHeader(headers.get(header))) {
      return false
    }
  }

  return true
}

/**
 * Check an individual header to see if it is an valid ETag
 * @param value The value of the header to check
 * @returns If the value is valid for an ETag. Null is considered valid since it's considered as "header missing"
 */
function isValidETagHeader(value: string | null): boolean {
  // null is ok, means the header doesn't exist
  // but if it's not null and it fails the regex, it's invalid
  return value === null || eTagRegex.test(value)
}
