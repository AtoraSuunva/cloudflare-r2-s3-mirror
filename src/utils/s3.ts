import { AwsClient } from 'aws4fetch'
import { Env } from '../types'

/**
 * Fetch something from an S3 bucket and then automatically copy it to R2 if successful
 * @param env The environment to use
 * @param key The key to use when fetching from S3
 * @returns If the request was successfully fetched and then cached or not
 */
export async function fetchAndCacheFromS3(
  env: Env,
  key: string,
): Promise<boolean> {
  const s3Object = await fetchFromS3(env, key)

  if (!s3Object) {
    return false
  }

  // Write the clone to R3
  await env.FILE_BUCKET.put(key, s3Object.body, {
    httpMetadata: {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      contentType: s3Object.headers.get('content-type')!,
    },
  })

  // Delete the S3 object
  if (env.DELETE_FROM_S3) {
    await deleteFromS3(env, key)
  }

  return true
}

/**
 * GET some object from S3
 * @param env The environment to use
 * @param key The object key to fetch from S3
 * @returns Either a response from S3 if it was successful, or null if it was not
 */
export async function fetchFromS3(
  env: Env,
  key: string,
): Promise<Response | null> {
  const url = `${env.S3_URL}${key}`
  const response = await (hasAWSEnvVars(env) ? awsFetch(env, url) : fetch(url))

  if (!response.ok) {
    return null
  }

  return response
}

/**
 * DELETE some object from S3
 * @param env The environment to use
 * @param key The object key to delete from S3
 * @returns Either a response from S3 if it was successful, or null if it was not
 */
export async function deleteFromS3(
  env: Env,
  key: string,
): Promise<Response | null> {
  const response = await awsFetch(env, `${env.S3_URL}${key}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    return null
  }

  return response
}

/** Lazy init the aws client because env vars aren't available everywhere in modules */
let awsClient: AwsClient | null = null

function hasAWSEnvVars(env: Env): boolean {
  return (
    'AWS_ACCESS_KEY_ID' in env &&
    'AWS_SECRET_ACCESS_KEY' in env &&
    'S3_URL' in env
  )
}

function awsFetch(
  env: Env,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  if (!awsClient) {
    awsClient = new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    })
  }

  return awsClient.fetch(url, init)
}
