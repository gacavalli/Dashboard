/**
 * Escala visual do dashboard.
 *
 * O primitivo `components/ui/card.tsx` pode ser sobrescrito pelo CLI do
 * shadcn, então cada cartão do painel aplica estas classes e mantém a escala
 * maior isolada do restante da interface.
 *
 * O alvo é o painel inteiro caber sem rolagem em uma tela de notebook, então o
 * texto e respiro acompanham uma tela ampla, sem alterar o primitivo de card.
 */
export const DASHBOARD_CARD =
  "dashboard-card min-w-0 text-base transition-shadow duration-150 [--card-spacing:--spacing(6)]"

/** Altura dos gráficos de evolução. */
export const CHART_HEIGHT = "h-72"

/** Altura dos controles da barra de filtros. */
export const CONTROL_HEIGHT = "h-10"

/** Lado dos controles quadrados (os botões de navegar um mês). */
export const CONTROL_SIZE = "size-10"
