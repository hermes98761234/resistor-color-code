import { decodeSmd, encodeSmd } from '../lib/smd.ts'
import type { AppState } from '../lib/model.ts'
import { formatOhms, formatPct, parseValue } from '../lib/value.ts'
import type { T } from '../i18n.ts'

interface Props {
  state: AppState
  update: (patch: Partial<AppState>) => void
  t: T
}

const KIND_LABEL = { '3-digit': '3-digit', '4-digit': '4-digit', R: 'R notation', 'EIA-96': 'EIA-96' } as const
const KIND_HELP = {
  '3-digit': 'Last digit is the number of zeros: 472 = 47 × 10² Ω.',
  '4-digit': 'Last digit is the number of zeros: 472 = 47 × 10² Ω.',
  R: 'The R is the decimal point: 4R7 = 4.7 Ω.',
  'EIA-96': 'Two digits pick a value from the E96 table, the letter is the multiplier.',
} as const
const CODE_EXAMPLES = ['103', '4R7', '1002', '01C', '68X', 'R22']
const VALUE_EXAMPLES = ['4.7k', '0.47', '100k', '49.9', '2.2M']

export default function SmdTab({ state, update, t }: Props) {
  const dec = decodeSmd(state.smdCode)
  const v = parseValue(state.smdValue)
  const codes = v !== null ? encodeSmd(v) : []
  return (
    <div className="two">
      <section className="card" aria-label={t('Code to value')}>
        <h2>{t('Code to value')}</h2>
        <div className="field">
          <label htmlFor="smdcode">{t('Marking on the resistor')}</label>
          <input
            id="smdcode" className={state.smdCode && !dec ? 'bad' : ''} value={state.smdCode} maxLength={8} spellCheck={false}
            autoComplete="off" onChange={(e) => update({ smdCode: e.target.value })} placeholder="472"
          />
        </div>
        <p className="chips">
          <span className="hint">{t('Examples:')}</span>
          {CODE_EXAMPLES.map((c) => <button key={c} className="small" onClick={() => update({ smdCode: c })}>{c}</button>)}
        </p>
        <div className="result" aria-live="polite">
          {dec ? (
            <>
              <div className="big">{formatOhms(dec.ohms)}</div>
              <dl className="facts">
                <div><dt>{t('Resistance')}</dt><dd>{dec.ohms.toLocaleString('en-US')} Ω</dd></div>
                <div><dt>{t('Marking on the resistor')}</dt><dd>{t(KIND_LABEL[dec.kind])}</dd></div>
                <div><dt>{t('Tolerance')}</dt><dd>{t('Typical tolerance {0}', formatPct(dec.tol))}</dd></div>
              </dl>
              <p className="hint">{t(KIND_HELP[dec.kind])}</p>
            </>
          ) : (
            <p className="note err">{t('Not a valid SMD code.')}</p>
          )}
        </div>
      </section>

      <section className="card" aria-label={t('Value to code')}>
        <h2>{t('Value to code')}</h2>
        <div className="field">
          <label htmlFor="smdval">{t('Value to mark')}</label>
          <input
            id="smdval" className={state.smdValue && v === null ? 'bad' : ''} value={state.smdValue} spellCheck={false} autoComplete="off"
            onChange={(e) => update({ smdValue: e.target.value })} placeholder="4.7k"
          />
        </div>
        <p className="chips">
          <span className="hint">{t('Examples:')}</span>
          {VALUE_EXAMPLES.map((c) => <button key={c} className="small" onClick={() => update({ smdValue: c })}>{c}</button>)}
        </p>
        <div className="result" aria-live="polite">
          {v === null ? (
            <p className="note err">{t('Enter a value like 4.7k, 4k7, 470 or 2M2.')}</p>
          ) : codes.length ? (
            <>
              <div className="big">{formatOhms(v)}</div>
              <ul className="codes">
                {codes.map((c) => (
                  <li key={c.kind}>
                    <span className="code">{c.code}</span>
                    <span className="kind">{t(KIND_LABEL[c.kind])}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="note warn">{t('No exact SMD marking for this value.')}</p>
          )}
        </div>
      </section>
    </div>
  )
}
