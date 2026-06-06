import { createError } from 'nitro/h3'
import type { ZodSchema, ZodIssue } from 'zod'

/**
 * Validates data against a Zod schema. Throws H3Error (422) on failure.
 */
export function zValidator<T extends ZodSchema>(
  schema: T,
  data: unknown,
): ReturnType<T['parse']> {
  const result = schema.safeParse(data)

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const key = issue.path.join('.')
      if (!fieldErrors[key]) fieldErrors[key] = []
      fieldErrors[key].push(issue.message)
    }

    throw createError({
      status: 422,
      statusMessage: 'The given data was invalid.',
      data: fieldErrors,
    })
  }

  return result.data as ReturnType<T['parse']>
}