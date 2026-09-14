import { NextResponse } from "next/server"

import { getAccount } from "@/lib/meta/account"
import { listCampaigns } from "@/lib/meta/campaigns"
import { readMetaConfig } from "@/lib/meta/config"
import { httpStatusFor, toMetaErrorInfo } from "@/lib/meta/errors"

/**
 * Diagnóstico da integração.
 *
 * Serve para validar o token logo após o deploy sem abrir o dashboard. Nunca
 * ecoa o `access_token` — apenas o que a Meta respondeu sobre a conta.
 */
export async function GET() {
  const config = readMetaConfig()
  if (!config.ok) {
    return NextResponse.json(
      {
        ok: false,
        kind: "config",
        message: "Variáveis de ambiente ausentes.",
        missing: config.missing,
      },
      { status: 500 }
    )
  }

  try {
    const [account, campaigns] = await Promise.all([
      getAccount(),
      listCampaigns(),
    ])

    return NextResponse.json({
      ok: true,
      apiVersion: config.config.apiVersion,
      account: {
        id: account.id,
        name: account.name,
        currency: account.currency,
        timezone_name: account.timezone_name,
      },
      campaigns: campaigns.length,
    })
  } catch (caught) {
    const info = toMetaErrorInfo(caught)
    return NextResponse.json(
      {
        ok: false,
        kind: info.kind,
        title: info.title,
        message: info.message,
        hint: info.hint,
        fbtraceId: info.fbtraceId,
      },
      { status: httpStatusFor(info.kind) }
    )
  }
}
