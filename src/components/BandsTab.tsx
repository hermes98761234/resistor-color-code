import { useState } from 'react'
import {
  allowedColors, COLORS, convertBands, decode, encode, reverseBands, roles, tolColor,
  type BandCount, type ColorKey,
} from '../lib/bands.ts'
import { seriesContaining } from '../lib/eseries.ts'
import type { AppState } from '../lib/model.ts'
import { formatInput, formatOhms, formatPct, parseValue } from '../lib/value.ts'
import { bandRoleName, COLOR_NAME, type T } from '../i18n.ts'
import Resistor from './Resistor.tsx'

interface Props {
  state: AppState
  update: (patch: Partial<AppState>) => void
  t: T
}

const COUNTS: BandCount[] = [3, 4, 5, 6]
const TOLS = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]

function hint(c: ColorKey, role: string): string {
  const i = COLORS[c]
  if (role === 'digit') return String(i.digit)
  if (role === 'mult') return `×10^${i.mult}`
  if (role === 'tol') return `±${i.tol}%`
  return `${i.ppm} ppm/K`
}

export default function BandsTab({ state, update, t }: Props) {
  const { count, colors, valueText } = state
  const [selRaw, setSel] = useState(0)
  const sel = Math.min(selRaw, count - 1)
  const rs = roles(count)
  const dec = decode(colors)

  const setColors = (c: ColorKey[]) => {
    const d = decode(c)
    update({ colors: c, valueText: d ? formatInput(d.ohms) : valueText })
  }
  const setCount = (n: BandCount) => update({ count: n, colors: convertBands(colors, n) })
  const pick = (c: ColorKey) => setColors(colors.map((x, i) => (i === sel ? c : x)))
  const onValue = (text: string) => {
    const v = parseValue(text)
    const enc = v ? encode(v, count, dec?.tol ?? 5, dec?.ppm ?? 100) : null
    update(enc ? { valueText: text, colors: enc.colors } : { valueText: text })
  }
  const setTol = (tol: number) => {
    if (count < 4) return
    setColors(colors.map((x, i) => (rs[i] === 'tol' ? tolColor(tol) : x)))
  }

  // Feedback on what was typed
  const typed = parseValue(valueText)
  let note: { kind: 'err' | 'warn'; text: string; switchTo?: BandCount } | null = null
  if (valueText.trim() === '' || typed === null) {
    note = { kind: 'err', text: t('Enter a value like 4.7k, 4k7, 470 or 2M2.') }
  } else {
    const enc = encode(typed, count)
    if (!enc) note = { kind: 'err', text: t('Out of range for colour bands (0.01 Ω to 999 GΩ).') }
    else if (!enc.exact) {
      const more = count < 5 ? (encode(typed, 5)?.exact ? (5 as BandCount) : undefined) : undefined
      note = {
        kind: 'warn',
        text: t('Needs more digits than {0} bands can show. Nearest: {1}.', count, formatOhms(enc.actual)),
        switchTo: more,
      }
    }
  }

  const role = rs[sel]
  const stdIn = dec ? seriesContaining(dec.ohms) : []
  const tolNow = dec ? dec.tol : 20
  const tolSelectable = count >= 4

  return (
    <section className="card" aria-label={t('Colour bands')}>
      <div className="row wrap">
        <div className="field">
          <label>{t('Bands')}</label>
          <div className="seg" role="group" aria-label={t('Bands')}>
            {COUNTS.map((n) => (
              <button key={n} className={n === count ? 'on' : ''} aria-pressed={n === count} onClick={() => setCount(n)}>{n}</button>
            ))}
          </div>
        </div>
        <div className="field grow">
          <label htmlFor="val">{t('Value')}</label>
          <input
            id="val" className={note?.kind === 'err' ? 'bad' : ''} value={valueText} inputMode="text" spellCheck={false} autoComplete="off"
            onChange={(e) => onValue(e.target.value)} placeholder="4.7k"
          />
        </div>
        <div className="field">
          <label htmlFor="tol">{t('Tolerance')}</label>
          <select id="tol" disabled={!tolSelectable} value={tolSelectable ? tolNow : 20} onChange={(e) => setTol(Number(e.target.value))}>
            {!tolSelectable && <option value={20}>±20%</option>}
            {TOLS.map((x) => <option key={x} value={x}>{formatPct(x)}</option>)}
          </select>
        </div>
        <button className="reverse" onClick={() => setColors(reverseBands(colors))} title={t('Reading from the wrong end? Reverse the bands.')}>
          ⇄ {t('Reverse')}
        </button>
      </div>
      {note && (
        <p className={`note ${note.kind}`} role="status">
          {note.text}{' '}
          {note.switchTo && typed && (
            <button className="small" onClick={() => update({ count: note.switchTo!, colors: encode(typed, note.switchTo!, dec?.tol ?? 5, dec?.ppm ?? 100)!.colors })}>
              {t('Switch to {0} bands', note.switchTo)}
            </button>
          )}
        </p>
      )}

      <Resistor colors={colors} selected={sel} onSelect={setSel} t={t} />

      <div className="result" aria-live="polite">
        {dec ? (
          <>
            <div className="big">
              {formatOhms(dec.ohms)} <span className="tolbig">{formatPct(dec.tol)}</span>
            </div>
            <dl className="facts">
              <div><dt>{t('Resistance')}</dt><dd>{dec.ohms.toLocaleString('en-US')} Ω</dd></div>
              {dec.ohms > 0 && (
                <div>
                  <dt>{t('Range')}</dt>
                  <dd>{formatOhms(dec.ohms * (1 - dec.tol / 100))} … {formatOhms(dec.ohms * (1 + dec.tol / 100))}</dd>
                </div>
              )}
              {dec.ppm !== undefined && <div><dt>{t('Temperature coefficient')}</dt><dd>{dec.ppm} ppm/K</dd></div>}
              <div>
                <dt>{t('E-series')}</dt>
                <dd>{stdIn.length ? t('Standard value in {0}', stdIn.join(', ')) : t('Not a standard E-series value.')}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="note err">{t('Invalid colour in this position. Try Reverse.')}</p>
        )}
      </div>

      <h3 className="sub">
        {t('Band {0}', sel + 1)}: {t(bandRoleName(count, sel))}
      </h3>
      <p className="hint">{t('Click a band, then pick its colour.')}</p>
      <div className="palette" role="group" aria-label={t('Selected band: {0}', t(COLOR_NAME[colors[sel]]))}>
        {allowedColors(role).map((c) => (
          <button key={c} className={`sw${colors[sel] === c ? ' on' : ''}`} aria-pressed={colors[sel] === c} onClick={() => pick(c)}>
            <span className="dot" style={{ background: COLORS[c].hex }} />
            <span className="nm">{t(COLOR_NAME[c])}</span>
            <span className="hv">{hint(c, role)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
