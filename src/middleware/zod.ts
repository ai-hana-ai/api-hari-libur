import { type ZodSchema } from 'zod'
import { type ValidationTargets } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zValidator as zv } from '@hono/zod-validator'


export const zValidator = <T extends ZodSchema, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T
) =>
  zv(target, schema, (result) => {
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of result.error.issues) {
        const key = issue.path.join('.')
        if (!fieldErrors[key]) fieldErrors[key] = []
        fieldErrors[key].push(issue.message)
      }

      throw new HTTPException(422, {
        message: 'The given data was invalid.',
        cause: fieldErrors,
      })
    }
  })
