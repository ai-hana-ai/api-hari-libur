import { describe, it, expect } from 'vitest'
import { MONTH_NAME } from '../utils/constants'

describe('MONTH_NAME', () => {
  it('should have 12 months in Indonesian', () => {
    const keys = Object.keys(MONTH_NAME)
    expect(keys).toHaveLength(12)
  })

  it('should map januari to 01', () => {
    expect(MONTH_NAME['januari']).toBe('01')
  })

  it('should map desember to 12', () => {
    expect(MONTH_NAME['desember']).toBe('12')
  })

  it('should map all months correctly', () => {
    expect(MONTH_NAME).toEqual({
      januari: '01',
      februari: '02',
      maret: '03',
      april: '04',
      mei: '05',
      juni: '06',
      juli: '07',
      agustus: '08',
      september: '09',
      oktober: '10',
      november: '11',
      desember: '12',
    })
  })

  it('should have string values that are all zero-padded', () => {
    for (const [, val] of Object.entries(MONTH_NAME)) {
      expect(val).toMatch(/^\d{2}$/)
    }
  })
})