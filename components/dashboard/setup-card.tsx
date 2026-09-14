import { DEFAULT_API_VERSION } from "@/lib/meta/config"
import { DASHBOARD_CARD } from "@/components/dashboard/card-style"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const VARIABLES = [
  {
    name: "META_ACCESS_TOKEN",
    required: true,
    description:
      "Token de System User com a permissão ads_read. Tokens de System User não expiram.",
  },
  {
    name: "META_AD_ACCOUNT_ID",
    required: true,
    description: "ID da conta de anúncios, com ou sem o prefixo act_.",
  },
  {
    name: "META_API_VERSION",
    required: false,
    description: `Opcional. Padrão: ${DEFAULT_API_VERSION}.`,
  },
]

/**
 * Tela exibida enquanto o deploy não tem credenciais.
 *
 * É o primeiro contato de quem vai publicar o dashboard, então lista exatamente
 * o que precisa ser definido — nada além disso é necessário para o painel
 * começar a funcionar.
 */
export function SetupCard({ missing }: { missing: string[] }) {
  const missingSet = new Set(missing)

  return (
    <Card className={DASHBOARD_CARD}>
      <CardHeader>
        <CardTitle className="text-base">Configuração pendente</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <p className="text-muted-foreground">
          Defina as variáveis de ambiente abaixo no deploy (ou em um arquivo
          <span className="font-mono"> .env.local</span> durante o
          desenvolvimento) e recarregue a página. Não há login da Meta a fazer.
        </p>

        <dl className="flex flex-col gap-3">
          {VARIABLES.map((variable) => (
            <div key={variable.name} className="flex flex-col gap-1">
              <dt className="flex items-center gap-2 font-mono text-sm">
                {variable.name}
                {missingSet.has(variable.name) ? (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-sans text-xs font-medium text-destructive">
                    faltando
                  </span>
                ) : variable.required ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-sans text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    definida
                  </span>
                ) : null}
              </dt>
              <dd className="text-muted-foreground">{variable.description}</dd>
            </div>
          ))}
        </dl>

        <p className="text-muted-foreground">
          Depois de configurar, abra{" "}
          <span className="font-mono">/api/meta/health</span> para confirmar que
          o token enxerga a conta.
        </p>
      </CardContent>
    </Card>
  )
}
