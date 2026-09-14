import { requireMetaConfig } from "@/lib/meta/config"
import {
  fromGraphError,
  isRetryable,
  maxAttemptsFor,
  MetaError,
  networkError,
  timeoutError,
  unexpectedError,
  type GraphErrorPayload,
} from "@/lib/meta/errors"

const GRAPH_API = "https://graph.facebook.com"

/**
 * Host do Graph API.
 *
 * `META_GRAPH_HOST` existe só para apontar o app ao mock local (`pnpm mock`)
 * durante o desenvolvimento. Em produção o override é ignorado de propósito:
 * uma variável esquecida no deploy desviaria as chamadas reais sem ninguém
 * perceber.
 */
const GRAPH_HOST =
  (process.env.NODE_ENV !== "production" && process.env.META_GRAPH_HOST) ||
  GRAPH_API

if (GRAPH_HOST !== GRAPH_API) {
  console.warn(
    `[meta] usando host alternativo ${GRAPH_HOST} — os dados exibidos são simulados.`
  )
}

/** Tempo limite por requisição. Acima disso tratamos como indisponibilidade. */
const TIMEOUT_MS = 15_000

/** Janela de cache do Next para as respostas da Meta. */
const REVALIDATE_SECONDS = 300

export const META_CACHE_TAG = "meta"

/** Espera base do backoff exponencial entre tentativas. */
const BACKOFF_BASE_MS = 400

export type MetaFetchParams = Record<string, string | number | undefined>

/**
 * Remove o token de qualquer URL antes de logá-la.
 *
 * Nenhuma mensagem de erro, log ou resposta HTTP deste projeto pode conter o
 * `access_token` — ele é a única credencial do deploy.
 */
function redactUrl(url: URL): string {
  const safe = new URL(url.toString())
  if (safe.searchParams.has("access_token")) {
    safe.searchParams.set("access_token", "***")
  }
  return safe.toString()
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  )
}

/**
 * Lê `estimated_time_to_regain_access` (em minutos) do header de uso por caso de
 * negócio, para dizer ao usuário quanto tempo falta em vez de só "tente depois".
 */
function parseRetryAfterMinutes(response: Response): number | undefined {
  const header = response.headers.get("x-business-use-case-usage")
  if (!header) {
    return undefined
  }

  try {
    const usage: unknown = JSON.parse(header)
    if (typeof usage !== "object" || usage === null) {
      return undefined
    }

    let longest = 0
    for (const entries of Object.values(usage as Record<string, unknown>)) {
      if (!Array.isArray(entries)) {
        continue
      }
      for (const entry of entries) {
        const minutes = (entry as { estimated_time_to_regain_access?: unknown })
          ?.estimated_time_to_regain_access
        if (typeof minutes === "number" && minutes > longest) {
          longest = minutes
        }
      }
    }

    return longest > 0 ? longest : undefined
  } catch {
    return undefined
  }
}

interface GraphEnvelope {
  error?: GraphErrorPayload
}

async function requestOnce<T>(url: URL): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS, tags: [META_CACHE_TAG] },
    })
  } catch (error) {
    throw isTimeout(error) ? timeoutError(error) : networkError(error)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch (error) {
    if (isTimeout(error)) {
      throw timeoutError(error)
    }
    throw fromGraphError(
      {
        message: "A Meta devolveu uma resposta que não pôde ser interpretada.",
      },
      { status: response.status }
    )
  }

  const graphError = (body as GraphEnvelope | null)?.error
  if (graphError || !response.ok) {
    throw fromGraphError(graphError ?? {}, {
      status: response.status,
      retryAfterMinutes: parseRetryAfterMinutes(response),
    })
  }

  return body as T
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Faz uma chamada ao Graph API já tratada: token injetado, tempo limite,
 * retentativa com backoff e erros normalizados.
 */
export async function metaFetch<T>(
  path: string,
  params: MetaFetchParams = {}
): Promise<T> {
  const config = requireMetaConfig()

  const url = new URL(`${GRAPH_HOST}/${config.apiVersion}/${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  }
  url.searchParams.set("access_token", config.accessToken)

  let attempt = 0
  for (;;) {
    attempt += 1
    try {
      return await requestOnce<T>(url)
    } catch (caught) {
      const error =
        caught instanceof MetaError ? caught : unexpectedError(caught)

      if (!isRetryable(error) || attempt >= maxAttemptsFor(error)) {
        console.error(
          `[meta] ${error.info.kind} em ${redactUrl(url)}: ${error.message}`
        )
        throw error
      }

      await delay(BACKOFF_BASE_MS * 2 ** (attempt - 1))
    }
  }
}
