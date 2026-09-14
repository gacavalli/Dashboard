/** Formatação em pt-BR. Datas são strings `YYYY-MM-DD` e formatadas em UTC. */

const LOCALE = "pt-BR"

/** Usada quando a conta não devolve moeda ou devolve um código inválido. */
const FALLBACK_CURRENCY = "BRL"

function safeCurrency(currency: string | undefined): string {
  return currency && /^[A-Z]{3}$/.test(currency) ? currency : FALLBACK_CURRENCY
}

export function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: safeCurrency(currency),
  }).format(value)
}

/** Versão curta para eixos de gráfico (`R$ 12 mil`). */
export function formatCurrencyCompact(value: number, currency: string): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: safeCurrency(currency),
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatInteger(value: number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(
    value
  )
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value)
}

/** `05/09` — rótulo do eixo X. */
export function formatDayShort(isoDate: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${isoDate}T00:00:00.000Z`))
}

/** `05 de set. de 2026` — usado nos tooltips e no resumo do período. */
export function formatDayLong(isoDate: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00.000Z`))
}
