/**
 * Intervalos de datas no fuso da conta de anúncios.
 *
 * A Meta resolve períodos no fuso configurado na conta, não no do servidor. Toda
 * a aritmética aqui é feita sobre strings `YYYY-MM-DD` ancoradas em UTC, para
 * que o relógio da máquina que renderiza a página não desloque os resultados.
 */

/**
 * Presets exibidos no seletor de período, nesta ordem.
 *
 * A lista é a fonte única: dela saem os botões, o tipo `PeriodPreset` e a
 * validação do parâmetro `period` da URL. Reativar um preset é descomentar a
 * linha aqui **e** o caso correspondente em `resolvePreset`.
 */
export const PERIOD_PRESETS = [
  { id: "today", label: "Hoje" },
  // Presets desativados:
  // { id: "yesterday", label: "Ontem" },
  // { id: "last_7d", label: "7 dias" },
  // { id: "last_14d", label: "14 dias" },
  // { id: "last_30d", label: "30 dias" },
  // { id: "last_90d", label: "90 dias" },
  { id: "this_month", label: "Este mês" },
  { id: "last_month", label: "Mês passado" },
] as const

export type PeriodPreset = (typeof PERIOD_PRESETS)[number]["id"]

export const DEFAULT_PERIOD: PeriodPreset = "today"
// Padrão anterior, de quando "30 dias" era uma das opções:
// export const DEFAULT_PERIOD: PeriodPreset = "last_30d"

const PRESET_IDS = new Set<string>(PERIOD_PRESETS.map((preset) => preset.id))

export interface DateRange {
  /** Primeiro dia do intervalo, inclusivo (`YYYY-MM-DD`). */
  since: string
  /** Último dia do intervalo, inclusivo (`YYYY-MM-DD`). */
  until: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const MS_PER_DAY = 86_400_000

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

function toIso(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

function toUtcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`)
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) {
    return false
  }
  const parsed = toUtcDate(value)
  return !Number.isNaN(parsed.getTime()) && toIso(parsed) === value
}

export function addDays(iso: string, days: number): string {
  return toIso(new Date(toUtcDate(iso).getTime() + days * MS_PER_DAY))
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (toUtcDate(to).getTime() - toUtcDate(from).getTime()) / MS_PER_DAY
  )
}

/** Número de dias do intervalo, contando as duas pontas. */
export function rangeLengthInDays(range: DateRange): number {
  return daysBetween(range.since, range.until) + 1
}

function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`
}

function endOfMonth(iso: string): string {
  const date = toUtcDate(iso)
  return toIso(
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
  )
}

function startOfMonthOffset(iso: string, months: number): string {
  const date = toUtcDate(iso)
  return toIso(
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
  )
}

/**
 * Mesma data, N meses adiante ou atrás.
 *
 * O dia é preso ao último dia do mês de destino quando ele não existe lá —
 * 31 de março menos um mês vira 28 (ou 29) de fevereiro, e não 3 de março.
 */
function shiftIsoByMonths(iso: string, months: number): string {
  const date = toUtcDate(iso)
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1)
  )
  const lastDayOfTarget = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate()

  return toIso(
    new Date(
      Date.UTC(
        target.getUTCFullYear(),
        target.getUTCMonth(),
        Math.min(date.getUTCDate(), lastDayOfTarget)
      )
    )
  )
}

/**
 * Desloca o intervalo inteiro em N meses, mantendo os dias das duas pontas.
 *
 * Usado pelos botões de navegação ao lado do seletor de período: a duração
 * escolhida é preservada, só a janela anda no tempo.
 */
export function shiftRangeByMonths(
  range: DateRange,
  months: number
): DateRange {
  return {
    since: shiftIsoByMonths(range.since, months),
    until: shiftIsoByMonths(range.until, months),
  }
}

/**
 * "Hoje" segundo o fuso da conta de anúncios (ex.: `America/Sao_Paulo`).
 * `en-CA` produz exatamente `YYYY-MM-DD`.
 */
export function todayInTimeZone(timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  } catch {
    // Fuso desconhecido: cai para UTC em vez de derrubar a página.
    return toIso(new Date())
  }
}

/** Converte um preset em intervalo concreto, relativo ao "hoje" da conta. */
export function resolvePreset(preset: PeriodPreset, today: string): DateRange {
  switch (preset) {
    case "today":
      return { since: today, until: today }
    // Presets desativados — descomente junto com `PERIOD_PRESETS`:
    // case "yesterday": {
    //   const yesterday = addDays(today, -1)
    //   return { since: yesterday, until: yesterday }
    // }
    // case "last_7d":
    //   return { since: addDays(today, -6), until: today }
    // case "last_14d":
    //   return { since: addDays(today, -13), until: today }
    // case "last_30d":
    //   return { since: addDays(today, -29), until: today }
    // case "last_90d":
    //   return { since: addDays(today, -89), until: today }
    case "this_month":
      return { since: startOfMonth(today), until: today }
    case "last_month": {
      const firstOfLastMonth = startOfMonthOffset(startOfMonth(today), -1)
      return { since: firstOfLastMonth, until: endOfMonth(firstOfLastMonth) }
    }
  }
}

/** Intervalo imediatamente anterior, de mesma duração, para comparar KPIs. */
export function previousRange(range: DateRange): DateRange {
  const length = rangeLengthInDays(range)
  const until = addDays(range.since, -1)
  return { since: addDays(until, -(length - 1)), until }
}

/** Todos os dias do intervalo, para preencher lacunas na série do gráfico. */
export function eachDay(range: DateRange): string[] {
  const days: string[] = []
  const total = rangeLengthInDays(range)
  for (let index = 0; index < total; index += 1) {
    days.push(addDays(range.since, index))
  }
  return days
}

export function isPeriodPreset(value: string): value is PeriodPreset {
  return PRESET_IDS.has(value)
}

export function presetLabel(preset: PeriodPreset): string {
  return PERIOD_PRESETS.find((item) => item.id === preset)?.label ?? preset
}
