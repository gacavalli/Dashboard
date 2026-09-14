"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CloudOffIcon, WifiIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const OnlineContext = React.createContext(true)

/** `false` enquanto o navegador estiver sem conexão. */
export function useOnline(): boolean {
  return React.useContext(OnlineContext)
}

function subscribeToConnection(onChange: () => void) {
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)
  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}

/**
 * Observa o estado de conexão do navegador.
 *
 * Sem rede, navegar entre filtros só produziria erro — por isso o estado é
 * compartilhado por contexto e a barra de filtros se desabilita. Ao voltar a
 * conexão os dados são recarregados automaticamente, e o aviso de reconexão
 * fica visível exatamente enquanto esse recarregamento acontece.
 */
export function OnlineProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [refreshing, startRefresh] = React.useTransition()

  const online = React.useSyncExternalStore(
    subscribeToConnection,
    () => navigator.onLine,
    () => true
  )

  const wasOffline = React.useRef(false)

  React.useEffect(() => {
    if (!online) {
      wasOffline.current = true
      return
    }
    if (wasOffline.current) {
      wasOffline.current = false
      startRefresh(() => {
        router.refresh()
      })
    }
  }, [online, router])

  return (
    <OnlineContext.Provider value={online}>
      <ConnectionBanner online={online} refreshing={refreshing} />
      {children}
    </OnlineContext.Provider>
  )
}

function ConnectionBanner({
  online,
  refreshing,
}: {
  online: boolean
  refreshing: boolean
}) {
  if (online && !refreshing) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium",
        online
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive"
      )}
    >
      {online ? (
        <>
          <WifiIcon className="size-4" />
          Conexão restabelecida — atualizando os dados.
        </>
      ) : (
        <>
          <CloudOffIcon className="size-4" />
          Sem conexão com a internet. Os dados exibidos podem estar
          desatualizados.
        </>
      )}
    </div>
  )
}
