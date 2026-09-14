"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"

import { CampaignCombobox } from "@/components/dashboard/campaign-combobox"
import { PeriodPicker } from "@/components/dashboard/period-picker"
import { useOnline } from "@/components/dashboard/online-status"
import {
  buildDashboardHref,
  type DashboardFilters,
} from "@/lib/dashboard-filters"
import type { DateRange, PeriodPreset } from "@/lib/meta/date-ranges"
import type { MetaCampaign } from "@/lib/meta/types"

/**
 * Barra de filtros.
 *
 * Os filtros vivem na URL: o estado atual chega pronto do servidor e cada
 * alteração é uma navegação, então qualquer visão do dashboard é
 * compartilhável por link.
 */
export function FiltersBar({
  filters,
  campaigns,
  today,
  children,
}: {
  filters: DashboardFilters
  campaigns: MetaCampaign[]
  /** "Hoje" no fuso da conta de anúncios. */
  today: string
  children?: React.ReactNode
}) {
  const router = useRouter()
  const online = useOnline()
  const [pending, startTransition] = React.useTransition()

  // Offline, navegar só produziria erro de rede.
  const disabled = !online

  const navigate = React.useCallback(
    (href: string) => {
      startTransition(() => {
        router.replace(href, { scroll: false })
      })
    },
    [router]
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <CampaignCombobox
            campaigns={campaigns}
            value={filters.campaignId}
            disabled={disabled}
            onChange={(campaignId) =>
              navigate(buildDashboardHref(filters, { campaignId }))
            }
          />
          {pending ? (
            <Loader2Icon
              className="size-4 animate-spin text-muted-foreground"
              aria-label="Carregando"
            />
          ) : null}
        </div>

        <PeriodPicker
          preset={filters.preset}
          range={filters.range}
          today={today}
          disabled={disabled}
          onPresetChange={(preset: PeriodPreset) =>
            navigate(buildDashboardHref(filters, { preset }))
          }
          onRangeChange={(range: DateRange) =>
            navigate(buildDashboardHref(filters, { range }))
          }
        />
      </div>
      {children}
    </div>
  )
}
