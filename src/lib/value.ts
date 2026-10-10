/** Parsing and formatting resistance values. */

const MULT: Record<string, number> = { r: 1, k: 1e3, m: 1e6, g: 1e9 }

/**
 * Parses "4.7k", "4k7", "4R7", "R47", "2M2", "470", "1e3", "47 ohm", "10 kΩ".
 * `m`/`M` means mega (resistors are never milliohm in colour codes). Null if invalid.
 */
export function parseValue(text: string): number | null {
  const s = text.trim().replace(/\s+/g, '').replace(/(ohms?|[\u03a9\u2126])$/i, '').replace(',', '.')
  if (!s) return null
  let m = /^(\d*)([rkmg])(\d+)$/i.exec(s)
  if (m) {
    const v = Number(`${m[1] || '0'}.${m[3]}`) * MULT[m[2].toLowerCase()]
    return Number.isFinite(v) ? roundSig(v) : null
  }
  m = /^(\d+\.?\d*|\.\d+)([rkmg]?)$/i.exec(s)
  if (m) {
    const v = Number(m[1]) * (m[2] ? MULT[m[2].toLowerCase()] : 1)
    return Number.isFinite(v) ? roundSig(v) : null
  }
  if (/^\d*\.?\d+e[+-]?\d+$/i.test(s)) {
    const v = Number(s)
    return Number.isFinite(v) ? v : null
  }
  return null
}

/** Removes binary float noise such as 4.7*1000 = 4700.000000000001. */
function roundSig(v: number): number {
  return Number(v.toPrecision(12))
}

/** "4.7 kΩ", "470 Ω", "0.47 Ω", "2.2 MΩ". */
export function formatOhms(v: number): string {
  if (v === 0) return '0 Ω'
  const units: [number, string][] = [[1e9, 'GΩ'], [1e6, 'MΩ'], [1e3, 'kΩ'], [1, 'Ω']]
  for (const [u, sym] of units) {
    if (v >= u * 0.9999999) return `${+(v / u).toPrecision(4)} ${sym}`
  }
  return `${+v.toPrecision(3)} Ω`
}

/** Compact editable text for an input field: "4.7k", "470", "0.47", "2.2M". */
export function formatInput(v: number): string {
  if (v === 0) return '0'
  const units: [number, string][] = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k']]
  for (const [u, sym] of units) {
    if (v >= u * 0.9999999) return `${+(v / u).toPrecision(4)}${sym}`
  }
  return String(+v.toPrecision(4))
}

export function formatPct(p: number): string {
  return `±${+p.toPrecision(3)}%`
}

/** Signed error percentage: "+1.2%". */
export function formatErr(p: number): string {
  const s = +p.toFixed(2)
  return `${s > 0 ? '+' : ''}${s}%`
}
