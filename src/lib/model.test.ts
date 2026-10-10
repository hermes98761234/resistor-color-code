import { describe, expect, it } from 'vitest'
import { decode } from './bands.ts'
import { UK, tr } from '../i18n.ts'
import { defaultState, sanitize } from './model.ts'

describe('state', () => {
  it('starts on a meaningful example', () => {
    const s = defaultState()
    expect(decode(s.colors)!.ohms).toBe(4700)
    expect(s.valueText).toBe('4.7k')
  })
  it('sanitizes bad saved data', () => {
    const s = sanitize({ count: 9, colors: ['nope'], theme: 'pink', decade: 99, series: 'E7', lang: 'xx' }, 'uk')
    expect(s.count).toBe(4)
    expect(decode(s.colors)).not.toBeNull()
    expect(s.theme).toBe('auto')
    expect(s.series).toBe('E24')
    expect(s.lang).toBe('uk')
    expect(sanitize(null, 'en').tab).toBe('bands')
  })
  it('keeps valid saved data', () => {
    const s = sanitize({ count: 5, colors: ['brown', 'black', 'black', 'brown', 'brown'], tab: 'smd', theme: 'dark' }, 'en')
    expect(s.count).toBe(5)
    expect(s.tab).toBe('smd')
    expect(decode(s.colors)!.ohms).toBe(1000)
  })
})

describe('i18n', () => {
  it('interpolates and translates', () => {
    expect(tr('en', 'Band {0}', 2)).toBe('Band 2')
    expect(tr('uk', 'Band {0}', 2)).toBe('Смуга 2')
    expect(tr('uk', 'untranslated')).toBe('untranslated')
  })
  it('keeps placeholders consistent', () => {
    for (const [en, uk] of Object.entries(UK)) {
      const ph = (s: string) => (s.match(/\{\d+\}/g) ?? []).sort().join()
      expect(ph(uk), en).toBe(ph(en))
    }
  })
})
