import app from '../../src/app'

export const onRequest = async (context: {
  request: Request
  env: Record<string, unknown>
  params: Record<string, string | string[]>
  waitUntil: (promise: Promise<unknown>) => void
  next: (input?: Request | string) => Promise<Response>
  data: unknown
}): Promise<Response> => {
  return app.fetch(context.request, context.env, {
    waitUntil: context.waitUntil.bind(context),
    passThroughOnException: () => {},
    props: {},
  })
}
