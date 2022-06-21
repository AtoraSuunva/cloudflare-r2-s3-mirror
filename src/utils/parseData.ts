/**
 * Parses a range header, if any
 *
 * Taken from https://developers.cloudflare.com/r2/examples/demo-worker/
 * @param encoded the range string to decode
 * @returns A range object or undefined if there's no `range` header
 */
export function parseRange(encoded: string | null): null | R2Range {
  if (encoded === null) {
    return null
  }

  const [range, otherRange] = encoded.split(',').map((range) => range.trim())

  if (range === undefined || otherRange !== undefined) {
    // No ranges is not a valid range and we can only do 1 range, so just return everything
    return null
  }

  const [, rangeString] = range.split('bytes=')

  if (rangeString === undefined) {
    // Unit was likely not bytes, we can only do bytes
    return null
  }

  const [start, end] = rangeString.split('-').map((n) => parseInt(n, 10))

  if (start === undefined || end === undefined) {
    // Something went wrong
    return null
  }

  if (!Number.isNaN(start) && !Number.isNaN(end)) {
    // We have both start and end, so we can return a (start-end) range
    return { offset: start, length: end - start + 1 }
  } else if (Number.isNaN(start) && !Number.isNaN(end)) {
    // Missing start but we have the end, it's a suffix-length
    return { suffix: end }
  } else if (!Number.isNaN(start) && Number.isNaN(end)) {
    // Missing end but we have the start, it's a offset + rest of file
    return { offset: start }
  }

  // Somehow we got something we couldn't match, just go with null
  return null
}

type ContentRange = { start: number; end: number }

/**
 * Get the start and end that can be used to create a Content-Range header
 * @param range The range to convert
 * @param size The size of the object you're getting the range for
 * @returns The start and end of the range to format into a Content-Range header
 */
export function getContentRange(range: R2Range, size: number): ContentRange {
  return {
    start: getRangeStart(range, size),
    end: getRangeEnd(range, size),
  }
}

/**
 * Get the start of a range for a Content-Range header
 * @param range The range to get the start of
 * @param size The size of the object you're getting the range for
 * @returns The start of the range, 0-indexed and inclusive
 */
export function getRangeStart(range: R2Range, size: number): number {
  if ('suffix' in range) {
    return size - range.suffix + 1
  }

  return range.offset ?? 0
}

/**
 * Get the end of the range for a Content-Range header
 * @param range The range to get the end of
 * @param size The size of the object you're getting the range for
 * @returns The end of the range, 0-indexed and inclusive
 */
export function getRangeEnd(range: R2Range, size: number): number {
  if ('suffix' in range || range.length === undefined) {
    return size - 1
  }

  return (range.offset ?? 0) + range.length - 1
}

/**
 * Attempts to get the body of an R2Object/R2ObjectBody, if it's not a stream/there it will return null
 * @param object Try to get the body of an R2Object or R2ObjectBody
 * @returns Either the body (ReadableStream) or null
 */
export function bodyOrNull(
  object: R2Object | R2ObjectBody,
): ReadableStream | null {
  if ('body' in object && object.body instanceof ReadableStream) {
    return object.body
  }

  return null
}
