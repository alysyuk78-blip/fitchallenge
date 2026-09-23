import { useMemo, useState } from 'react'
import { History as HistoryIcon, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SKIP_REASONS, type CompetitionState } from '@/types'
import { fmt, fmtDateFull, plural } from '@/lib/score'

const PAGE = 20

type Row =
  | { kind: 'entry'; id: string; date: string; participantId: string; exerciseId: string; value: number }
  | { kind: 'skip'; id: string; date: string; participantId: string; reason: keyof typeof SKIP_REASONS }

export default function History({
  state,
  onRemove,
  onRemoveSkip,
}: {
  state: CompetitionState
  onRemove: (id: string) => void
  onRemoveSkip: (id: string) => void
}) {
  const [shown, setShown] = useState(PAGE)

  const rows = useMemo<Row[]>(() => {
    const all: Row[] = [
      ...state.entries.map((e) => ({ kind: 'entry' as const, ...e })),
      ...state.skips.map((k) => ({ kind: 'skip' as const, ...k })),
    ]
    return all.sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)))
  }, [state.entries, state.skips])

  const byParticipant = useMemo(() => new Map(state.participants.map((p) => [p.id, p])), [state.participants])
  const byExercise = useMemo(() => new Map(state.exercises.map((e) => [e.id, e])), [state.exercises])

  const total = state.entries.length + state.skips.length

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
        <HistoryIcon className="h-4 w-4 text-volt" />
        <h3 className="font-display text-sm font-bold uppercase tracking-widest">
          Історія <span className="text-muted-foreground">({total} {plural(total, 'запис', 'записи', 'записів')})</span>
        </h3>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          Записів ще немає — додайте перший результат угорі
        </p>
      ) : (
        <>
          <div className="divide-y divide-border">
            {rows.slice(0, shown).map((row) => {
              const p = byParticipant.get(row.participantId)
              if (!p) return null

              if (row.kind === 'skip') {
                const r = SKIP_REASONS[row.reason]
                return (
                  <div key={row.id} className="group flex items-center gap-3 px-4 py-2.5 sm:px-5">
                    <span className="text-xl">{p.emoji}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {p.name} <span className="text-muted-foreground">·</span> {r.emoji} пропуск
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">{fmtDateFull(row.date)}</p>
                    </div>
                    <span className="ml-auto shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {r.label}
                    </span>
                    <button
                      onClick={() => onRemoveSkip(row.id)}
                      aria-label="Видалити пропуск"
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-opacity hover:bg-destructive/15 hover:text-destructive focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              }

              const ex = byExercise.get(row.exerciseId)
              if (!ex) return null
              return (
                <div key={row.id} className="group flex items-center gap-3 px-4 py-2.5 sm:px-5">
                  <span className="text-xl">{p.emoji}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {p.name} <span className="text-muted-foreground">·</span> {ex.emoji} {ex.name}
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">{fmtDateFull(row.date)}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-base font-bold">
                    {fmt(row.value)}
                    <span className="ml-1 text-xs font-medium text-muted-foreground">{ex.unit}</span>
                  </span>
                  <button
                    onClick={() => onRemove(row.id)}
                    aria-label="Видалити запис"
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-opacity hover:bg-destructive/15 hover:text-destructive focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
          {shown < rows.length && (
            <div className="border-t border-border p-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setShown((s) => s + PAGE)}>
                Показати ще ({rows.length - shown})
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
