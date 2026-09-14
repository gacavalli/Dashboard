"use client"

import * as React from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Badge } from "@/components/ui/badge"
import { CONTROL_HEIGHT } from "@/components/dashboard/card-style"
import { cn } from "@/lib/utils"
import { ALL_CAMPAIGNS } from "@/lib/dashboard-filters"
import type { MetaCampaign } from "@/lib/meta/types"

interface CampaignOption {
  value: string
  label: string
  status?: string
}

const ALL_OPTION: CampaignOption = {
  value: ALL_CAMPAIGNS,
  label: "Todas as campanhas",
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
}

/**
 * Seletor de campanha.
 *
 * O Base UI usa o formato `{ value, label }` para derivar o texto do input
 * automaticamente, então os itens seguem esse formato.
 */
export function CampaignCombobox({
  campaigns,
  value,
  onChange,
  disabled = false,
}: {
  campaigns: MetaCampaign[]
  value: string | null
  onChange: (campaignId: string | null) => void
  disabled?: boolean
}) {
  const items = React.useMemo<CampaignOption[]>(
    () => [
      ALL_OPTION,
      ...campaigns.map((campaign) => ({
        value: campaign.id,
        label: campaign.name,
        status: campaign.effective_status,
      })),
    ],
    [campaigns]
  )

  const selected =
    items.find((item) => item.value === (value ?? ALL_CAMPAIGNS)) ?? ALL_OPTION

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(next) => {
        const option = next as CampaignOption | null
        onChange(
          !option || option.value === ALL_CAMPAIGNS ? null : option.value
        )
      }}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder="Buscar campanha…"
        aria-label="Campanha"
        disabled={disabled}
        // `className` chega no InputGroup; o input interno tem tamanho próprio
        // (inclusive um `md:text-xs`), então é alcançado por variante aninhada.
        className={cn(
          CONTROL_HEIGHT,
          "campaign-combobox w-full text-base sm:w-96 [&_input]:h-full md:[&_input]:text-base"
        )}
      />
      <ComboboxContent>
        <ComboboxEmpty className="py-3 text-sm">
          Nenhuma campanha encontrada.
        </ComboboxEmpty>
        <ComboboxList className="max-h-[min(24rem,var(--available-height))]">
          {(item: CampaignOption) => (
            <ComboboxItem
              key={item.value}
              value={item}
              className="campaign-combobox-item min-h-10 pr-8 text-base"
            >
              <span className="truncate">{item.label}</span>
              {item.status ? (
                <Badge variant="outline" className="ml-auto shrink-0">
                  {STATUS_LABELS[item.status] ?? item.status}
                </Badge>
              ) : null}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
