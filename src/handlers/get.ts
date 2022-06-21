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

  const object = await env.FILE_BUCKET.get(key, {
    range,
    onlyIf: request.headers,
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
    onlyIf: request.headers,
  })

  if (objectAgain) {
    return respondWithObjectAndBody(objectAgain, bodyOrNull(objectAgain), {
      hit: 'R2',
      range,
    })
  }

  return new Response('Failed to cache object', { status: 500 })
}
