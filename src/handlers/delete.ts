import { RequestHandler } from '.'

export const DELETEHandler: RequestHandler = {
  method: 'DELETE',
  async fetch() {
    return new Response('DELETE handled')
  },
}
