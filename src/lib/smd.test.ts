import { describe, expect, it } from 'vitest'
import { decodeSmd, eia96Table, encodeSmd } from './smd.ts'

describe('decodeSmd', () => {
  it('reads 3- and 4-digit codes', () => {
    expect(decodeSmd('472')).toMatchObject({ ohms: 4700, kind: '3-digit' })
    expect(decodeSmd('103')).toMatchObject({ ohms: 10000 })
    expect(decodeSmd('100')).toMatchObject({ ohms: 10 })
    expect(decodeSmd('000')).toMatchObject({ ohms: 0 })
    expect(decodeSmd('1002')).toMatchObject({ ohms: 10000, kind: '4-digit' })
    expect(decodeSmd('4991')).toMatchObject({ ohms: 4990 })
    expect(decodeSmd('0000')).toMatchObject({ ohms: 0 })
  })
  it('reads R notation', () => {
    expect(decodeSmd('4R7')).toMatchObject({ ohms: 4.7, kind: 'R' })
    expect(decodeSmd('R47')).toMatchObject({ ohms: 0.47 })
    expect(decodeSmd('47R')).toMatchObject({ ohms: 47 })
    expect(decodeSmd('0R22')).toMatchObject({ ohms: 0.22 })
  })
  it('reads EIA-96', () => {
    expect(decodeSmd('01A')).toMatchObject({ ohms: 100, kind: 'EIA-96', tol: 1 })
    expect(decodeSmd('96C')).toMatchObject({ ohms: 97600 })
    expect(decodeSmd('68X')).toMatchObject({ ohms: 49.9 })
    expect(decodeSmd('01Z')).toMatchObject({ ohms: 0.1 })
    expect(decodeSmd('49B')).toMatchObject({ ohms: 3160 })
    expect(decodeSmd('01f')).toMatchObject({ ohms: 1e7 })
  })
  it('rejects invalid codes', () => {
    for (const s of ['', 'abc', '00A', '97A', '01Q', '4', 'R', '12345']) expect(decodeSmd(s)).toBeNull()
  })
  it('EIA-96 table is the E96 series', () => {
    const t = eia96Table()
    expect(t).toHaveLength(96)
    expect(t[0]).toBe(100)
    expect(t[95]).toBe(976)
  })
})

describe('encodeSmd', () => {
  it('produces every exact marking', () => {
    expect(encodeSmd(4700)).toEqual([
      { kind: '4-digit', code: '4701' },
      { kind: '3-digit', code: '472' },
    ])
    expect(encodeSmd(4.7)).toContainEqual({ kind: 'R', code: '4R7' })
    expect(encodeSmd(0.47)).toContainEqual({ kind: 'R', code: 'R47' })
    expect(encodeSmd(47)).toContainEqual({ kind: '3-digit', code: '470' })
    expect(encodeSmd(47)).toContainEqual({ kind: 'R', code: '47R' })
    expect(encodeSmd(10000)).toContainEqual({ kind: '3-digit', code: '103' })
    expect(encodeSmd(10000)).toContainEqual({ kind: '4-digit', code: '1002' })
    expect(encodeSmd(49.9)).toContainEqual({ kind: 'EIA-96', code: '68X' })
    expect(encodeSmd(0)).toHaveLength(2)
  })
  it('has no code for values that need more digits', () => {
    expect(encodeSmd(4712)).toEqual([])
    expect(encodeSmd(-1)).toEqual([])
  })
  it('every produced code decodes back to the value', () => {
    for (const v of [0.1, 1, 4.7, 10, 22, 47, 100, 470, 1000, 4990, 10000, 97600, 1e6, 2.2e6, 49.9, 100000, 976]) {
      for (const c of encodeSmd(v)) expect(decodeSmd(c.code)!.ohms).toBeCloseTo(v, 9)
    }
  })
})
