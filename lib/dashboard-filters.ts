import {
  DEFAULT_PERIOD,
  daysBetween,
  isPeriodPreset,
  isValidIsoDate,
  resolvePreset,
  type DateRange,
  type PeriodPreset,
} from "@/lib/meta/date-ranges"

/** Valor do seletor de campanha que representa a conta inteira. */
export const ALL_CAMPAIGNS = "all"

/** Teto para intervalos personalizados, alinhado ao limite de linhas por página. */
const MAX_CUSTOM_RANGE_DAYS = 365

export interface DashboardFilters {
  /** `null` = todas as campanhas da conta. */
  campaignId: string | null
  /** `null` = intervalo personalizado. */
  preset: PeriodPreset | null
  range: DateRange
}

export type SearchParams = Record<string, string | string[] | undefined>

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function resolveCustomRange(
  from: string | undefined,
  to: string | undefined,
  today: string
): DateRange | null {
  if (!from || !to || !isValidIsoDate(from) || !isValidIsoDate(to)) {
    return null
  }

  const [since, until] = from <= to ? [from, to] : [to, from]

  // Datas futuras não têm entrega; limitar em "hoje" evita eixos vazios à direita.
  const clampedUntil = until > today ? today : until
  if (since > clampedUntil) {
    return null
  }

  if (daysBetween(since, clampedUntil) + 1 > MAX_CUSTOM_RANGE_DAYS) {
    return null
  }

  return { since, until: clampedUntil }
}

/**
 * Traduz a query string em filtros válidos.
 *
 * Qualquer valor inválido cai silenciosamente no padrão: um link compartilhado
 * com parâmetros estragados deve abrir o dashboard, não uma tela de erro.
 */
export function resolveFilters(
  params: SearchParams,
  today: string
): DashboardFilters {
  const campaignParam = firstValue(params.campaign)
  const campaignId =
    campaignParam && campaignParam !== ALL_CAMPAIGNS ? campaignParam : null

  const customRange = resolveCustomRange(
    firstValue(params.from),
    firstValue(params.to),
    today
  )
  if (customRange) {
    return { campaignId, preset: null, range: customRange }
  }

  const periodParam = firstValue(params.period)
  const preset: PeriodPreset =
    periodParam && isPeriodPreset(periodParam) ? periodParam : DEFAULT_PERIOD

  return { campaignId, preset, range: resolvePreset(preset, today) }
}

export interface FilterUpdate {
  campaignId?: string | null
  preset?: PeriodPreset
  range?: DateRange
}

/** Monta a URL do dashboard para um novo conjunto de filtros. */
export function buildDashboardHref(
  current: DashboardFilters,
  update: FilterUpdate
): string {
  const search = new URLSearchParams()

  const campaignId =
    update.campaignId !== undefined ? update.campaignId : current.campaignId
  if (campaignId) {
    search.set("campaign", campaignId)
  }

  if (update.range) {
    search.set("from", update.range.since)
    search.set("to", update.range.until)
  } else if (update.preset) {
    search.set("period", update.preset)
  } else if (current.preset) {
    search.set("period", current.preset)
  } else {
    search.set("from", current.range.since)
    search.set("to", current.range.until)
  }

  const query = search.toString()
  return query ? `/?${query}` : "/"
}

/** Chave estável usada para remontar o Suspense quando os filtros mudam. */
export function filtersKey(filters: DashboardFilters): string {
  return `${filters.campaignId ?? ALL_CAMPAIGNS}:${filters.range.since}:${filters.range.until}`
}
