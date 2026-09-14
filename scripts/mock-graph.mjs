/**
 * Mock local do Graph API da Meta.
 *
 * Serve para rodar o dashboard sem token real: responde aos mesmos endpoints
 * que `lib/meta/` consome (conta, campanhas e insights) com dados sintéticos
 * mas plausíveis.
 *
 * Uso:
 *   pnpm mock
 *   # em outro terminal, com .env.local apontando META_GRAPH_HOST para cá:
 *   pnpm dev
 *
 * Variáveis:
 *   MOCK_PORT   porta do servidor (padrão 8799)
 *   MOCK_ERROR  simula uma falha: "auth", "rate_limit" ou "server".
 *               Útil para ver os cartões de erro que não dá para reproduzir
 *               de outro jeito (o limite de requisições, principalmente).
 */
import http from "node:http"

const PORT = Number(process.env.MOCK_PORT ?? 8799)
const ERROR_MODE = process.env.MOCK_ERROR ?? ""

const ACCOUNT = {
  id: "act_123456789",
  name: "Conta de teste (mock)",
  currency: "BRL",
  timezone_name: "America/Sao_Paulo",
}

const CAMPAIGNS = [
  {
    id: "120210000000001",
    name: "Leads | Institucional",
    status: "ACTIVE",
    effective_status: "ACTIVE",
    objective: "OUTCOME_LEADS",
  },
  {
    id: "120210000000002",
    name: "Leads | Remarketing",
    status: "PAUSED",
    effective_status: "PAUSED",
    objective: "OUTCOME_LEADS",
  },
  {
    id: "120210000000003",
    name: "Awareness | Marca",
    status: "ACTIVE",
    effective_status: "ACTIVE",
    objective: "OUTCOME_AWARENESS",
  },
]

/** Envelopes de erro no mesmo formato que a Meta devolve. */
const ERRORS = {
  auth: {
    status: 400,
    body: {
      error: {
        message: "Error validating access token: Session has expired.",
        type: "OAuthException",
        code: 190,
        error_subcode: 463,
        fbtrace_id: "MockTraceAuth00001",
      },
    },
  },
  rate_limit: {
    status: 400,
    headers: {
      "x-business-use-case-usage": JSON.stringify({
        123456789: [
          {
            type: "ads_insights",
            call_count: 100,
            total_cputime: 100,
            total_time: 100,
            estimated_time_to_regain_access: 12,
          },
        ],
      }),
    },
    body: {
      error: {
        message:
          "(#80000) There have been too many calls from this ad-account.",
        type: "OAuthException",
        code: 80000,
        fbtrace_id: "MockTraceRate00001",
      },
    },
  },
  server: {
    status: 500,
    body: {
      error: {
        message:
          "An unexpected error has occurred. Please retry your request later.",
        type: "OAuthException",
        code: 2,
        fbtrace_id: "MockTraceServer0001",
      },
    },
  },
}

const MS_PER_DAY = 86_400_000

function eachDay(since, until) {
  const days = []
  const end = new Date(`${until}T00:00:00Z`).getTime()
  for (
    let t = new Date(`${since}T00:00:00Z`).getTime();
    t <= end;
    t += MS_PER_DAY
  ) {
    days.push(new Date(t).toISOString().slice(0, 10))
  }
  return days
}

/**
 * Linha de insights de um dia.
 *
 * O padrão é determinístico e inclui de propósito dois casos de borda que o
 * dashboard precisa tratar: um dia sem nenhuma entrega (a Meta simplesmente não
 * devolve a linha) e um dia com gasto e zero leads (custo por lead indefinido).
 */
