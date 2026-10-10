/** SMD resistor marking codes: 3/4-digit, R-notation and EIA-96. */

import { mantissas } from './eseries.ts'
import { parseValue } from './value.ts'

export type SmdKind = '3-digit' | '4-digit' | 'R' | 'EIA-96'

export interface SmdDecoded {
  ohms: number
  kind: SmdKind
  /** Tolerance typical for the marking type, percent. */
  tol: number
}

/** EIA-96 multiplier letters (R is left out on purpose: 47R means 47 ohm). */
export const EIA96_MULT: Record<string, number> = {
  Z: 0.001, Y: 0.01, X: 0.1, S: 0.1, A: 1, B: 10, H: 10, C: 100, D: 1e3, E: 1e4, F: 1e5,
}
const EIA96_LETTER: Record<number, string> = { '-3': 'Z', '-2': 'Y', '-1': 'X', 0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F' }

/** The 96 EIA-96 mantissas as integers (100, 102, ... 976). */
export function eia96Table(): number[] {
  return mantissas('E96').map((m) => Math.round(m * 100))
}

export function decodeSmd(input: string): SmdDecoded | null {
  const s = input.trim().toUpperCase().replace(/\s+/g, '')
  if (!s) return null
  let m = /^(\d{2})([A-Z])$/.exec(s)
  if (m) {
    const code = Number(m[1])
    const mult = EIA96_MULT[m[2]]
    if (mult !== undefined) {
      if (code < 1 || code > 96) return null
      return { ohms: Number((eia96Table()[code - 1] * mult).toPrecision(12)), kind: 'EIA-96', tol: 1 }
    }
  }
  if (/^[0-9]*R[0-9]*$/.test(s) && /\d/.test(s)) {
    const v = parseValue(s)
    return v === null ? null : { ohms: v, kind: 'R', tol: 1 }
  }
  m = /^(\d{2,3})(\d)$/.exec(s)
  if (m) {
    const kind: SmdKind = s.length === 3 ? '3-digit' : '4-digit'
    return { ohms: Number(`${Number(m[1])}e${m[2]}`), kind, tol: kind === '3-digit' ? 5 : 1 }
  }
  return null
}

export interface SmdCode {
  kind: SmdKind
  code: string
}

/** All markings that represent the value exactly. */
export function encodeSmd(ohms: number): SmdCode[] {
  const out: SmdCode[] = []
  if (ohms === 0) return [{ kind: '3-digit', code: '000' }, { kind: '4-digit', code: '0000' }]
  if (!(ohms > 0) || !Number.isFinite(ohms)) return out
  const sig3 = ohms.toExponential(2)
  const exact3 = Math.abs(Number(sig3) - ohms) <= ohms * 1e-9
  if (!exact3) return out
  const [mant, ex] = sig3.split('e')
  const digits3 = mant.replace('.', '') // 3 digits, e.g. "470"
  const exp3 = Number(ex) - 2 // value = digits3 x 10^exp3

  // 4-digit: 3 digits + exponent 0..9
  if (exp3 >= 0 && exp3 <= 9) out.push({ kind: '4-digit', code: digits3 + exp3 })
  // 3-digit: needs a trailing zero in the 3 digits (two significant digits)
  if (digits3.endsWith('0') && exp3 + 1 >= 0 && exp3 + 1 <= 9) {
    out.push({ kind: '3-digit', code: digits3.slice(0, 2) + (exp3 + 1) })
  }
  // R notation for values under 1000 ohm
  if (ohms < 1000) {
    const t = String(+ohms.toPrecision(3))
    out.push({ kind: 'R', code: t.includes('.') ? t.replace('.', 'R').replace(/^0R/, 'R') : `${t}R` })
  }
  // EIA-96
  const idx = eia96Table().indexOf(Number(digits3))
  const letter = EIA96_LETTER[exp3]
  if (idx >= 0 && letter) out.push({ kind: 'EIA-96', code: String(idx + 1).padStart(2, '0') + letter })
  return out
}
