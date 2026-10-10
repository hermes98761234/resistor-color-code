import { COLORS, roles, type BandCount, type ColorKey, type Role } from '../lib/bands.ts'
import { bandRoleName, COLOR_NAME, type T } from '../i18n.ts'

/** Band centre x positions (viewBox 0..460) per band count. */
const X: Record<BandCount, number[]> = {
  3: [125, 165, 205],
  4: [120, 160, 200, 320],
  5: [112, 146, 180, 214, 320],
  6: [106, 138, 170, 202, 300, 334],
}
const CAPTION: Record<Role, string> = { digit: '', mult: '×', tol: '±', ppm: 'ppm' }

interface Props {
  colors: ColorKey[]
  selected: number
  onSelect: (i: number) => void
  t: T
}

export default function Resistor({ colors, selected, onSelect, t }: Props) {
  const count = colors.length as BandCount
  const rs = roles(count)
  const xs = X[count]
  let digit = 0
  return (
    <svg className="resistor" viewBox="0 0 460 150" role="group" aria-label={t('Colour bands')}>
      <defs>
        <clipPath id="rbody">
          <rect x="96" y="44" width="268" height="62" rx="8" />
          <rect x="82" y="30" width="56" height="90" rx="26" />
          <rect x="322" y="30" width="56" height="90" rx="26" />
        </clipPath>
        <linearGradient id="rshade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      <line x1="6" y1="75" x2="100" y2="75" className="lead" />
      <line x1="360" y1="75" x2="454" y2="75" className="lead" />
      <g clipPath="url(#rbody)">
        <rect x="80" y="28" width="300" height="94" className="rbody" />
        {colors.map((c, i) => {
          if (c === 'none') return null
          return <rect key={i} x={xs[i] - 9} y="28" width="18" height="94" fill={COLORS[c].hex} />
        })}
        <rect x="80" y="28" width="300" height="94" fill="url(#rshade)" />
      </g>
      <g className="rbody-outline">
        <rect x="96" y="44" width="268" height="62" rx="8" />
      </g>
      {colors.map((c, i) => {
        const role = rs[i]
        const cap = role === 'digit' ? String(++digit) : CAPTION[role]
        const label = `${t('Band {0}', i + 1)}: ${t(bandRoleName(count, i))}, ${t(COLOR_NAME[c])}`
        return (
          <g
            key={i}
            className={`band${i === selected ? ' sel' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={label}
            aria-pressed={i === selected}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(i)
              }
            }}
          >
            <rect x={xs[i] - 14} y="14" width="28" height="122" rx="6" className="hit" />
            {c === 'none' && <rect x={xs[i] - 9} y="28" width="18" height="94" className="none-band" />}
            <rect x={xs[i] - 14} y="14" width="28" height="122" rx="6" className="ring" />
            <text x={xs[i]} y="148" textAnchor="middle" className="cap">{cap}</text>
          </g>
        )
      })}
      {count === 3 && (
        <text x="320" y="80" textAnchor="middle" className="cap faint">±20%</text>
      )}
    </svg>
  )
}
