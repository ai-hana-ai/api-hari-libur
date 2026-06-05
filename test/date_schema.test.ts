import { describe, it, expect } from 'vitest'
import { dateSchema, getMaxYear } from '../src/schema/date_schema'

const currentYear = new Date().getFullYear()
const maxYear = currentYear + 1

describe('getMaxYear()', () => {
  it('returns current year + 1', () => {
    expect(getMaxYear()).toBe(currentYear + 1)
  })

  it('is a function (not a frozen const)', () => {
    expect(typeof getMaxYear).toBe('function')
  })
})

describe('dateSchema — year validation', () => {
  it('passes year=2026', () => {
    const result = dateSchema.safeParse({ year: 2026 })
    expect(result.success).toBe(true)
  })

  it('passes year=maxYear (dynamic max)', () => {
    const result = dateSchema.safeParse({ year: maxYear })
    expect(result.success).toBe(true)
  })

  it('fails year=maxYear+1 with dynamic message', () => {
    const result = dateSchema.safeParse({ year: maxYear + 1 })
    expect(result.success).toBe(false)
    const messages = result.error!.issues.map((i) => i.message)
    expect(messages.some((m) => m.includes(`Maximum year is ${maxYear}`))).toBe(true)
  })

  it('fails year=1971 with minimum year error (NOT max bug)', () => {
    const result = dateSchema.safeParse({ year: 1971 })
    expect(result.success).toBe(false)
    const messages = result.error!.issues.map((i) => i.message)
    // Should NOT contain the old bug message
    expect(messages.some((m) => m.includes('Maximum year is 1971'))).toBe(false)
    // Should say minimum year is 2011
    expect(messages.some((m) => m.includes('Minimum year is 2011'))).toBe(true)
  })

  it('fails year=abc with invalid number error', () => {
    const result = dateSchema.safeParse({ year: 'abc' })
    expect(result.success).toBe(false)
    const messages = result.error!.issues.map((i) => i.message)
    expect(messages.some((m) => m.includes('valid number'))).toBe(true)
  })

  it('fails year=-1 (below min)', () => {
    const result = dateSchema.safeParse({ year: -1 })
    expect(result.success).toBe(false)
  })

  it('fails year=0 (below min 2011)', () => {
    const result = dateSchema.safeParse({ year: 0 })
    expect(result.success).toBe(false)
  })

  it('passes year=2011 (min)', () => {
    const result = dateSchema.safeParse({ year: 2011 })
    expect(result.success).toBe(true)
  })

  it('passes year=2025', () => {
    const result = dateSchema.safeParse({ year: 2025 })
    expect(result.success).toBe(true)
  })

  it('passes no year (defaults to current)', () => {
    const result = dateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('fails year=99999 (way above max)', () => {
    const result = dateSchema.safeParse({ year: 99999 })
    expect(result.success).toBe(false)
    const messages = result.error!.issues.map((i) => i.message)
    expect(messages.some((m) => m.includes(`Maximum year is ${maxYear}`))).toBe(true)
  })
})

describe('dateSchema — month validation', () => {
  it('passes month=1', () => {
    const result = dateSchema.safeParse({ year: 2026, month: 1 })
    expect(result.success).toBe(true)
  })

  it('passes month=12', () => {
    const result = dateSchema.safeParse({ year: 2026, month: 12 })
    expect(result.success).toBe(true)
  })

  it('fails month=13', () => {
    const result = dateSchema.safeParse({ year: 2026, month: 13 })
    expect(result.success).toBe(false)
  })

  it('fails month=0', () => {
    const result = dateSchema.safeParse({ year: 2026, month: 0 })
    expect(result.success).toBe(false)
  })

  it('passes month omitted', () => {
    const result = dateSchema.safeParse({ year: 2026 })
    expect(result.success).toBe(true)
  })
})

describe('dateSchema — day validation', () => {
  it('passes day=15 with month', () => {
    const result = dateSchema.safeParse({ year: 2026, month: 3, day: 15 })
    expect(result.success).toBe(true)
  })

  it('fails day without month', () => {
    const result = dateSchema.safeParse({ year: 2026, day: 15 })
    expect(result.success).toBe(false)
    const messages = result.error!.issues.map((i) => i.message)
    expect(messages.some((m) => m.includes('Month is required'))).toBe(true)
  })

  it('fails invalid date (Feb 30)', () => {
    const result = dateSchema.safeParse({ year: 2026, month: 2, day: 30 })
    expect(result.success).toBe(false)
    const messages = result.error!.issues.map((i) => i.message)
    expect(messages.some((m) => m.includes('not valid'))).toBe(true)
  })

  it('fails day=32 (max 31)', () => {
    const result = dateSchema.safeParse({ year: 2026, month: 1, day: 32 })
    expect(result.success).toBe(false)
  })

  it('fails day=0', () => {
    const result = dateSchema.safeParse({ year: 2026, month: 1, day: 0 })
    expect(result.success).toBe(false)
  })

  it('passes day omitted', () => {
    const result = dateSchema.safeParse({ year: 2026, month: 1 })
    expect(result.success).toBe(true)
  })
})
