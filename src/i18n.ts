import { roles, type BandCount, type ColorKey } from './lib/bands.ts'
import type { Lang } from './lib/model.ts'

export type T = (s: string, ...args: (string | number)[]) => string

/** Marks a string for translation where it is defined away from its t() call. */
export const N = (s: string) => s

/** English source string -> Ukrainian. `{0}`, `{1}` are placeholders for interpolated values. */
export const UK: Record<string, string> = {
  'Resistor colour code': 'Кольорове маркування резисторів',
  'Colour bands, SMD codes and E-series values, both directions.': 'Кольорові смуги, SMD-коди та ряди E: в обидва боки.',
  'Values are read per IEC 60062. Always confirm with a multimeter.': 'Значення читаються за IEC 60062. Завжди перевіряйте мультиметром.',
  'Source on GitHub': 'Код на GitHub',
  Language: 'Мова',
  Theme: 'Тема',
  System: 'Системна',
  Light: 'Світла',
  Dark: 'Темна',
  'Colour bands': 'Кольорові смуги',
  'SMD codes': 'SMD-коди',
  'E-series': 'Ряди E',
  Bands: 'Смуги',
  '{0} bands': '{0} смуги',
  Value: 'Номінал',
  Tolerance: 'Допуск',
  Reverse: 'Розвернути',
  'Reading from the wrong end? Reverse the bands.': 'Читаєте з неправильного боку? Розверніть смуги.',
  'Click a band, then pick its colour.': 'Натисніть смугу, потім виберіть колір.',
  'Band {0}': 'Смуга {0}',
  'Selected band: {0}': 'Вибрана смуга: {0}',
  '1st digit': '1-ша цифра',
  '2nd digit': '2-га цифра',
  '3rd digit': '3-тя цифра',
  Multiplier: 'Множник',
  'Temp. coefficient': 'Темп. коефіцієнт',
  'tolerance (none)': 'допуск (немає)',
  Resistance: 'Опір',
  Range: 'Діапазон',
  'Temperature coefficient': 'Температурний коефіцієнт',
  'Standard value in {0}': 'Стандартне значення в {0}',
  'Not a standard E-series value.': 'Не стандартне значення рядів E.',
  'Invalid colour in this position. Try Reverse.': 'Недопустимий колір у цій позиції. Спробуйте «Розвернути».',
  'Enter a value like 4.7k, 4k7, 470 or 2M2.': 'Введіть значення, як-от 4.7k, 4k7, 470 або 2M2.',
  'Out of range for colour bands (0.01 Ω to 999 GΩ).': 'Поза діапазоном кольорових смуг (0,01 Ω – 999 GΩ).',
  'Needs more digits than {0} bands can show. Nearest: {1}.': 'Потрібно більше цифр, ніж можуть показати {0} смуги. Найближче: {1}.',
  'Switch to {0} bands': 'Перейти на {0} смуги',
  Black: 'Чорний',
  Brown: 'Коричневий',
  Red: 'Червоний',
  Orange: 'Помаранчевий',
  Yellow: 'Жовтий',
  Green: 'Зелений',
  Blue: 'Синій',
  Violet: 'Фіолетовий',
  Grey: 'Сірий',
  White: 'Білий',
  Gold: 'Золотий',
  Silver: 'Срібний',
  None: 'Немає',
  'Code to value': 'Код у номінал',
  'Value to code': 'Номінал у код',
  'Marking on the resistor': 'Маркування на резисторі',
  'Value to mark': 'Номінал для маркування',
  'Examples:': 'Приклади:',
  '3-digit': '3 цифри',
  '4-digit': '4 цифри',
  'R notation': 'Запис через R',
  'EIA-96': 'EIA-96',
  'Typical tolerance {0}': 'Типовий допуск {0}',
  'Not a valid SMD code.': 'Недійсний SMD-код.',
  'No exact SMD marking for this value.': 'Для цього номіналу немає точного SMD-маркування.',
  'The R is the decimal point: 4R7 = 4.7 Ω.': 'R — десяткова кома: 4R7 = 4,7 Ω.',
  'Last digit is the number of zeros: 472 = 47 × 10² Ω.': 'Остання цифра — кількість нулів: 472 = 47 × 10² Ω.',
  'Two digits pick a value from the E96 table, the letter is the multiplier.': 'Дві цифри — значення з таблиці E96, літера — множник.',
  Series: 'Ряд',
  Decade: 'Декада',
  'Find nearest standard value': 'Знайти найближче стандартне значення',
  'Target value': 'Бажаний номінал',
  Below: 'Менше',
  Nearest: 'Найближче',
  Above: 'Більше',
  Error: 'Похибка',
  'Use': 'Взяти',
  'Show bands': 'Показати смуги',
  '{0} values per decade, typical tolerance {1}': '{0} значень на декаду, типовий допуск {1}',
  'Click a value to show its colour bands.': 'Натисніть значення, щоб побачити його смуги.',
  'Enter a target like 5.6k or 3.3M.': 'Введіть значення, як-от 5.6k або 3.3M.',
  Exact: 'Точно',
}

export function tr(lang: Lang, s: string, ...args: (string | number)[]): string {
  const src = lang === 'uk' ? (UK[s] ?? s) : s
  return src.replace(/\{(\d+)\}/g, (_, i: string) => String(args[+i]))
}


export const COLOR_NAME: Record<ColorKey, string> = {
  black: N('Black'), brown: N('Brown'), red: N('Red'), orange: N('Orange'), yellow: N('Yellow'), green: N('Green'),
  blue: N('Blue'), violet: N('Violet'), grey: N('Grey'), white: N('White'), gold: N('Gold'), silver: N('Silver'), none: N('None'),
}

const ROLE_NAME = { d1: N('1st digit'), d2: N('2nd digit'), d3: N('3rd digit'), mult: N('Multiplier'), tol: N('Tolerance'), ppm: N('Temp. coefficient') }

export function bandRoleName(count: BandCount, i: number): string {
  const r = roles(count)[i]
  if (r === 'digit') return [ROLE_NAME.d1, ROLE_NAME.d2, ROLE_NAME.d3][i]
  return r === 'mult' ? ROLE_NAME.mult : r === 'tol' ? ROLE_NAME.tol : ROLE_NAME.ppm
}

