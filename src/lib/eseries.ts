/** IEC 60063 preferred-number series. */

export type SeriesName = 'E6' | 'E12' | 'E24' | 'E48' | 'E96' | 'E192'
export const SERIES_NAMES: SeriesName[] = ['E6', 'E12', 'E24', 'E48', 'E96', 'E192']

const E24 = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
]
const E12 = E24.filter((_, i) => i % 2 === 0)
const E6 = E12.filter((_, i) => i % 2 === 0)

const COUNT: Record<SeriesName, number> = { E6: 6, E12: 12, E24: 24, E48: 48, E96: 96, E192: 192 }

/** Typical tolerance (percent) belonging to each series. */
export const SERIES_TOL: Record<SeriesName, number> = { E6: 20, E12: 10, E24: 5, E48: 2, E96: 1, E192: 0.5 }

const cache = new Map<SeriesName, number[]>()

/** Mantissas in [1, 10) for one decade. E48 and above are 10^(i/N) rounded to 3 significant digits. */
export function mantissas(name: SeriesName): number[] {
  let v = cache.get(name)
  if (!v) {
    if (name === 'E6') v = E6
    else if (name === 'E12') v = E12
    else if (name === 'E24') v = E24
    else {
      const n = COUNT[name]
      v = Array.from({ length: n }, (_, i) => Math.round(10 ** (2 + i / n)) / 100)
    }
    cache.set(name, v)
  }
  return v
}

/** Values of a series within the decade [10^exp, 10^(exp+1)). */
export function decadeValues(name: SeriesName, exp: number): number[] {
  return mantissas(name).map((m) => Number(`${Math.round(m * 100)}e${exp - 2}`))
}

export interface Nearest {
  value: number
  /** (value - target) / target in percent. */
  errorPct: number
}

/** Nearest series value (log-scale distance) to a positive target. */
export function nearest(name: SeriesName, target: number): Nearest | null {
  if (!(target > 0) || !Number.isFinite(target)) return null
  const e0 = Math.floor(Math.log10(target))
  let best = 0
  let bd = Infinity
  for (let e = e0 - 1; e <= e0 + 1; e++) {
    for (const v of decadeValues(name, e)) {
      const d = Math.abs(Math.log(v / target))
      if (d < bd - 1e-12) { bd = d; best = v }
    }
  }
  return { value: best, errorPct: ((best - target) / target) * 100 }
}

/** Series values immediately below and above the target (equal values count for both). */
export function neighbors(name: SeriesName, target: number): { below: number; above: number } | null {
  if (!(target > 0) || !Number.isFinite(target)) return null
  const e0 = Math.floor(Math.log10(target))
  let below = 0
  let above = Infinity
  for (let e = e0 - 1; e <= e0 + 1; e++) {
    for (const v of decadeValues(name, e)) {
      if (v <= target * (1 + 1e-9) && v > below) below = v
      if (v >= target * (1 - 1e-9) && v < above) above = v
    }
  }
  return { below, above }
}

export function isStandard(name: SeriesName, value: number): boolean {
  const n = nearest(name, value)
  return !!n && Math.abs(n.errorPct) < 1e-7
}

/** Every series that contains the value. */
export function seriesContaining(value: number): SeriesName[] {
  return SERIES_NAMES.filter((s) => isStandard(s, value))
}
