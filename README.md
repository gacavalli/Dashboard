# Dashboard de campanhas Meta Ads

Painel de performance das campanhas de anúncios da Meta: **gasto total**,
**volume de leads** e **custo por lead**, com seletor de campanha, períodos
predefinidos ou intervalo personalizado, e gráficos de evolução diária.

Construído com Next.js (App Router), Tailwind v4 e shadcn/ui no style
`base-mira` (Base UI). Os gráficos usam Recharts através do componente `chart`
do shadcn.

## Configuração

Não há fluxo OAuth: o dashboard usa um token de System User definido no
ambiente. Copie `.env.example` para `.env.local` (ou defina as variáveis no
deploy):

| Variável             | Obrigatória | Descrição                                                                           |
| -------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `META_ACCESS_TOKEN`  | sim         | Token de System User com a permissão `ads_read`. Tokens de System User não expiram. |
| `META_AD_ACCOUNT_ID` | sim         | ID da conta de anúncios, com ou sem o prefixo `act_`.                               |
| `META_API_VERSION`   | não         | Versão do Marketing API. Padrão: `v25.0`.                                           |

Nenhuma delas usa o prefixo `NEXT_PUBLIC_` — o token nunca chega ao navegador.

Enquanto as variáveis não estiverem definidas, a página exibe uma tela de
configuração listando exatamente o que falta, em vez de quebrar.

### Gerando o token

No Gerenciador de Negócios: **Configurações do negócio → Usuários do sistema →
Gerar novo token**, com a permissão `ads_read` e acesso à conta de anúncios
desejada. Para uso interno na própria conta não é necessária revisão de app.

### Validando o deploy

Abra `/api/meta/health`. A resposta traz nome, moeda e fuso da conta, além da
quantidade de campanhas encontradas — ou o erro exato (token inválido, sem
permissão, limite de requisições, rede) com o status HTTP correspondente. O
token nunca aparece na resposta.

## Como os dados são lidos

- **Endpoint**: `/{versão}/act_<id>/insights` para a conta inteira e
  `/{versão}/<campaign_id>/insights` quando uma campanha é selecionada.
- **Leads**: soma de dois `action_type` — **`offsite_conversion.fb_pixel_lead`**
  (leads do pixel do site) e
  **`onsite_conversion.messaging_conversation_started_7d`** (conversas iniciadas
  por mensagem: WhatsApp, Messenger e Direct). São eventos distintos, então a
  soma não duplica contagem. O nome precisa ser exato, com o prefixo — a
  comparação é por igualdade. O `action_type` agregado `lead` não é mais usado.
- **Custo por lead**: sempre calculado como `gasto ÷ leads`, no total e por dia.
  Somar `cost_per_action_type` entre períodos daria um número errado.
- **Fuso**: os períodos são resolvidos no fuso da conta (`timezone_name`), que é
  o mesmo critério da Meta — não no fuso do servidor.
- **Janela de atribuição**: fica no padrão da conta, para os números baterem com
  o Gerenciador de Anúncios.
- **Cache**: as respostas ficam em cache por 5 minutos; o cabeçalho do painel
  mostra o horário da última atualização e um botão para recarregar.

## Estados de erro

Toda falha tem mensagem própria na interface, com botão de tentar novamente:
configuração incompleta, token inválido ou expirado, sem permissão na conta,
limite de requisições da API (com o tempo estimado de espera), falha de rede,
tempo limite excedido e erro genérico da Meta com `fbtrace_id`.

Perda de conexão do navegador mostra um aviso fixo no topo e desabilita os
filtros; ao voltar a conexão os dados são recarregados automaticamente.

Falhas parciais são isoladas: se a listagem de campanhas falhar, os indicadores
da conta continuam carregando; se a comparação com o período anterior falhar, os
indicadores aparecem sem os deltas.

## Desenvolvimento

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm typecheck
pnpm lint
pnpm build
```

### Testando sem token da Meta

`scripts/mock-graph.mjs` sobe um Graph API simulado, com conta, campanhas e
insights sintéticos — o suficiente para ver os indicadores, os gráficos e o
seletor de campanha funcionando.

1. Em um terminal: `pnpm mock` (sobe em `http://127.0.0.1:8799`).
2. Crie um `.env.local`:

   ```bash
   META_ACCESS_TOKEN=token-de-mentira
   META_AD_ACCOUNT_ID=123456789
   META_GRAPH_HOST=http://127.0.0.1:8799
   ```

3. Em outro terminal: `pnpm dev`.

`META_GRAPH_HOST` só tem efeito fora de produção — no deploy o override é
ignorado, para que uma variável esquecida não desvie as chamadas reais. Quando
ele está ativo, o servidor registra um aviso no terminal informando que os dados
são simulados.

Os dados do mock incluem de propósito os casos de borda que o painel precisa
tratar: dias sem entrega nenhuma e dias com gasto e zero leads. Para ver o
estado vazio, escolha um período de um dia só que o mock não cobre, como
`?from=2026-08-24&to=2026-08-24`.

Para exercitar os cartões de erro, suba o mock com `MOCK_ERROR` — `rate_limit`
(limite de requisições, com tempo estimado de espera), `auth` (token inválido)
ou `server` (erro 500, que exercita a retentativa com backoff):

```powershell
# PowerShell
$env:MOCK_ERROR="rate_limit"; pnpm mock
```

```bash
# bash
MOCK_ERROR=rate_limit pnpm mock
```

Falha de rede e perda de conexão não precisam do mock: pare o servidor do mock
para ver o cartão de rede, ou use DevTools → Network → Offline para ver a faixa
de "sem conexão".

Ao mexer em qualquer coisa de Next.js, consulte primeiro os guias em
`node_modules/next/dist/docs/` — ver [AGENTS.md](AGENTS.md).

## Adicionando componentes

```bash
pnpm dlx shadcn@latest add <componente>
```

Os componentes vão para `components/ui` e seguem o style `base-mira` definido em
`components.json`.
