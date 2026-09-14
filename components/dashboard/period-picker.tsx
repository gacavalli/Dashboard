"use client"

import * as React from "react"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import type { DateRange as DayPickerRange } from "react-day-picker"

import { CONTROL_HEIGHT, CONTROL_SIZE } from "@/components/dashboard/card-style"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatDayShort } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  PERIOD_PRESETS,
  shiftRangeByMonths,
  type DateRange,
  type PeriodPreset,
} from "@/lib/meta/date-ranges"

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

/** O calendário trabalha com `Date` local; a API, com `YYYY-MM-DD`. */
function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function fromIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function PeriodPicker({
  preset,
  range,
  today,
  onPresetChange,
  onRangeChange,
  disabled = false,
}: {
  preset: PeriodPreset | null
  range: DateRange
  /** "Hoje" no fuso da conta de anúncios, não no do navegador. */
  today: string
  onPresetChange: (preset: PeriodPreset) => void
  onRangeChange: (range: DateRange) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<DayPickerRange | undefined>({
    from: fromIso(range.since),
    to: fromIso(range.until),
  })

  const isCustom = preset === null

  // Não há entrega no futuro: avançar só faz sentido enquanto o período não
  // alcançou hoje. O servidor ainda limita o fim em hoje, caso o salto passe.
  const canGoForward = range.until < today

  function applyDraft() {
    if (!draft?.from) {
      return
    }
    const from = toIso(draft.from)
    const to = draft.to ? toIso(draft.to) : from
    onRangeChange({ since: from, until: to })
    setOpen(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="no-scrollbar max-w-full min-w-0 overflow-x-auto">
        <ToggleGroup
          value={preset ? [preset] : []}
          onValueChange={(value) => {
            const next = value[0]
            if (next) {
              onPresetChange(next as PeriodPreset)
            }
          }}
          variant="outline"
          spacing={0}
          disabled={disabled}
          aria-label="Período"
          className="period-toggle-group min-w-max"
        >
          {PERIOD_PRESETS.map((item) => (
            <ToggleGroupItem
              key={item.id}
              value={item.id}
              variant="outline"
              className={cn(CONTROL_HEIGHT, "!px-4 text-base")}
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Um mês para trás"
          title="Um mês para trás"
          className={cn(CONTROL_SIZE, "month-navigation-button")}
          disabled={disabled}
          onClick={() => onRangeChange(shiftRangeByMonths(range, -1))}
        >
          <ChevronLeftIcon />
        </Button>

        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            if (nextOpen) {
              setDraft({ from: fromIso(range.since), to: fromIso(range.until) })
            }
            setOpen(nextOpen)
          }}
        >
          <PopoverTrigger
            render={
              <Button
                variant={isCustom ? "secondary" : "outline"}
                className={cn(
                  CONTROL_HEIGHT,
                  "date-picker-button relative justify-center px-4 pl-9 text-base"
                )}
                disabled={disabled}
              />
            }
          >
            <CalendarIcon className="absolute left-3" />
            {isCustom
              ? `${formatDayShort(range.since)} – ${formatDayShort(range.until)}`
              : "Personalizado"}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="range"
              locale={ptBR}
              numberOfMonths={2}
              defaultMonth={fromIso(range.since)}
              selected={draft}
              onSelect={setDraft}
              disabled={{ after: fromIso(today) }}
              captionLayout="dropdown"
              className="px-5 pt-4 pb-2 text-base [--cell-size:--spacing(7)]"
            />
            <div className="flex items-center justify-between gap-3 border-t border-border px-2.5 py-1.5">
              <span className="min-w-0 text-right text-sm text-muted-foreground">
                {draft?.from
                  ? `${formatDayShort(toIso(draft.from))} – ${
                      draft.to ? formatDayShort(toIso(draft.to)) : "…"
                    }`
                  : "Selecione o intervalo"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-sm"
                  onClick={() => setDraft(undefined)}
                  disabled={!draft?.from}
                >
                  Limpar
                </Button>
                <Button
                  className="h-8 px-3 text-sm"
                  onClick={applyDraft}
                  disabled={!draft?.from}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          aria-label="Um mês para frente"
          className={cn(CONTROL_SIZE, "month-navigation-button")}
          title={
            canGoForward
              ? "Um mês para frente"
              : "O período já alcança a data de hoje"
          }
          disabled={disabled || !canGoForward}
          onClick={() => onRangeChange(shiftRangeByMonths(range, 1))}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  )
}
