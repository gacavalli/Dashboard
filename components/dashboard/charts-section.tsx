import { DASHBOARD_CARD } from "@/components/dashboard/card-style"
import { MetricChart } from "@/components/dashboard/metric-chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DailyPoint } from "@/lib/meta/metrics"

const CHARTS = [
  {
    dataKey: "spend",
    title: "Gasto por dia",
    description: "Investimento diário no período.",
    variant: "area",
    format: "currency",
    color: "var(--chart-1)",
  },
  {
    dataKey: "leads",
    title: "Leads por dia",
    description: "Leads do pixel do site e conversas iniciadas somados.",
    variant: "bar",
    format: "integer",
    color: "var(--chart-2)",
  },
  {
    dataKey: "costPerLead",
    title: "Custo por lead",
    description: "Gasto ÷ leads do dia. Dias sem lead ficam sem área.",
    variant: "area",
    format: "currency",
    color: "var(--chart-3)",
  },
] as const

export function ChartsSection({
  series,
  currency,
}: {
  series: DailyPoint[]
  currency: string
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      {CHARTS.map((chart) => (
        <Card key={chart.dataKey} className={DASHBOARD_CARD}>
          <CardHeader>
            <CardTitle className="text-lg">{chart.title}</CardTitle>
            <CardDescription className="text-base">
              {chart.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetricChart
              data={series}
              dataKey={chart.dataKey}
              label={chart.title}
              variant={chart.variant}
              format={chart.format}
              currency={currency}
              color={chart.color}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
