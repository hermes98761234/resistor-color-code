import { useEffect, useState } from 'react'
import { encode } from './lib/bands.ts'
import { loadState, saveState, type AppState, type Tab } from './lib/model.ts'
import { formatInput } from './lib/value.ts'
import { tr, type T } from './i18n.ts'
import BandsTab from './components/BandsTab.tsx'
import SmdTab from './components/SmdTab.tsx'
import SeriesTab from './components/SeriesTab.tsx'

const TABS: [Tab, string][] = [
  ['bands', 'Colour bands'],
  ['smd', 'SMD codes'],
  ['series', 'E-series'],
]

export default function App() {
  const [state, setState] = useState<AppState>(loadState)
  const { lang, theme, tab } = state
  const t: T = (s, ...a) => tr(lang, s, ...a)
  const update = (patch: Partial<AppState>) => setState((s) => ({ ...s, ...patch }))

  useEffect(() => saveState(state), [state])
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'auto') delete root.dataset.theme
    else root.dataset.theme = theme
    root.lang = lang
  }, [theme, lang])

  /** Loads a value into the colour-band tab, keeping the band count and tolerance. */
  const show = (ohms: number) =>
    setState((s) => {
      const enc = encode(ohms, s.count)
      return enc ? { ...s, tab: 'bands', colors: enc.colors, valueText: formatInput(ohms) } : s
    })

  return (
    <div className="app">
      <header className="toolbar">
        <div className="titles">
          <h1 className="brand">{t('Resistor colour code')}</h1>
          <span className="hint">{t('Colour bands, SMD codes and E-series values, both directions.')}</span>
        </div>
        <div className="settings">
          <label>
            {t('Language')}{' '}
            <select value={lang} onChange={(e) => update({ lang: e.target.value as AppState['lang'] })}>
              <option value="en">English</option>
              <option value="uk">Українська</option>
            </select>
          </label>
          <label>
            {t('Theme')}{' '}
            <select value={theme} onChange={(e) => update({ theme: e.target.value as AppState['theme'] })}>
              <option value="auto">{t('System')}</option>
              <option value="light">{t('Light')}</option>
              <option value="dark">{t('Dark')}</option>
            </select>
          </label>
        </div>
      </header>
      <main className="main">
        <div className="tabs" role="tablist">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => update({ tab: id })}>
              {t(label)}
            </button>
          ))}
        </div>
        {tab === 'bands' && <BandsTab state={state} update={update} t={t} />}
        {tab === 'smd' && <SmdTab state={state} update={update} t={t} />}
        {tab === 'series' && <SeriesTab state={state} update={update} show={show} t={t} />}
      </main>
      <p className="hint foot">
        {t('Values are read per IEC 60062. Always confirm with a multimeter.')}{' '}
        <a href="https://github.com/hermes98761234/resistor-color-code">{t('Source on GitHub')}</a>
      </p>
    </div>
  )
}
