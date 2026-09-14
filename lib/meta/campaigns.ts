import { metaFetch } from "@/lib/meta/client"
import { requireMetaConfig } from "@/lib/meta/config"
import type { MetaCampaign, MetaListResponse } from "@/lib/meta/types"

const PAGE_SIZE = 200

/** Teto de páginas, para uma conta enorme não estourar o tempo da requisição. */
const MAX_PAGES = 5

/**
 * Campanhas ativas da conta configurada, em ordem alfabética.
 *
 * Pausadas, arquivadas e excluídas ficam de fora: elas poluem o seletor sem
 * contribuir com dados do período. O filtro vai na própria requisição porque a
 * Meta o aplica antes da paginação — filtrar as pausadas depois de receber
 * gastaria o orçamento de páginas com campanhas que seriam descartadas.
 *
 * Para voltar a listar as pausadas, veja o trecho comentado em `effective_status`.
 */
export async function listCampaigns(): Promise<MetaCampaign[]> {
  const { adAccountId } = requireMetaConfig()

  const campaigns: MetaCampaign[] = []
  let after: string | undefined

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await metaFetch<MetaListResponse<MetaCampaign>>(
      `${adAccountId}/campaigns`,
      {
        fields: "id,name,status,effective_status,objective",
        effective_status: JSON.stringify(["ACTIVE"]),
        // Versão anterior, que também trazia as pausadas:
        // effective_status: JSON.stringify(["ACTIVE", "PAUSED"]),
        limit: PAGE_SIZE,
        after,
      }
    )

    const batch = response.data ?? []
    campaigns.push(...batch)

    after = response.paging?.cursors?.after
    if (!response.paging?.next || !after || batch.length === 0) {
      break
    }
  }

  return campaigns.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
}
