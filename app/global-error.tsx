"use client"

/**
 * Último recurso: uma falha no próprio root layout.
 *
 * Substitui o layout inteiro, então precisa das próprias tags `html` e `body` e
 * não pode depender de nada que venha do layout (fontes, provider de tema).
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fff",
          color: "#171717",
        }}
      >
        <div style={{ display: "grid", gap: 12, maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>
            Não foi possível carregar o dashboard
          </h1>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              margin: 0,
              color: "#525252",
            }}
          >
            Ocorreu uma falha inesperada na aplicação. Tente novamente; se
            persistir, verifique os logs do deploy.
          </p>
          {error.digest ? (
            <code style={{ fontSize: 11, color: "#737373" }}>
              digest: {error.digest}
            </code>
          ) : null}
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              justifySelf: "start",
              height: 30,
              padding: "0 12px",
              borderRadius: 6,
              border: "1px solid #d4d4d4",
              background: "#fafafa",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
