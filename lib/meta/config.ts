import { configError } from "@/lib/meta/errors"

/**
 * Versão do Marketing API usada por padrão.
 *
 * A v25.0 é a mais recente no momento (a v23.0 já expirou). Pode ser sobrescrita
 * por `META_API_VERSION` sem alterar o código.
 */
export const DEFAULT_API_VERSION = "v25.0"

export interface MetaConfig {
  accessToken: string
  /** Sempre no formato `act_<id>`. */
  adAccountId: string
  apiVersion: string
}

export type MetaConfigResult =
  { ok: true; config: MetaConfig } | { ok: false; missing: string[] }

function normalizeAdAccountId(value: string): string {
  const trimmed = value.trim()
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`
}

function normalizeApiVersion(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) {
    return DEFAULT_API_VERSION
  }
  return trimmed.startsWith("v") ? trimmed : `v${trimmed}`
}

/**
 * Lê as variáveis de ambiente sem lançar erro, para a página conseguir exibir a
 * tela de configuração em vez de quebrar.
 */
export function readMetaConfig(): MetaConfigResult {
  const accessToken = process.env.META_ACCESS_TOKEN?.trim()
  const adAccountId = process.env.META_AD_ACCOUNT_ID?.trim()

  const missing: string[] = []
  if (!accessToken) {
    missing.push("META_ACCESS_TOKEN")
  }
  if (!adAccountId) {
    missing.push("META_AD_ACCOUNT_ID")
  }

  if (!accessToken || !adAccountId) {
    return { ok: false, missing }
  }

  return {
    ok: true,
    config: {
      accessToken,
      adAccountId: normalizeAdAccountId(adAccountId),
      apiVersion: normalizeApiVersion(process.env.META_API_VERSION),
    },
  }
}

/** Igual a `readMetaConfig`, mas lança `MetaError` quando falta configuração. */
export function requireMetaConfig(): MetaConfig {
  const result = readMetaConfig()
  if (!result.ok) {
    throw configError(result.missing)
  }
  return result.config
}
