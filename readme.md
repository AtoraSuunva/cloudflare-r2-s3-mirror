# cloudflare-r2-s3-mirror

A worker to transparently proxy an S3 bucket, when you want to use R2 but without needing to transfer everything first.

Also has shortlink/redirect support using KV

On request, the mirror will:
  - Get the "key" from the url (`example.com/my-file` -> `my-file`)
  - Check KV for any shortlinks (optional)
    - If found, respond with an HTTP 301 redirect
  - Check R2 for a file with a matching key
    - If found, responds with that file
  - Check S3 for a file with a matching key
    - If found:
      - Fetch the file from S3
      - Store it in R2
      - Respond with the file
  - If not found in R2 or S3, then responds with a 404

## R2

An R2 bucket is required, check the [documentation](https://developers.cloudflare.com/r2) for more information.

Bind the bucket using `wrangler.toml`, there is no extra setup required.

## S3

An S3 bucket URL is required (like `https://s3.us-east-1.amazonaws.com/my-bucket/`).

Set the bucket to use using `wrangler.toml` as `S3_URL`.

Nothing else is required for public buckets, for private buckets you need to also define `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as secret env vars (`wranger secret put <name>`)

`DELETE_FROM_S3` can be set to `true` if you want the worker to delete files from S3 that were mirrored to R2.

Required policy options on the bucket
  - `GetObject`
  - `DeleteObject` if `DELETE_FROM_S3=true`

## Shortlinks (Optional)

Shortlinks can be configured using a [KV store](https://developers.cloudflare.com/workers/learning/how-kv-works/).

Create a KV store and then bind it to this worker using `wrangler.toml` to use it.

The `key` of each KV entry is matched against the request path (`example.com/my/path-here` -> `my/path-here`) and the worker will return an HTTP 301 redirect to the `value`

To redirect from the root of the site, use `/` as a `key` to match a request to `example.com`

## Setup

Define the required variables in `wrangler.example.toml`:
  - Bind the R2 bucket
  - `S3_URL`
    - `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` if the bucket is private

You can test the worker using `wrangler dev` and `localhost` if you've also configured the `preview_bucket_name` for your R2 binding.

Use `wrangler publish` to deploy your worker

### Custom Domain

If you want to host the worker on a custom domain, then setup a [custom domain](https://developers.cloudflare.com/workers/platform/routing/custom-domains) on your worker

ie. to host it on `example.com`, set `example.com/*` as a custom domain.

## Contributing

Contributions are welcome, but please make sure files are linted & prettified with `npm run lint` or `pnpm run lint` or `yarn run lint`
