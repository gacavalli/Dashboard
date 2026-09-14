"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, RotateCwIcon } from "lucide-react"

import { CONTROL_HEIGHT } from "@/components/dashboard/card-style"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Recarrega os dados do servidor sem recarregar a página inteira.
 *
 * Aceita um `onRetry` para casos em que o Next oferece uma recuperação própria
 * (o `unstable_retry` dos boundaries de erro).
 */
export function RetryButton({
  label = "Tentar novamente",
  onRetry,
  variant = "outline",
}: {
  label?: string
  onRetry?: () => void
  variant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  function handleClick() {
    startTransition(() => {
      if (onRetry) {
        onRetry()
      } else {
        router.refresh()
      }
    })
  }

  return (
    <Button
      variant={variant}
      className={cn(CONTROL_HEIGHT, "px-3 text-sm")}
      onClick={handleClick}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <Loader2Icon className="animate-spin" data-icon="inline-start" />
      ) : (
        <RotateCwIcon data-icon="inline-start" />
      )}
      {pending ? "Atualizando…" : label}
    </Button>
  )
}
