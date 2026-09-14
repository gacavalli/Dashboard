// KPI de evolução (desativado): imports usados só pelo `DeltaBadge`.
// import {
//   ArrowDownRightIcon,
//   ArrowRightIcon,
//   ArrowUpRightIcon,
// } from "lucide-react"

// import { cn } from "@/lib/utils"
// import { formatPercent } from "@/lib/format"
import { DASHBOARD_CARD } from "@/components/dashboard/card-style"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Indicador principal do período.
 *
 * A comparação contra o período anterior está desativada por ora. Para voltar
 * a exibir, descomente os trechos marcados com "KPI de evolução (desativado)"
 * aqui e em `components/dashboard/metrics-section.tsx` — é lá que fica a
 * chamada ao Graph API que busca os totais do período anterior.
 *
 * Em custo por lead, cair é bom — daí `lowerIsBetter`, que inverte só a cor, não
 * o sinal do número.
 */
export function KpiCard({
  label,
  value,
  caption,
  // KPI de evolução (desativado):
  // delta,
  // lowerIsBetter = false,
}: {
  label: string
  value: string
  caption?: string
  // KPI de evolução (desativado):
  // delta: number | null
  // lowerIsBetter?: boolean
}) {
  return (
    <Card className={DASHBOARD_CARD}>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-1">
        <span className="font-heading text-4xl font-medium break-words tabular-nums">
          {value}
        </span>
        {/* KPI de evolução (desativado): */}
        {/* <DeltaBadge delta={delta} lowerIsBetter={lowerIsBetter} /> */}
        {caption ? (
          <span className="text-base break-words text-muted-foreground">
            {caption}
          </span>
        ) : null}
      </CardContent>
    </Card>
  )
}

// KPI de evolução (desativado): variação percentual contra o período anterior.
/*
function DeltaBadge({
  delta,
  lowerIsBetter,
}: {
  delta: number | null
  lowerIsBetter: boolean
}) {
  if (delta === null) {
    return (
      <span className="text-base text-muted-foreground">
        Sem base de comparação
      </span>
    )
  }

  const flat = Math.abs(delta) < 0.005
  const good = lowerIsBetter ? delta < 0 : delta > 0
  const Icon = flat
    ? ArrowRightIcon
    : delta > 0
      ? ArrowUpRightIcon
      : ArrowDownRightIcon

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-base tabular-nums",
        flat
          ? "text-muted-foreground"
          : good
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-destructive"
      )}
    >
      <Icon className="size-4" />
      {formatPercent(Math.abs(delta))}
      <span className="text-muted-foreground">vs. período anterior</span>
    </span>
  )
}
*/
