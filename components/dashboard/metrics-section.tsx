import { ChartsSection } from "@/components/dashboard/charts-section"
import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorCard } from "@/components/dashboard/error-card"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { LastUpdated } from "@/components/dashboard/last-updated"
import type { DashboardFilters } from "@/lib/dashboard-filters"
import { formatCurrency, formatDayLong, formatInteger } from "@/lib/format"
// KPI de evolução (desativado):
// import { previousRange } from "@/lib/meta/date-ranges"
import { toMetaErrorInfo, type MetaErrorInfo } from "@/lib/meta/errors"
import { getInsights } from "@/lib/meta/insights"
import {
  aggregate,
  toDailySeries,
  // KPI de evolução (desativado):
  // computeDelta,
  // type MetricTotals,
} from "@/lib/meta/metrics"
import type { MetaInsightsRow } from "@/lib/meta/types"

type CurrentResult =
  { ok: true; rows: MetaInsightsRow[] } | { ok: false; info: MetaErrorInfo }

interface LoadedMetrics {
  current: CurrentResult
  // KPI de evolução (desativado):
  // /** `null` quando a comparação falhou — os indicadores seguem sem deltas. */
  // previousTotals: MetricTotals | null
  fetchedAt: number
}

/**
 * Série diária do período selecionado.
 *
 * Enquanto o KPI de evolução está desativado há uma única chamada: buscar os
 * totais do período anterior seria uma requisição ao Graph API por
 * carregamento cujo resultado ninguém exibe, e cada requisição conta no limite
 * de taxa da conta. A versão com as duas chamadas está logo abaixo, comentada,
 * para voltar junto com o indicador de variação.
 */
async function loadMetrics(filters: DashboardFilters): Promise<LoadedMetrics> {
  const current = await getInsights({
    campaignId: filters.campaignId,
    range: filters.range,
    daily: true,
  })
    .then<CurrentResult>((rows) => ({ ok: true, rows }))
    .catch<CurrentResult>((caught) => ({
      ok: false,
      info: toMetaErrorInfo(caught),
    }))

  return { current, fetchedAt: Date.now() }
}

// KPI de evolução (desativado): duas chamadas em paralelo — a série diária do
// período atual e os totais do período anterior. A comparação era secundária:
// se ela falhasse sozinha, os indicadores continuavam aparecendo, apenas sem a
// variação.
/*
async function loadMetrics(filters: DashboardFilters): Promise<LoadedMetrics> {
  const previous = previousRange(filters.range)

  const [current, previousTotals] = await Promise.all([
    getInsights({
      campaignId: filters.campaignId,
      range: filters.range,
      daily: true,
    })
      .then<CurrentResult>((rows) => ({ ok: true, rows }))
      .catch<CurrentResult>((caught) => ({
        ok: false,
        info: toMetaErrorInfo(caught),
      })),
    getInsights({
      campaignId: filters.campaignId,
      range: previous,
      daily: false,
    })
      .then<MetricTotals | null>((rows) => aggregate(rows))
      .catch<MetricTotals | null>(() => null),
  ])

  return { current, previousTotals, fetchedAt: Date.now() }
}
*/

export async function MetricsSection({
  filters,
  currency,
  timeZone,
}: {
  filters: DashboardFilters
  currency: string
  timeZone: string
}) {
  const { current, fetchedAt } = await loadMetrics(filters)

  if (!current.ok) {
    return <ErrorCard info={current.info} />
  }

  const totals = aggregate(current.rows)
  const series = toDailySeries(current.rows, filters.range)
  const hasData = current.rows.length > 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base text-muted-foreground">
          {formatDayLong(filters.range.since)} até{" "}
          {formatDayLong(filters.range.until)}
        </p>
        <LastUpdated timestamp={fetchedAt} timeZone={timeZone} />
      </div>

      <div className="grid min-w-0 gap-5 md:grid-cols-3">
        <KpiCard
          label="Gasto total"
          value={formatCurrency(totals.spend, currency)}
          // KPI de evolução (desativado):
          // delta={computeDelta(totals.spend, previousTotals?.spend ?? null)}
        />
        <KpiCard
          label="Leads"
          value={formatInteger(totals.leads)}
          caption={`${formatInteger(totals.clicks)} cliques · ${formatInteger(totals.impressions)} impressões`}
          // KPI de evolução (desativado):
          // delta={computeDelta(totals.leads, previousTotals?.leads ?? null)}
        />
        <KpiCard
          label="Custo por lead"
          value={
            totals.costPerLead === null
              ? "—"
              : formatCurrency(totals.costPerLead, currency)
          }
          caption={
            totals.costPerLead === null && totals.spend > 0
              ? "Houve gasto sem nenhum lead atribuído no período."
              : undefined
          }
          // KPI de evolução (desativado):
          // delta={computeDelta(
          //   totals.costPerLead,
          //   previousTotals?.costPerLead ?? null
          // )}
          // lowerIsBetter
        />
      </div>

      {hasData ? (
        <ChartsSection series={series} currency={currency} />
      ) : (
        <EmptyState
          title="Sem dados no período selecionado"
          description="Nenhuma entrega foi registrada para esta seleção. Tente ampliar o período ou escolher outra campanha."
        />
      )}
    </div>
  )
}
