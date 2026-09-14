"use client"

import * as React from "react"

import { ErrorCard } from "@/components/dashboard/error-card"

/**
 * Rede de segurança para exceções não previstas.
 *
 * O caminho normal é o Server Component capturar o erro e renderizar um
 * `ErrorCard` com a mensagem certa — em produção o Next substitui a mensagem
 * original por um digest, então aqui só resta um texto genérico e o retry.
 */
export default function ErrorBoundary({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <ErrorCard
        info={{
          kind: "api",
          title: "Algo deu errado",
          message:
            "O dashboard não conseguiu carregar. Pode ter sido uma falha temporária de rede ou da API da Meta.",
          hint: "Tente novamente. Se continuar, verifique /api/meta/health e os logs do deploy.",
          fbtraceId: error.digest,
        }}
        onRetry={unstable_retry}
      />
    </main>
  )
}
