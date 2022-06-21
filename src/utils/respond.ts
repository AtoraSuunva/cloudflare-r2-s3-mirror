import { getContentRange } from './parseData'

/** The type of hit that was done, ie. did it fetch from just R2, or S3 then R2 */
export type HitType = 'R2' | 'S3-R2'

/**
 * Define how exactly to respond
 */
export interface ObjectResponseOptions {
  /** The hit type */
  hit: HitType
  /** The range that was requested, if any */
  range?: R2Range | undefined
  /** The status code to use, if not given an appropriate status code will be generated */
  status?: number
}

/**
 * Create a response with the correct headers and status for an object response
 * @param object The object to respond with
 * @param body The body to respond with, if any
 * @param param The options on how to respond exactly
 * @returns A response that can be returned to the user
 */
export function respondWithObjectAndBody(
  object: R2Object,
  body: ReadableStream | null,
  { hit, range, status }: ObjectResponseOptions,
): Response {
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('ETag', object.httpEtag)
  headers.set('Hit-Storage', hit)

  const { contentType } = object.httpMetadata
  if (contentType && /^text\/\w+$/.test(contentType)) {
    headers.set('Content-Type', contentType + '; charset=utf-8')
  }

  const sentStatus = status ?? (body ? (range ? 206 : 200) : 304)

  if (range) {
    const { start, end } = getContentRange(range, object.size)
    headers.set('Content-Range', `bytes ${start}-${end}/${object.size}`)
  }

  return new Response(body, { headers, status: sentStatus })
}

/**
 * A default "Not Found" error response that can be returned to the user
 * @returns A response that can be returned to the user
 */
export function respondWithNotFound() {
  return new Response('Not found', { status: 404 })
}

/**
 * Create a response to redirect a user to a location
 * @param to The location to redirect to
 * @returns A response to redirect the user
 */
export function respondWithRedirect(to: string) {
  return new Response('', { status: 301, headers: { location: to } })
}
