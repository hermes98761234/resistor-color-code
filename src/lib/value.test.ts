import { describe, expect, it } from 'vitest'
import { formatInput, formatOhms, parseValue } from './value.ts'

describe('parseValue', () => {
  it('parses common notations', () => {
    expect(parseValue('470')).toBe(470)
    expect(parseValue('4.7k')).toBe(4700)
    expect(parseValue('4k7')).toBe(4700)
    expect(parseValue('4K7')).toBe(4700)
    expect(parseValue('4R7')).toBe(4.7)
    expect(parseValue('R47')).toBe(0.47)
    expect(parseValue('2M2')).toBe(2.2e6)
    expect(parseValue('10 kΩ')).toBe(10000)
    expect(parseValue('47 ohm')).toBe(47)
    expect(parseValue('1,5k')).toBe(1500)
    expect(parseValue('1e3')).toBe(1000)
    expect(parseValue('.5')).toBe(0.5)
  })
  it('rejects garbage', () => {
    for (const s of ['', 'abc', 'k', '4.7.1k', '4kk', '-5']) expect(parseValue(s)).toBeNull()
  })
})

describe('format', () => {
  it('formats with SI units', () => {
    expect(formatOhms(4700)).toBe('4.7 kΩ')
    expect(formatOhms(470)).toBe('470 Ω')
    expect(formatOhms(0.47)).toBe('0.47 Ω')
    expect(formatOhms(2.2e6)).toBe('2.2 MΩ')
    expect(formatOhms(1e9)).toBe('1 GΩ')
    expect(formatOhms(0)).toBe('0 Ω')
  })
  it('formats editable text that parses back', () => {
    for (const v of [0.47, 1, 4.7, 470, 4700, 56000, 2.2e6, 3.3e9]) expect(parseValue(formatInput(v))).toBe(v)
  })
})
