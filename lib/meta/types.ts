/** Tipos das respostas do Marketing API que este dashboard consome. */

/** Entrada de `actions` / `cost_per_action_type` (`list<AdsActionStats>`). */
export interface MetaActionStat {
  action_type: string
  value: string
}

export interface MetaInsightsRow {
  date_start: string
  date_stop: string
  spend?: string
  impressions?: string
  clicks?: string
  actions?: MetaActionStat[]
  cost_per_action_type?: MetaActionStat[]
}

export interface MetaCampaign {
  id: string
  name: string
  status: string
  effective_status: string
  objective?: string
}

export interface MetaAccount {
  id: string
  name: string
  currency: string
  timezone_name: string
}

export interface MetaPaging {
  cursors?: { before?: string; after?: string }
  next?: string
  previous?: string
}

export interface MetaListResponse<T> {
  data?: T[]
  paging?: MetaPaging
}
