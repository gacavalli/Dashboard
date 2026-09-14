import { metaFetch } from "@/lib/meta/client"
import { requireMetaConfig } from "@/lib/meta/config"
import type { MetaAccount } from "@/lib/meta/types"

/**
 * Dados da conta de anúncios configurada.
 *
 * A moeda vem daqui (em vez de ser fixada no código) e o fuso é o que define o
 * que é "hoje" para a Meta.
 */
export async function getAccount(): Promise<MetaAccount> {
  const { adAccountId } = requireMetaConfig()
  return metaFetch<MetaAccount>(adAccountId, {
    fields: "id,name,currency,timezone_name",
  })
}
