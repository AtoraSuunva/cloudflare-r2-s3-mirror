import { RequestHandler } from '.'
import { respondWithNotFound, respondWithObjectAndBody } from '../utils/respond'
import { fetchAndCacheFromS3 } from '../utils/s3'

export const HEADHandler: RequestHandler = {
  method: 'HEAD',
  async fetch(_request, env, _ctx, { requestPath }) {
    const key = requestPath.slice(1)
    const object = await env.FILE_BUCKET.head(key)

    if (object) {
      return respondWithObjectAndBody(object, null, { hit: 'R2', status: 200 })
    }

    // Not in R2, check S3
    const sucess = await fetchAndCacheFromS3(env, key)

    if (!sucess) {
      return respondWithNotFound()
    }

    // Get again for correct headers (lazy method)
    const objectAgain = await env.FILE_BUCKET.head(key)

    if (objectAgain) {
      return respondWithObjectAndBody(objectAgain, null, {
        hit: 'S3-R2',
        status: 200,
      })
    }

    return new Response('Failed to cache object', { status: 500 })
  },
}
