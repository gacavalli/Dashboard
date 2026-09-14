import { metaFetch } from "@/lib/meta/client"
import { requireMetaConfig } from "@/lib/meta/config"
import type { DateRange } from "@/lib/meta/date-ranges"
import type { MetaInsightsRow, MetaListResponse } from "@/lib/meta/types"

/**
 * Campos pedidos ao endpoint de insights.
 *
 * `unique_actions` e `cost_per_unique_action_type` ficam de fora de propósito: a
 * Meta reduziu esses campos a quatro action types e eles não servem para leads.
 */
const INSIGHTS_FIELDS = [
  "spend",
  "impressions",
  "clicks",
  "actions",
  "cost_per_action_type",
  "date_start",
  "date_stop",
].join(",")

/** 90 dias diários cabem folgados; evita paginação na série. */
const ROW_LIMIT = 500

export interface InsightsQuery {
  /** `null` agrega a conta inteira. */
  campaignId: string | null
  range: DateRange
  /** `true` devolve uma linha por dia (`time_increment=1`). */
  daily: boolean
}

/**
 * Insights do período pedido.
 *
 * `action_attribution_windows` fica no padrão da conta de propósito, para os
 * números baterem com o que o Gerenciador de Anúncios mostra.
 */
export async function getInsights({
  campaignId,
  range,
  daily,
}: InsightsQuery): Promise<MetaInsightsRow[]> {
  const { adAccountId } = requireMetaConfig()

  const path = campaignId ? `${campaignId}/insights` : `${adAccountId}/insights`

  const response = await metaFetch<MetaListResponse<MetaInsightsRow>>(path, {
    fields: INSIGHTS_FIELDS,
    time_range: JSON.stringify({ since: range.since, until: range.until }),
    level: campaignId ? "campaign" : "account",
    limit: ROW_LIMIT,
    time_increment: daily ? 1 : undefined,
  })

  return response.data ?? []
}
