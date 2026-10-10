import { describe, expect, it } from 'vitest'
import { convertBands, decode, encode, reverseBands, type ColorKey } from './bands.ts'

const d = (...c: ColorKey[]) => decode(c)!

describe('decode', () => {
  it('reads textbook 4-band values', () => {
    expect(d('brown', 'black', 'red', 'gold')).toEqual({ ohms: 1000, tol: 5, ppm: undefined })
    expect(d('yellow', 'violet', 'red', 'gold').ohms).toBe(4700)
    expect(d('red', 'red', 'brown', 'silver')).toMatchObject({ ohms: 220, tol: 10 })
    expect(d('green', 'blue', 'orange', 'red')).toMatchObject({ ohms: 56000, tol: 2 })
    expect(d('orange', 'orange', 'yellow', 'gold').ohms).toBe(330000)
    expect(d('white', 'brown', 'white', 'gold').ohms).toBe(91e9)
  })
  it('handles fractional multipliers without float noise', () => {
    expect(d('yellow', 'violet', 'silver', 'gold').ohms).toBe(0.47)
    expect(d('brown', 'black', 'gold', 'gold').ohms).toBe(1)
    expect(d('green', 'blue', 'gold', 'gold').ohms).toBe(5.6)
    expect(d('black', 'black', 'black', 'gold').ohms).toBe(0)
  })
  it('reads 3-band (20%), 5-band and 6-band', () => {
    expect(d('brown', 'black', 'orange')).toMatchObject({ ohms: 10000, tol: 20 })
    expect(d('brown', 'black', 'black', 'brown', 'brown')).toMatchObject({ ohms: 1000, tol: 1 })
    expect(d('red', 'red', 'black', 'black', 'brown').ohms).toBe(220)
    expect(d('brown', 'black', 'black', 'red', 'blue')).toMatchObject({ ohms: 10000, tol: 0.25 })
    expect(d('yellow', 'violet', 'black', 'brown', 'brown', 'red')).toMatchObject({ ohms: 4700, tol: 1, ppm: 50 })
    expect(d('brown', 'black', 'black', 'gold', 'brown', 'brown').ohms).toBe(10)
  })
  it('rejects colours that are not allowed in a position', () => {
    expect(decode(['gold', 'black', 'red', 'gold'])).toBeNull()
    expect(decode(['brown', 'black', 'red', 'black'])).toBeNull()
    expect(decode(['brown', 'black'] as ColorKey[])).toBeNull()
  })
})

describe('encode', () => {
  it('produces textbook colours', () => {
    expect(encode(4700, 4, 5)).toEqual({ colors: ['yellow', 'violet', 'red', 'gold'], actual: 4700, exact: true })
    expect(encode(1000, 5, 1)!.colors).toEqual(['brown', 'black', 'black', 'brown', 'brown'])
    expect(encode(0.47, 4, 5)!.colors).toEqual(['yellow', 'violet', 'silver', 'gold'])
    expect(encode(10, 5, 1)!.colors).toEqual(['brown', 'black', 'black', 'gold', 'brown'])
    expect(encode(1e6, 3)!.colors).toEqual(['brown', 'black', 'green'])
    expect(encode(2.2e6, 4, 10)!.colors).toEqual(['red', 'red', 'green', 'silver'])
    expect(encode(4700, 6, 1, 50)!.colors).toEqual(['yellow', 'violet', 'black', 'brown', 'brown', 'red'])
  })
  it('flags values that need more digits', () => {
    const r = encode(4750, 4)!
    expect(r.exact).toBe(false)
    expect(Math.abs(r.actual - 4750)).toBeLessThanOrEqual(50)
    expect(encode(4750, 5)).toMatchObject({ actual: 4750, exact: true })
  })
  it('returns null outside the representable range', () => {
    expect(encode(0.001, 4)).toBeNull()
    expect(encode(0, 4)).toBeNull()
    expect(encode(-5, 4)).toBeNull()
    expect(encode(1e13, 4)).toBeNull()
  })
  it('round-trips with decode for every E24 value', () => {
    for (const m of [1.0, 1.1, 2.2, 3.3, 4.7, 5.1, 9.1]) {
      for (let e = -1; e <= 8; e++) {
        const v = Number(`${Math.round(m * 10)}e${e - 1}`)
        const enc = encode(v, 4)
        if (!enc) continue
        expect(enc.exact).toBe(true)
        expect(decode(enc.colors)!.ohms).toBe(v)
      }
    }
  })
})

describe('convertBands / reverse', () => {
  it('keeps the value when changing the band count', () => {
    const four = encode(4700, 4, 5)!.colors
    const five = convertBands(four, 5)
    expect(five).toEqual(['yellow', 'violet', 'black', 'brown', 'gold'])
    expect(decode(five)!.ohms).toBe(4700)
    expect(decode(convertBands(five, 6))).toMatchObject({ ohms: 4700, tol: 5, ppm: 100 })
  })
  it('reverses', () => {
    expect(reverseBands(['red', 'green', 'gold'])).toEqual(['gold', 'green', 'red'])
  })
})
