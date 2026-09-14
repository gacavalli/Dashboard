import { eachDay, type DateRange } from "@/lib/meta/date-ranges"
import type { MetaActionStat, MetaInsightsRow } from "@/lib/meta/types"

/**
 * Fontes de lead usadas pelo painel.
 *
 * A Meta expõe a contagem em action types separados; para esta visão, usamos as
 * fontes relevantes para leads, em vez de confiar no action type agregado
 * `lead`.
 *
 * Mantemos a regra antiga comentada abaixo para facilitar reversão rápida caso
 * a Meta altere o comportamento ou seja necessário comparar com o dashboard
 * anterior.
 */
const LEAD_ACTION_TYPES = new Set([
  "offsite_conversion.fb_pixel_lead",
  "messaging_conversation_started_7d",
])
// export const LEAD_ACTION_TYPE = "lead"

export interface MetricTotals {
  spend: number
  leads: number
  /** `null` quando não houve lead no período — nunca `Infinity` ou `NaN`. */
  costPerLead: number | null
  impressions: number
  clicks: number
}

export interface DailyPoint {
  date: string
  spend: number
  leads: number
  costPerLead: number | null
}

function toNumber(value: string | undefined): number {
  if (!value) {
    return 0
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function countLeads(actions: MetaActionStat[] | undefined): number {
  if (!actions) {
    return 0
  }

  // Regra antiga, mantida como referência para reversão rápida:
  // const lead = actions.find((action) => action.action_type === LEAD_ACTION_TYPE)
  // return Math.round(toNumber(lead?.value))

  const totalLeads = actions.reduce((sum, action) => {
    if (!LEAD_ACTION_TYPES.has(action.action_type)) {
      return sum
    }

    return sum + toNumber(action.value)
  }, 0)

  return Math.round(totalLeads)
}

/**
 * Custo por lead.
 *
 * Sempre derivado de gasto ÷ leads, tanto no total quanto por dia. Somar
 * `cost_per_action_type` entre linhas daria um número errado, porque média de
 * médias não é a média do conjunto.
 */
export function costPerLead(spend: number, leads: number): number | null {
  return leads > 0 ? spend / leads : null
}

export function aggregate(rows: MetaInsightsRow[]): MetricTotals {
  const totals = rows.reduce(
    (accumulator, row) => ({
      spend: accumulator.spend + toNumber(row.spend),
      leads: accumulator.leads + countLeads(row.actions),
      impressions: accumulator.impressions + toNumber(row.impressions),
      clicks: accumulator.clicks + toNumber(row.clicks),
    }),
    { spend: 0, leads: 0, impressions: 0, clicks: 0 }
  )

  return { ...totals, costPerLead: costPerLead(totals.spend, totals.leads) }
}

/**
 * Série diária completa: dias sem entrega entram zerados para o gráfico não
 * "pular" datas e sugerir uma continuidade que não existiu.
 */
export function toDailySeries(
  rows: MetaInsightsRow[],
  range: DateRange
): DailyPoint[] {
  const byDate = new Map<string, MetaInsightsRow>()
  for (const row of rows) {
    byDate.set(row.date_start, row)
  }

  return eachDay(range).map((date) => {
    const row = byDate.get(date)
    const spend = toNumber(row?.spend)
    const leads = countLeads(row?.actions)
    return { date, spend, leads, costPerLead: costPerLead(spend, leads) }
  })
}

/**
 * Variação relativa entre dois períodos.
 *
 * Devolve `null` quando o período anterior foi zero: "aumento infinito" não é
 * informação útil para quem está lendo o painel.
 */
export function computeDelta(
  current: number | null,
  previous: number | null
): number | null {
  if (current === null || previous === null || previous === 0) {
    return null
  }
  return (current - previous) / previous
}
