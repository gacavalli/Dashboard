import { InboxIcon } from "lucide-react"

import { DASHBOARD_CARD } from "@/components/dashboard/card-style"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Ausência de dados não é erro.
 *
 * Um período sem entrega ou uma conta sem campanhas precisa de um texto próprio;
 * gráficos zerados dariam a impressão de que algo quebrou.
 */
export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card className={DASHBOARD_CARD}>
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <InboxIcon className="size-4" />
        </span>
        <p className="font-heading text-base font-medium">{title}</p>
        <p className="max-w-md text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
