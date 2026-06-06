import { defineHandler } from 'nitro'
import { handleCors, isPreflightRequest } from 'nitro/h3'

const corsOptions = {
  origin: '*',
  methods: ['GET'],
  allowHeaders: ['*'],
  credentials: false,
}

export default defineHandler((event) => {
  if (isPreflightRequest(event)) {
    handleCors(event, corsOptions)
    return
  }

  handleCors(event, corsOptions)
})