import { useMemo } from 'react'
import { Radio } from 'lucide-react'
import { SKIP_REASONS, type CompetitionState } from '@/types'
import { fmt } from '@/lib/score'
import { todayLocal } from '@/hooks/useCompetition'

type FeedRow =
  | { kind: 'entry'; id: string; ts: number; participantId: string; exerciseId: string; value: number }
  | { kind: 'skip'; id: string; ts: number; participantId: string; reason: keyof typeof SKIP_REASONS }

function fmtTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Live-стрічка: хто і що записав сьогодні — оновлюється автоматично з синхронізацією */
export default function LiveFeed({ state, synced }: { state: CompetitionState; synced: boolean }) {
  const today = todayLocal()

  const rows = useMemo<FeedRow[]>(() => {
    const entries: FeedRow[] = state.entries
      .filter((e) => e.date === today)
      .map((e) => ({ kind: 'entry', id: e.id, ts: e.ts ?? 0, participantId: e.participantId, exerciseId: e.exerciseId, value: e.value }))
    const skips: FeedRow[] = state.skips
      .filter((k) => k.date === today)
      .map((k) => ({ kind: 'skip', id: k.id, ts: 0, participantId: k.participantId, reason: k.reason }))
    // нові записи (з міткою часу) — найсвіжіші зверху; старі без ts — в кінець
    return [...entries, ...skips].sort((a, b) => b.ts - a.ts)
  }, [state.entries, state.skips, today])

  const byParticipant = useMemo(() => new Map(state.participants.map((p) => [p.id, p])), [state.participants])
  const byExercise = useMemo(() => new Map(state.exercises.map((e) => [e.id, e])), [state.exercises])

  const activeToday = useMemo(
    () => new Set(rows.map((r) => r.participantId)).size,
    [rows],
  )

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <h3 className="font-display whitespace-nowrap text-sm font-bold uppercase tracking-widest">Сьогодні · Live</h3>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-right text-xs text-muted-foreground">
          <Radio className="h-3.5 w-3.5" />
          {synced ? 'онлайн-синхронізація' : 'локально'} · {activeToday}{' '}
          {activeToday === 1 ? 'активний' : 'активних'}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          Сьогодні ще тихо… Будьте першим, хто запише результат! 💪
        </p>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((row) => {
            const p = byParticipant.get(row.participantId)
            if (!p) return null
            if (row.kind === 'skip') {
              const r = SKIP_REASONS[row.reason]
              return (
                <div key={row.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                  <span className="text-xl">{p.emoji}</span>
                  <p className="min-w-0 flex-1 truncate text-sm">
                    <span className="font-medium">{p.name}</span>{' '}
                    <span className="text-muted-foreground">фіксує пропуск — {r.emoji} {r.label}</span>
                  </p>
                </div>
              )
            }
            const ex = byExercise.get(row.exerciseId)
            if (!ex) return null
            return (
              <div key={row.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                <span className="text-xl">{p.emoji}</span>
                <p className="min-w-0 flex-1 truncate text-sm">
                  <span className="font-medium">{p.name}</span>{' '}
                  <span className="text-muted-foreground">{ex.emoji} {ex.name}</span>
                </p>
                <span className="shrink-0 text-base font-black text-volt">
                  +{fmt(row.value)}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">{ex.unit}</span>
                </span>
                {row.ts > 0 && (
                  <span className="w-11 shrink-0 text-right text-xs text-muted-foreground">{fmtTime(row.ts)}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
