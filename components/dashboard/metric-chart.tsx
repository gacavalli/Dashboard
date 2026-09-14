"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  type DotItemDotProps,
} from "recharts"

import { CHART_HEIGHT } from "@/components/dashboard/card-style"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import {
  formatCompact,
  formatCurrency,
  formatCurrencyCompact,
  formatDayLong,
  formatDayShort,
  formatInteger,
} from "@/lib/format"
import type { DailyPoint } from "@/lib/meta/metrics"

export type MetricChartVariant = "area" | "bar" | "line"
export type MetricChartFormat = "currency" | "integer"

type ChartPoint = DotItemDotProps["points"][number]

/**
 * Um vizinho conta como lacuna quando não existe (ponta da série) ou quando o
 * dia não tem valor — no custo por lead, todo dia que não teve lead.
 */
function isGap(point: ChartPoint | undefined): boolean {
  return point == null || point.y == null
}

function CostPerLeadTooltip({
  active,
  payload,
  currency,
  color,
}: {
  active?: boolean
  payload?: Array<{ payload?: DailyPoint }>
  currency: string
  color: string
}) {
  if (!active || !payload?.length) {
    return null
  }

  const point = payload[0]?.payload
  if (!point) {
    return null
  }

  return (
    <div className="grid min-w-[16rem] gap-3 rounded-lg border border-border/50 bg-background px-3.5 py-2.5 text-[0.95rem]/relaxed shadow-xl">
      <div className="text-base font-medium text-foreground">
        {formatDayLong(String(point.date))}
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Gasto</span>
          <span className="font-mono text-base font-medium tabular-nums">
            {formatCurrency(point.spend, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Leads</span>
          <span className="font-mono text-base font-medium tabular-nums">
            {formatInteger(point.leads)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span
              className="size-3 shrink-0 rounded-[2px]"
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground">Custo por lead</span>
          </div>
          <span className="font-mono text-base font-medium tabular-nums">
            {point.costPerLead === null
              ? "—"
              : formatCurrency(point.costPerLead, currency)}
          </span>
        </div>
      </div>
    </div>
  )
}

interface MetricChartProps {
  data: DailyPoint[]
  dataKey: keyof Omit<DailyPoint, "date">
  label: string
  variant: MetricChartVariant
  format: MetricChartFormat
  currency: string
  color: string
}

/**
 * Gráfico de evolução diária de um indicador.
 *
 * A formatação acontece aqui dentro (e não recebe funções por prop) porque este
 * componente é montado por Server Components, que não podem serializar funções.
 */
export function MetricChart({
  data,
  dataKey,
  label,
  variant,
  format,
  currency,
  color,
}: MetricChartProps) {
  const config = React.useMemo<ChartConfig>(
    () => ({ [dataKey]: { label, color } }),
    [dataKey, label, color]
  )

  const formatValue = React.useCallback(
    (value: number | null) => {
      if (value === null || Number.isNaN(value)) {
        return "—"
      }
      return format === "currency"
        ? formatCurrency(value, currency)
        : formatInteger(value)
    },
    [format, currency]
  )

  const formatAxis = React.useCallback(
    (value: number) =>
      format === "currency"
        ? formatCurrencyCompact(value, currency)
        : formatCompact(value),
    [format, currency]
  )

  const fill = `var(--color-${String(dataKey)})`

  /**
   * Bolinha nos pontos que ficariam invisíveis.
   *
   * Área e linha só desenham traço entre dois pontos vizinhos. Um dia cercado de
   * lacunas dos dois lados — o que acontece no custo por lead sempre que os dias
   * ao redor não tiveram lead — não desenha nada e some do gráfico, mesmo tendo
   * valor. A bolinha marca esse dia sem ligar o que não foi contínuo.
   *
   * É ela também que mostra o ponto único do período "Hoje", que pelo mesmo
   * motivo não renderiza traço nenhum.
   */
  const renderIsolatedDot = React.useCallback(
    ({ cx, cy, index, points }: DotItemDotProps) => {
      if (cx == null || cy == null) {
        return null
      }
      if (!isGap(points[index - 1]) || !isGap(points[index + 1])) {
        return null
      }
      return (
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill={fill}
          stroke="var(--card)"
          strokeWidth={2}
        />
      )
    },
    [fill]
  )

  const axes = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="date"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={24}
        tickFormatter={(value: string) => formatDayShort(value)}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        width={72}
        tickFormatter={formatAxis}
      />
      <ChartTooltip
        cursor={false}
        content={
          dataKey === "costPerLead" ? (
            <CostPerLeadTooltip currency={currency} color={color} />
          ) : (
            <ChartTooltipContent
              labelFormatter={(value) => formatDayLong(String(value))}
              className="min-w-44 text-base"
              formatter={(value, _name, item) => (
                <div className="flex w-full items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: item?.color }}
                  />
                  <span className="text-muted-foreground">{label}</span>
                  <span className="ml-auto font-mono font-medium tabular-nums">
                    {formatValue(value === null ? null : Number(value))}
                  </span>
                </div>
              )}
            />
          )
        }
      />
    </>
  )

  return (
    <ChartContainer
      config={config}
      className={cn("aspect-auto w-full text-base", CHART_HEIGHT)}
    >
      {variant === "area" ? (
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{ left: 4, right: 8 }}
        >
          {axes}
          <defs>
            <linearGradient
              id={`fill-${String(dataKey)}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={fill} stopOpacity={0.5} />
              <stop offset="95%" stopColor={fill} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            dataKey={dataKey}
            type="monotone"
            stroke={fill}
            strokeWidth={2}
            fill={`url(#fill-${String(dataKey)})`}
            // Dias sem valor viram lacuna em vez de cair a zero — é o padrão do
            // Recharts, explícito aqui para não depender dele.
            connectNulls={false}
            dot={renderIsolatedDot}
          />
        </AreaChart>
      ) : variant === "bar" ? (
        <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 8 }}>
          {axes}
          <Bar dataKey={dataKey} fill={fill} radius={3} />
        </BarChart>
      ) : (
        <LineChart
          accessibilityLayer
          data={data}
          margin={{ left: 4, right: 8 }}
        >
          {axes}
          <Line
            dataKey={dataKey}
            type="monotone"
            stroke={fill}
            strokeWidth={2}
            dot={renderIsolatedDot}
            // Dias sem lead não têm CPL: a linha fica com lacuna em vez de cair a zero.
            connectNulls={false}
          />
        </LineChart>
      )}
    </ChartContainer>
  )
}
