/**
 * Erros da integração com a Meta.
 *
 * Toda falha — de env faltando a queda de rede — é convertida em um `MetaError`
 * carregando um `MetaErrorInfo` serializável, para que Server Components possam
 * repassá-lo a componentes de UI sem depender do boundary de erro do Next (que
 * apaga a mensagem em produção).
 */

export type MetaErrorKind =
  | "config"
  | "network"
  | "timeout"
  | "auth"
  | "permission"
  | "rate_limit"
  | "api"

export interface MetaErrorInfo {
  kind: MetaErrorKind
  /** Título curto exibido no cartão de erro. */
  title: string
  /** Explicação em uma ou duas frases, em pt-BR. */
  message: string
  /** O que o usuário pode fazer para resolver. */
  hint?: string
  /** Identificador do Graph API, útil para abrir suporte com a Meta. */
  fbtraceId?: string
  /** Variáveis de ambiente ausentes (apenas para `kind: "config"`). */
  missing?: string[]
  /** Minutos estimados até o limite de requisições ser liberado. */
  retryAfterMinutes?: number
}

export class MetaError extends Error {
  readonly info: MetaErrorInfo
  /** Status HTTP da resposta do Graph, quando houve resposta. */
  readonly status?: number

  constructor(
    info: MetaErrorInfo,
    options?: { status?: number; cause?: unknown }
  ) {
    super(info.message, { cause: options?.cause })
    this.name = "MetaError"
    this.info = info
    this.status = options?.status
  }
}

/** Códigos de erro do Graph API agrupados por significado. */
const AUTH_CODES = new Set([102, 190, 463, 467])
const PERMISSION_CODES = new Set([3, 10, 200, 272, 294])
const RATE_LIMIT_CODES = new Set([4, 17, 32, 613, 80000, 80004])

export interface GraphErrorPayload {
  message?: string
  type?: string
  code?: number
  error_subcode?: number
  error_user_title?: string
  error_user_msg?: string
  fbtrace_id?: string
}

export function configError(missing: string[]): MetaError {
  return new MetaError({
    kind: "config",
    title: "Configuração incompleta",
    message:
      "As credenciais da Meta ainda não foram definidas neste ambiente, então não há como buscar os dados das campanhas.",
    hint: "Defina as variáveis listadas abaixo nas configurações do deploy e recarregue a página.",
    missing,
  })
}

export function networkError(cause: unknown): MetaError {
  return new MetaError(
    {
      kind: "network",
      title: "Sem conexão com a Meta",
      message:
        "Não foi possível conectar aos servidores da Meta. Isso costuma ser falha de rede do servidor ou instabilidade momentânea da API.",
      hint: "Verifique sua conexão e tente novamente em alguns instantes.",
    },
    { cause }
  )
}

export function timeoutError(cause?: unknown): MetaError {
  return new MetaError(
    {
      kind: "timeout",
      title: "A Meta demorou para responder",
      message:
        "A requisição passou do tempo limite antes de a Meta devolver os dados. Períodos longos com muitas campanhas costumam ser a causa.",
      hint: "Tente novamente ou selecione um período menor.",
    },
    { cause }
  )
}

function rateLimitError(
  graphError: GraphErrorPayload,
  retryAfterMinutes: number | undefined,
  status: number | undefined
): MetaError {
  const wait =
    retryAfterMinutes && retryAfterMinutes > 0
      ? ` Tente novamente em cerca de ${retryAfterMinutes} minuto${retryAfterMinutes > 1 ? "s" : ""}.`
      : " Tente novamente em alguns minutos."

  return new MetaError(
    {
      kind: "rate_limit",
      title: "Limite de requisições atingido",
      message: `A conta de anúncios excedeu o limite de chamadas da API de insights.${wait}`,
      hint: "A Meta recomenda pausar as chamadas até o limite ser liberado — insistir aumenta o tempo de espera.",
      fbtraceId: graphError.fbtrace_id,
      retryAfterMinutes,
    },
    { status }
  )
}

/** Converte o envelope de erro do Graph API na nossa hierarquia. */
export function fromGraphError(
  graphError: GraphErrorPayload,
  options: { status?: number; retryAfterMinutes?: number } = {}
): MetaError {
  const code = graphError.code ?? 0
  const { status, retryAfterMinutes } = options

  if (RATE_LIMIT_CODES.has(code)) {
    return rateLimitError(graphError, retryAfterMinutes, status)
  }

  if (AUTH_CODES.has(code) || status === 401) {
    return new MetaError(
      {
        kind: "auth",
        title: "Token inválido ou expirado",
        message:
          "A Meta recusou o token de acesso configurado neste ambiente. Tokens de usuário expiram; tokens de System User não.",
        hint: "Gere um novo token de System User com a permissão ads_read e atualize META_ACCESS_TOKEN no deploy.",
        fbtraceId: graphError.fbtrace_id,
      },
      { status }
    )
  }

  if (PERMISSION_CODES.has(code)) {
    return new MetaError(
      {
        kind: "permission",
        title: "Sem permissão para esta conta",
        message:
          "O token é válido, mas não tem acesso a esta conta de anúncios ou não possui a permissão ads_read.",
        hint: "Confirme o valor de META_AD_ACCOUNT_ID e se o System User foi adicionado à conta no Gerenciador de Negócios.",
        fbtraceId: graphError.fbtrace_id,
      },
      { status }
    )
  }

  const detail = graphError.error_user_msg ?? graphError.message

  return new MetaError(
    {
      kind: "api",
      title: graphError.error_user_title ?? "Erro ao consultar a Meta",
      message: detail
        ? detail
        : "A Meta devolveu um erro inesperado ao consultar os dados das campanhas.",
      hint: "Se o problema persistir, informe o código de rastreio abaixo ao suporte da Meta.",
      fbtraceId: graphError.fbtrace_id,
    },
    { status }
  )
}

export function unexpectedError(cause: unknown): MetaError {
  return new MetaError(
    {
      kind: "api",
      title: "Erro inesperado",
      message:
        "Algo deu errado ao carregar os dados das campanhas. O erro foi registrado no log do servidor.",
      hint: "Tente novamente. Se continuar, verifique os logs do deploy.",
    },
    { cause }
  )
}

/** Normaliza qualquer valor lançado em um `MetaErrorInfo` exibível. */
export function toMetaErrorInfo(error: unknown): MetaErrorInfo {
  if (error instanceof MetaError) {
    return error.info
  }
  return unexpectedError(error).info
}

/** Erros que podem melhorar se a requisição for repetida. */
export function isRetryable(error: MetaError): boolean {
  if (error.info.kind === "network" || error.info.kind === "timeout") {
    return true
  }
  if (error.info.kind === "rate_limit") {
    return true
  }
  return error.info.kind === "api" && (error.status ?? 0) >= 500
}

/** Quantas tentativas totais (incluindo a primeira) vale a pena fazer. */
export function maxAttemptsFor(error: MetaError): number {
  return error.info.kind === "rate_limit" ? 2 : 3
}

const STATUS_BY_KIND: Record<MetaErrorKind, number> = {
  config: 500,
  network: 503,
  timeout: 504,
  auth: 401,
  permission: 403,
  rate_limit: 429,
  api: 502,
}

export function httpStatusFor(kind: MetaErrorKind): number {
  return STATUS_BY_KIND[kind]
}
