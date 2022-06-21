import { RequestHandler } from '.'

export const PUTHandler: RequestHandler = {
  method: 'PUT',
  async fetch() {
    return new Response('PUT handled')
  },
}
