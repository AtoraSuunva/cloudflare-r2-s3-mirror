export interface Env {
  FILE_BUCKET: R2Bucket
  SHORTLINKS: KVNamespace
  S3_URL: string
  DELETE_FROM_S3: true
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
}

export type HTTPMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'PATCH'
