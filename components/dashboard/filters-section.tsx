import { FiltersBar } from "@/components/dashboard/filters-bar"
import { InlineError } from "@/components/dashboard/error-card"
import type { DashboardFilters } from "@/lib/dashboard-filters"
import { listCampaigns } from "@/lib/meta/campaigns"
import { toMetaErrorInfo, type MetaErrorInfo } from "@/lib/meta/errors"
import type { MetaCampaign } from "@/lib/meta/types"

/**
 * Carrega a lista de campanhas para o seletor.
 *
 * A falha é contida aqui de propósito: se a listagem cair, o dashboard ainda
 * mostra os indicadores da conta inteira, com o erro sinalizado ao lado do
 * seletor.
 */
export async function FiltersSection({
  filters,
  today,
}: {
  filters: DashboardFilters
  today: string
}) {
  let campaigns: MetaCampaign[] = []
  let error: MetaErrorInfo | null = null

  try {
    campaigns = await listCampaigns()
  } catch (caught) {
    error = toMetaErrorInfo(caught)
  }

  return (
    <FiltersBar filters={filters} campaigns={campaigns} today={today}>
      {error ? (
        <InlineError info={error} />
      ) : campaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma campanha ativa ou pausada nesta conta de anúncios.
        </p>
      ) : null}
    </FiltersBar>
  )
}
