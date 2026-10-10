/** Resistor colour code: bands <-> value (IEC 60062). */

export type ColorKey =
  | 'black' | 'brown' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'violet' | 'grey' | 'white'
  | 'gold' | 'silver' | 'none'

export interface ColorInfo {
  hex: string
  /** Significant digit 0-9 (undefined for gold/silver/none). */
  digit?: number
  /** Multiplier exponent: value x 10^mult. */
  mult?: number
  /** Tolerance in percent. */
  tol?: number
  /** Temperature coefficient in ppm/K. */
  ppm?: number
}

export const COLORS: Record<ColorKey, ColorInfo> = {
  black: { hex: '#111111', digit: 0, mult: 0, ppm: 250 },
  brown: { hex: '#7b3f12', digit: 1, mult: 1, tol: 1, ppm: 100 },
  red: { hex: '#d62828', digit: 2, mult: 2, tol: 2, ppm: 50 },
  orange: { hex: '#f77f00', digit: 3, mult: 3, ppm: 15 },
  yellow: { hex: '#f6d51f', digit: 4, mult: 4, ppm: 25 },
  green: { hex: '#2a9d3f', digit: 5, mult: 5, tol: 0.5 },
  blue: { hex: '#1d4ed8', digit: 6, mult: 6, tol: 0.25, ppm: 10 },
  violet: { hex: '#8b3fc9', digit: 7, mult: 7, tol: 0.1, ppm: 5 },
  grey: { hex: '#8a8f98', digit: 8, mult: 8, tol: 0.05 },
  white: { hex: '#f5f5f5', digit: 9, mult: 9 },
  gold: { hex: '#c9a227', mult: -1, tol: 5 },
  silver: { hex: '#c0c4cc', mult: -2, tol: 10 },
  none: { hex: 'transparent', tol: 20 },
}

export const DIGIT_COLORS: ColorKey[] = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white']
export const MULT_COLORS: ColorKey[] = [...DIGIT_COLORS, 'gold', 'silver']
export const TOL_COLORS: ColorKey[] = ['brown', 'red', 'green', 'blue', 'violet', 'grey', 'gold', 'silver']
export const PPM_COLORS: ColorKey[] = ['black', 'brown', 'red', 'orange', 'yellow', 'blue', 'violet']

export type BandCount = 3 | 4 | 5 | 6
export type Role = 'digit' | 'mult' | 'tol' | 'ppm'

export function roles(count: BandCount): Role[] {
  switch (count) {
    case 3: return ['digit', 'digit', 'mult']
    case 4: return ['digit', 'digit', 'mult', 'tol']
    case 5: return ['digit', 'digit', 'digit', 'mult', 'tol']
    case 6: return ['digit', 'digit', 'digit', 'mult', 'tol', 'ppm']
  }
}

export function allowedColors(role: Role): ColorKey[] {
  return role === 'digit' ? DIGIT_COLORS : role === 'mult' ? MULT_COLORS : role === 'tol' ? TOL_COLORS : PPM_COLORS
}

export interface Decoded {
  ohms: number
  /** Tolerance in percent. */
  tol: number
  /** ppm/K, only for 6-band resistors. */
  ppm?: number
}

/** Decodes a band sequence; null if a colour is not allowed in its position. */
export function decode(colors: ColorKey[]): Decoded | null {
  const count = colors.length as BandCount
  if (count < 3 || count > 6) return null
  const rs = roles(count)
  let digits = ''
  let exp = 0
  let tol = 20
  let ppm: number | undefined
  for (let i = 0; i < count; i++) {
    const c = colors[i]
    const role = rs[i]
    if (!allowedColors(role).includes(c)) return null
    const info = COLORS[c]
    if (role === 'digit') digits += String(info.digit)
    else if (role === 'mult') exp = info.mult!
    else if (role === 'tol') tol = info.tol!
    else ppm = info.ppm
  }
  return { ohms: Number(`${Number(digits)}e${exp}`), tol, ppm }
}

export interface Encoded {
  colors: ColorKey[]
  /** The value the colours actually represent. */
  actual: number
  /** True when `actual` equals the requested value. */
  exact: boolean
}

/** Colour for a tolerance percentage (nearest available if not an exact match). */
export function tolColor(tol: number): ColorKey {
  let best: ColorKey = 'gold'
  let bd = Infinity
  for (const c of TOL_COLORS) {
    const d = Math.abs(Math.log(COLORS[c].tol! / tol))
    if (d < bd) { bd = d; best = c }
  }
  return best
}

export function ppmColor(ppm: number): ColorKey {
  let best: ColorKey = 'brown'
  let bd = Infinity
  for (const c of PPM_COLORS) {
    const d = Math.abs(Math.log(COLORS[c].ppm! / ppm))
    if (d < bd) { bd = d; best = c }
  }
  return best
}

const SIG_DIGITS: Record<BandCount, number> = { 3: 2, 4: 2, 5: 3, 6: 3 }

/**
 * Encodes a value into `count` bands. Rounds to the nearest representable value
 * (2 or 3 significant digits); null when out of the 0.01 ohm..999 Gohm range.
 */
export function encode(ohms: number, count: BandCount, tol = 5, ppm = 100): Encoded | null {
  if (!(ohms > 0) || !Number.isFinite(ohms)) return null
  const n = SIG_DIGITS[count]
  const [mant, e] = ohms.toExponential(n - 1).split('e')
  const digits = mant.replace('.', '')
  const mult = Number(e) - (n - 1)
  if (mult < -2 || mult > 9) return null
  const colors: ColorKey[] = [...digits].map((d) => DIGIT_COLORS[Number(d)])
  colors.push(mult >= 0 ? DIGIT_COLORS[mult] : mult === -1 ? 'gold' : 'silver')
  if (count >= 4) colors.push(tolColor(tol))
  if (count === 6) colors.push(ppmColor(ppm))
  const actual = Number(`${Number(digits)}e${mult}`)
  return { colors, actual, exact: Math.abs(actual - ohms) <= ohms * 1e-9 }
}

/** Re-expresses a band set with a different number of bands, keeping value, tolerance and ppm. */
export function convertBands(colors: ColorKey[], count: BandCount): ColorKey[] {
  const d = decode(colors)
  if (!d) return defaultBands(count)
  const enc = encode(d.ohms, count, d.tol, d.ppm ?? 100)
  return enc ? enc.colors : defaultBands(count)
}

export function defaultBands(count: BandCount): ColorKey[] {
  return encode(4700, count, 5, 100)!.colors
}

export function reverseBands(colors: ColorKey[]): ColorKey[] {
  return [...colors].reverse()
}