function rowFor(date, seed) {
  const n = (Number(date.slice(-2)) + seed) % 7

  // Sem entrega: a Meta omite o dia da resposta.
  if (n === 3) {
    return null
  }

  const spend = 120 + n * 45
  const clicks = 60 + n * 25
  // Gasto sem lead nenhum.
  const leads = n === 5 ? 0 : 2 + n * 3

  const row = {
    date_start: date,
    date_stop: date,
    spend: spend.toFixed(2),
    impressions: String(4000 + n * 900),
    clicks: String(clicks),
    actions: [{ action_type: "link_click", value: String(clicks) }],
  }

  if (leads > 0) {
    const fbPixelLead = Math.max(1, Math.round(leads * 0.7))
    const messagingLead = Math.max(0, leads - fbPixelLead)

    row.actions.push(
      {
        action_type: "offsite_conversion.fb_pixel_lead",
        value: String(fbPixelLead),
      },
      {
        action_type: "onsite_conversion.messaging_conversation_started_7d",
        value: String(messagingLead),
      }
    )

    row.cost_per_action_type = [
      {
        action_type: "offsite_conversion.fb_pixel_lead",
        value: (spend / Math.max(fbPixelLead, 1)).toFixed(2),
      },
      {
        action_type: "onsite_conversion.messaging_conversation_started_7d",
        value: (spend / Math.max(messagingLead, 1)).toFixed(2),
      },
    ]
  }

  return row
}

function totalsRow(rows, range) {
  const LEAD_ACTION_TYPES = new Set([
    "offsite_conversion.fb_pixel_lead",
    "onsite_conversion.messaging_conversation_started_7d",
  ])

  const total = rows.reduce(
    (acc, row) => {
      const leads = (row.actions ?? []).reduce((sum, action) => {
        if (!LEAD_ACTION_TYPES.has(action.action_type)) {
          return sum
        }
        return sum + Number(action.value ?? 0)
      }, 0)

      return {
        spend: acc.spend + Number(row.spend),
        impressions: acc.impressions + Number(row.impressions),
        clicks: acc.clicks + Number(row.clicks),
        leads: acc.leads + leads,
      }
    },
    { spend: 0, impressions: 0, clicks: 0, leads: 0 }
  )

  return {
    date_start: range.since,
    date_stop: range.until,
    spend: total.spend.toFixed(2),
    impressions: String(total.impressions),
    clicks: String(total.clicks),
    actions: [
      {
        action_type: "offsite_conversion.fb_pixel_lead",
        value: String(total.leads),
      },
      {
        action_type: "onsite_conversion.messaging_conversation_started_7d",
        value: "0",
      },
    ],
  }
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "application/json", ...headers })
  res.end(JSON.stringify(body))
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost")
  // Remove o prefixo de versão (`/v25.0/`) para casar só o recurso.
  const path = url.pathname.replace(/^\/v\d+\.\d+\//, "")

  console.log(`[mock] ${req.method} /${path}`)

  const failure = ERRORS[ERROR_MODE]
  if (failure) {
    console.log(`[mock] respondendo com falha simulada: ${ERROR_MODE}`)
    send(res, failure.status, failure.body, failure.headers)
    return
  }

  if (path.endsWith("/insights")) {
    const timeRange = url.searchParams.get("time_range")
    if (!timeRange) {
      send(res, 400, {
        error: {
          message: "time_range ausente",
          code: 100,
          type: "OAuthException",
        },
      })
      return
    }

    const range = JSON.parse(timeRange)
    const daily = url.searchParams.get("time_increment") === "1"
    // Uma campanha específica rende números diferentes dos da conta inteira.
    const seed = path.startsWith("act_") ? 0 : 2

    const rows = eachDay(range.since, range.until)
      .map((date) => rowFor(date, seed))
      .filter(Boolean)

    if (daily) {
      send(res, 200, { data: rows })
      return
    }

    send(res, 200, { data: rows.length ? [totalsRow(rows, range)] : [] })
    return
  }

  if (path.endsWith("/campaigns")) {
    // A Meta aplica `effective_status` na origem, antes da paginação; o mock faz
    // o mesmo para o seletor local refletir o que o dashboard vai receber.
    const statuses = url.searchParams.get("effective_status")
    const allowed = statuses ? JSON.parse(statuses) : null
    const data = allowed
      ? CAMPAIGNS.filter((campaign) =>
          allowed.includes(campaign.effective_status)
        )
      : CAMPAIGNS

    send(res, 200, { data, paging: { cursors: { after: "mock" } } })
    return
  }

  send(res, 200, ACCOUNT)
})

server.listen(PORT, () => {
  console.log(`[mock] Graph API simulado em http://127.0.0.1:${PORT}`)
  console.log(`[mock] aponte META_GRAPH_HOST para esse endereço no .env.local`)
  if (ERROR_MODE) {
    console.log(`[mock] MOCK_ERROR=${ERROR_MODE}: toda requisição vai falhar`)
  }
})
