import { Suspense } from "react"
import Image from "next/image"

import {
  DashboardSkeleton,
  FiltersSkeleton,
} from "@/components/dashboard/dashboard-skeleton"
import { ErrorCard } from "@/components/dashboard/error-card"
import { FiltersSection } from "@/components/dashboard/filters-section"
import { MetricsSection } from "@/components/dashboard/metrics-section"
import { OnlineProvider } from "@/components/dashboard/online-status"
import { SetupCard } from "@/components/dashboard/setup-card"
import { Logo } from "@/components/logo"
import {
  filtersKey,
  resolveFilters,
  type SearchParams,
} from "@/lib/dashboard-filters"
import { getAccount } from "@/lib/meta/account"
import { readMetaConfig } from "@/lib/meta/config"
import { todayInTimeZone } from "@/lib/meta/date-ranges"
import { toMetaErrorInfo } from "@/lib/meta/errors"
import type { MetaAccount } from "@/lib/meta/types"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const config = readMetaConfig()

  return (
    <OnlineProvider>
      <main className="mx-auto flex w-full max-w-[1800px] flex-col gap-7 p-5 text-base sm:gap-8 sm:p-8">
        <header className="flex items-center gap-5">
          <Logo className="h-12 sm:h-14" />
          <div className="flex flex-col gap-1">
            <h1 className="flex flex-wrap items-center gap-2 font-heading text-xl font-medium sm:text-2xl">
              <span>Campanhas</span>
              <span className="inline-flex items-center">
                <Image
                  src="/logo_meta_black.svg"
                  alt="Meta"
                  width={50}
                  height={11}
                  className="h-5.5 w-auto dark:hidden"
                />
                <Image
                  src="/logo_meta.svg"
                  alt=""
                  aria-hidden="true"
                  width={61}
                  height={14}
                  className="hidden h-5.5 w-auto dark:block"
                />
              </span>
              <span>Ads</span>
            </h1>
            <p className="text-base text-muted-foreground">
              Gasto, leads e custo por lead por campanha e período.
            </p>
          </div>
        </header>

        {config.ok ? (
          <Suspense fallback={<DashboardSkeleton />}>
            <Dashboard params={params} />
          </Suspense>
        ) : (
          <SetupCard missing={config.missing} />
        )}
      </main>
    </OnlineProvider>
  )
}

/**
 * A conta é a única dependência realmente bloqueante: a moeda e o fuso dela
 * definem como os períodos são resolvidos e como os valores são formatados.
 */
async function Dashboard({ params }: { params: SearchParams }) {
  let account: MetaAccount
  try {
    account = await getAccount()
  } catch (caught) {
    return <ErrorCard info={toMetaErrorInfo(caught)} />
  }

  const today = todayInTimeZone(account.timezone_name)
  const filters = resolveFilters(params, today)

  return (
    <div className="flex flex-col gap-7">
      <Suspense fallback={<FiltersSkeleton />}>
        <FiltersSection filters={filters} today={today} />
      </Suspense>

      <Suspense key={filtersKey(filters)} fallback={<DashboardSkeleton />}>
        <MetricsSection
          filters={filters}
          currency={account.currency}
          timeZone={account.timezone_name}
        />
      </Suspense>

      <footer className="text-base text-muted-foreground">
        {account.name} · {account.currency} · fuso {account.timezone_name}
      </footer>
    </div>
  )
}
