import { z } from 'zod'

// IMPORTANT: This MUST be a function call, not a const assignment.
// Wrangler/esbuild evaluates top-level module code at build time and freezes
// values like `new Date().getFullYear()` as literal constants in the bundle.
// Calling getMaxYear() inside the request handler (or superRefine callback)
// ensures `new Date()` is evaluated at runtime, per-request.
export const getMaxYear = () => new Date().getFullYear() + 1

export const dateSchema = z.object({
  year: z.coerce
    .number({
      invalid_type_error: 'Year must be a valid number',
    })
    .min(2011, {
      message: 'Minimum year is 2011',
    })
    .optional(),
  month: z
    .coerce
    .number()
    .min(1, {
      message: 'Minimum month is 1',
    })
    .max(12, {
      message: 'Maximum month is 12',
    })
    .optional(),
  day: z
    .coerce
    .number()
    .min(1, {
      message: 'Minimum day is 1',
    })
    .max(31, {
      message: 'Maximum day is 31',
    })
    .optional(),
})
  .superRefine(({ year, month, day }, ctx) => {
    // Dynamic max year validation: getMaxYear() is called here (request time),
    // NOT in the static schema definition (which would freeze at build time).
    const maxYear = getMaxYear()

    if (year !== undefined && year > maxYear) {
      ctx.addIssue({
        path: ['year'],
        code: 'custom',
        message: `Maximum year is ${maxYear}`,
      })
    }

    if (!year) {
      year = new Date().getFullYear()
    }

    if (day) {
      if (!month) {
        ctx.addIssue({
          path: ['month'],
          code: 'custom',
          message: 'Month is required when specifying day'
        })

        return z.NEVER
      }

      const parsedDate = new Date(year, month - 1, day)

      if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) {
        ctx.addIssue({
          path: ['day'],
          code: 'custom',
          message: 'The provided date is not valid'
        })
      }
    }
  })
