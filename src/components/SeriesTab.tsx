import { decadeValues, mantissas, nearest, neighbors, SERIES_NAMES, SERIES_TOL, type SeriesName } from '../lib/eseries.ts'
import { encode } from '../lib/bands.ts'
import type { AppState } from '../lib/model.ts'
import { formatErr, formatOhms, formatPct, parseValue } from '../lib/value.ts'
import type { T } from '../i18n.ts'

interface Props {
  state: AppState
  update: (patch: Partial<AppState>) => void
  /** Loads a value into the colour-band tab. */
  show: (ohms: number) => void
  t: T
}

const DECADES = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function SeriesTab({ state, update, show, t }: Props) {
  const { series, decade } = state
  const target = parseValue(state.target)
  const near = target ? nearest(series, target) : null
  const vals = decadeValues(series, decade)
  const rows = target ? SERIES_NAMES.map((s) => ({ s, n: nearest(s, target)!, nb: neighbors(s, target)! })) : []
  const bandsOk = (v: number) => encode(v, 4) !== null
  const shown = (s: SeriesName, v: number) => `${s}: ${formatOhms(v)}`

  return (
    <div className="two">
      <section className="card" aria-label={t('E-series')}>
        <div className="row wrap">
          <div className="field">
            <label>{t('Series')}</label>
            <div className="seg" role="group" aria-label={t('Series')}>
              {SERIES_NAMES.map((s) => (
                <button key={s} className={s === series ? 'on' : ''} aria-pressed={s === series} onClick={() => update({ series: s })}>{s}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="decade">{t('Decade')}</label>
            <select id="decade" value={decade} onChange={(e) => update({ decade: Number(e.target.value) })}>
              {DECADES.map((d) => (
                <option key={d} value={d}>{formatOhms(10 ** d)} – {formatOhms(Number(`9.99e${d}`))}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="hint">{t('{0} values per decade, typical tolerance {1}', mantissas(series).length, formatPct(SERIES_TOL[series]))}</p>
        <div className="grid" role="list">
          {vals.map((v) => (
            <button
              key={v} role="listitem" className={`val${near && near.value === v ? ' on' : ''}`} disabled={!bandsOk(v)}
              title={t('Show bands')} onClick={() => show(v)}
            >
              {formatOhms(v)}
            </button>
          ))}
        </div>
        <p className="hint">{t('Click a value to show its colour bands.')}</p>
      </section>

      <section className="card" aria-label={t('Find nearest standard value')}>
        <h2>{t('Find nearest standard value')}</h2>
        <div className="field">
          <label htmlFor="target">{t('Target value')}</label>
          <input
            id="target" className={state.target && !target ? 'bad' : ''} value={state.target} spellCheck={false} autoComplete="off"
            onChange={(e) => update({ target: e.target.value })} placeholder="5.6k"
          />
        </div>
        {target ? (
          <table className="tbl">
            <thead>
              <tr><th>{t('Series')}</th><th>{t('Below')}</th><th>{t('Nearest')}</th><th>{t('Above')}</th><th>{t('Error')}</th><th /></tr>
            </thead>
            <tbody>
              {rows.map(({ s, n, nb }) => (
                <tr key={s} className={s === series ? 'cur' : ''}>
                  <th scope="row">{s}</th>
                  <td>{formatOhms(nb.below)}</td>
                  <td className="strong">{formatOhms(n.value)}</td>
                  <td>{isFinite(nb.above) ? formatOhms(nb.above) : ''}</td>
                  <td className={Math.abs(n.errorPct) < 1e-7 ? 'ok' : ''}>{Math.abs(n.errorPct) < 1e-7 ? t('Exact') : formatErr(n.errorPct)}</td>
                  <td>
                    <button className="small" title={shown(s, n.value)} disabled={!bandsOk(n.value)} onClick={() => { update({ series: s }); show(n.value) }}>
                      {t('Show bands')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="note err">{t('Enter a target like 5.6k or 3.3M.')}</p>
        )}
      </section>
    </div>
  )
}
