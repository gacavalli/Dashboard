import {
  CloudOffIcon,
  KeyRoundIcon,
  LockIcon,
  SettingsIcon,
  TimerIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { MetaErrorInfo, MetaErrorKind } from "@/lib/meta/errors"
import { Card, CardContent } from "@/components/ui/card"
import { DASHBOARD_CARD } from "@/components/dashboard/card-style"
import { RetryButton } from "@/components/dashboard/retry-button"

const ICONS: Record<MetaErrorKind, LucideIcon> = {
  config: SettingsIcon,
  network: CloudOffIcon,
  timeout: TimerIcon,
  auth: KeyRoundIcon,
  permission: LockIcon,
  rate_limit: TimerIcon,
  api: TriangleAlertIcon,
}

/**
 * Cartão de erro para qualquer falha já classificada.
 *
 * Os Server Components capturam o erro e renderizam este cartão em vez de
 * deixá-lo subir: em produção o boundary do Next substituiria a mensagem por um
 * digest, e o usuário ficaria sem saber o que aconteceu.
 */
export function ErrorCard({
  info,
  className,
  showRetry = true,
  onRetry,
}: {
  info: MetaErrorInfo
  className?: string
  showRetry?: boolean
  /** Recuperação alternativa (o `unstable_retry` dos boundaries do Next). */
  onRetry?: () => void
}) {
  const Icon = ICONS[info.kind]

  return (
    <Card className={cn(DASHBOARD_CARD, className)} role="alert">
      <CardContent className="flex flex-col items-start gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <Icon className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-base font-medium">{info.title}</p>
            <p className="text-muted-foreground">{info.message}</p>
            {info.hint ? (
              <p className="text-muted-foreground">{info.hint}</p>
            ) : null}
          </div>
        </div>

        {info.missing?.length ? (
          <ul className="flex flex-col gap-1 rounded-md bg-muted px-4 py-3 font-mono text-sm">
            {info.missing.map((variable) => (
              <li key={variable}>{variable}</li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-center gap-3">
          {showRetry ? <RetryButton onRetry={onRetry} /> : null}
          {info.fbtraceId ? (
            <span className="font-mono text-xs text-muted-foreground">
              fbtrace_id: {info.fbtraceId}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

/** Variante compacta, para falhas parciais dentro da barra de filtros. */
export function InlineError({
  info,
  className,
}: {
  info: MetaErrorInfo
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-wrap items-center gap-2 text-sm text-muted-foreground",
        className
      )}
    >
      <TriangleAlertIcon className="size-4 text-destructive" />
      <span>{info.title}.</span>
      <RetryButton label="Tentar novamente" variant="ghost" />
    </div>
  )
}
