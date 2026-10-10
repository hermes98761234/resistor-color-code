import { describe, expect, it } from 'vitest'
import { decadeValues, isStandard, mantissas, nearest, neighbors, seriesContaining, SERIES_NAMES } from './eseries.ts'

describe('series tables', () => {
  it('has the right counts', () => {
    expect(SERIES_NAMES.map((s) => mantissas(s).length)).toEqual([6, 12, 24, 48, 96, 192])
  })
  it('matches the published E6/E12/E24 values', () => {
    expect(mantissas('E6')).toEqual([1.0, 1.5, 2.2, 3.3, 4.7, 6.8])
    expect(mantissas('E12')).toEqual([1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2])
    expect(mantissas('E24').slice(0, 8)).toEqual([1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0])
  })
  it('matches published E48/E96/E192 values', () => {
    expect(mantissas('E48')).toEqual([
      1.0, 1.05, 1.1, 1.15, 1.21, 1.27, 1.33, 1.4, 1.47, 1.54, 1.62, 1.69, 1.78, 1.87, 1.96, 2.05, 2.15, 2.26, 2.37, 2.49,
      2.61, 2.74, 2.87, 3.01, 3.16, 3.32, 3.48, 3.65, 3.83, 4.02, 4.22, 4.42, 4.64, 4.87, 5.11, 5.36, 5.62, 5.9, 6.19, 6.49,
      6.81, 7.15, 7.5, 7.87, 8.25, 8.66, 9.09, 9.53,
    ])
    const e96 = mantissas('E96')
    expect(e96.slice(0, 12)).toEqual([1.0, 1.02, 1.05, 1.07, 1.1, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27, 1.3])
    expect(e96.slice(-4)).toEqual([9.09, 9.31, 9.53, 9.76])
    expect(e96[95]).toBe(9.76)
    expect(e96).toContain(4.99)
    expect(e96).toContain(2.37)
    const e192 = mantissas('E192')
    expect(e192.slice(0, 8)).toEqual([1.0, 1.01, 1.02, 1.04, 1.05, 1.06, 1.07, 1.09])
    expect(e192[191]).toBe(9.88)
  })
  it('E48 and E96 are subsets of E192', () => {
    const e192 = new Set(mantissas('E192'))
    // E96 values are every second E192 value except a few roundings; most should coincide
    const common = mantissas('E96').filter((v) => e192.has(v)).length
    expect(common).toBeGreaterThan(80)
  })
  it('scales to decades without float noise', () => {
    expect(decadeValues('E12', 3).slice(0, 3)).toEqual([1000, 1200, 1500])
    expect(decadeValues('E24', -1).slice(0, 3)).toEqual([0.1, 0.11, 0.12])
  })
})

describe('nearest', () => {
  it('finds nearest values and the error', () => {
    expect(nearest('E12', 5000)!.value).toBe(4700)
    expect(nearest('E12', 5000)!.errorPct).toBeCloseTo(-6, 5)
    expect(nearest('E24', 5000)!.value).toBe(5100)
    expect(nearest('E96', 4750)!.value).toBe(4750)
    expect(nearest('E6', 9500)!.value).toBe(10000)
    expect(nearest('E6', 0.5)!.value).toBeCloseTo(0.47)
    expect(nearest('E24', 4700)!.errorPct).toBe(0)
  })
  it('rejects non-positive targets', () => {
    expect(nearest('E24', 0)).toBeNull()
    expect(nearest('E24', -1)).toBeNull()
  })
  it('gives neighbours', () => {
    expect(neighbors('E12', 5000)).toEqual({ below: 4700, above: 5600 })
    expect(neighbors('E12', 4700)).toEqual({ below: 4700, above: 4700 })
  })
  it('detects membership', () => {
    expect(isStandard('E12', 4700)).toBe(true)
    expect(isStandard('E12', 5100)).toBe(false)
    expect(seriesContaining(4700)).toEqual(['E6', 'E12', 'E24', 'E192'])
    expect(seriesContaining(5100)).not.toContain('E12')
    expect(seriesContaining(5100)).toContain('E24')
  })
})
