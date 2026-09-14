import { RetryButton } from "@/components/dashboard/retry-button"

/**
 * Marca de atualização dos dados.
 *
 * As respostas da Meta ficam em cache por alguns minutos, então convém deixar
 * claro que o painel não é tempo real — e oferecer o recarregamento manual.
 *
 * O horário é formatado no fuso da conta de anúncios, o mesmo que define os
 * períodos. Isso mantém o painel coerente e evita divergência de hidratação,
 * que aconteceria se servidor e navegador usassem cada um o seu fuso local.
 */
export function LastUpdated({
  timestamp,
  timeZone,
}: {
  timestamp: number
  timeZone: string
}) {
  let label: string
  try {
    label = new Intl.DateTimeFormat("pt-BR", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp))
  } catch {
    label = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp))
  }

  return (
    <div className="flex items-center gap-2 text-base text-muted-foreground">
      <span>Atualizado às {label}</span>
      <RetryButton label="Atualizar" variant="ghost" />
    </div>
  )
}
