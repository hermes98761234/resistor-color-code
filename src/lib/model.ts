import { convertBands, defaultBands, type BandCount, type ColorKey, COLORS } from './bands.ts'
import { SERIES_NAMES, type SeriesName } from './eseries.ts'
import { formatInput } from './value.ts'
import { decode } from './bands.ts'

export type Lang = 'en' | 'uk'
export type Theme = 'auto' | 'light' | 'dark'
export type Tab = 'bands' | 'smd' | 'series'

export interface AppState {
  lang: Lang
  theme: Theme
  tab: Tab
  count: BandCount
  colors: ColorKey[]
  /** Text in the value field of the colour-code tab. */
  valueText: string
  series: SeriesName
  /** Decade exponent shown in the E-series grid. */
  decade: number
  /** Target value text in the E-series tab. */
  target: string
  smdCode: string
  smdValue: string
}

export const STORAGE_KEY = 'resistor-color-code:v1'

export function defaultState(lang: Lang = 'en'): AppState {
  const colors = defaultBands(4)
  return {
    lang, theme: 'auto', tab: 'bands', count: 4, colors,
    valueText: formatInput(decode(colors)!.ohms),
    series: 'E24', decade: 3, target: '5.6k', smdCode: '472', smdValue: '4.7k',
  }
}

const isColor = (c: unknown): c is ColorKey => typeof c === 'string' && c in COLORS

/** Reads saved state, falling back to defaults field by field. */
export function sanitize(raw: unknown, lang: Lang): AppState {
  const d = defaultState(lang)
  if (!raw || typeof raw !== 'object') return d
  const r = raw as Record<string, unknown>
  const s = { ...d }
  if (r.lang === 'en' || r.lang === 'uk') s.lang = r.lang
  if (r.theme === 'auto' || r.theme === 'light' || r.theme === 'dark') s.theme = r.theme
  if (r.tab === 'bands' || r.tab === 'smd' || r.tab === 'series') s.tab = r.tab
  if (r.count === 3 || r.count === 4 || r.count === 5 || r.count === 6) s.count = r.count
  if (Array.isArray(r.colors) && r.colors.length === s.count && r.colors.every(isColor)) {
    s.colors = r.colors
  } else {
    s.colors = convertBands(d.colors, s.count)
  }
  const dec = decode(s.colors)
  s.valueText = typeof r.valueText === 'string' ? r.valueText : dec ? formatInput(dec.ohms) : ''
  if (typeof r.series === 'string' && (SERIES_NAMES as string[]).includes(r.series)) s.series = r.series as SeriesName
  if (typeof r.decade === 'number' && Number.isInteger(r.decade) && r.decade >= -1 && r.decade <= 9) s.decade = r.decade
  if (typeof r.target === 'string') s.target = r.target.slice(0, 30)
  if (typeof r.smdCode === 'string') s.smdCode = r.smdCode.slice(0, 12)
  if (typeof r.smdValue === 'string') s.smdValue = r.smdValue.slice(0, 30)
  return s
}

export function loadState(): AppState {
  const lang: Lang = typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('uk') ? 'uk' : 'en'
  try {
    const t = localStorage.getItem(STORAGE_KEY)
    return sanitize(t ? JSON.parse(t) : null, lang)
  } catch {
    return defaultState(lang)
  }
}

export function saveState(s: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // storage unavailable (private mode): settings just are not remembered
  }
}

