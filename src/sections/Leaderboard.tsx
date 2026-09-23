import { useMemo, useState } from 'react'
import { Crown, Medal, Target } from 'lucide-react'
import CountUp from '@/components/CountUp'
import ExerciseIcon from '@/components/ExerciseIcon'
import { SKIP_REASONS, type CompetitionState, type Exercise } from '@/types'
import { computeStandings, daySumFor, fmt, normLabel, normStatus, plural, rankExercise, streakDays } from '@/lib/score'
import { todayLocal } from '@/hooks/useCompetition'
import { cn } from '@/lib/utils'

const MEDAL = ['🥇', '🥈', '🥉']

/** Бейдж відхилення від денної норми */
function NormBadge({ exercise, daySum }: { exercise: Exercise; daySum: number }) {
  const status = normStatus(exercise, daySum)
  if (status === 'none') return null
  if (status === 'ok')
    return (
      <span className="rounded-full bg-volt/15 px-2 py-0.5 text-xs font-semibold text-volt">норма ✓</span>
    )
  if (status === 'below')
    return (
      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400">
        −{fmt((exercise.normMin as number) - daySum)} до норми
      </span>
    )
  return (
    <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-semibold text-orange-400">
      +{fmt(daySum - (exercise.normMax as number))} понад макс
    </span>
  )
}

export default function Leaderboard({ state }: { state: CompetitionState }) {
  const standings = useMemo(() => computeStandings(state), [state])
  const [exerciseId, setExerciseId] = useState<string | null>(state.exercises[0]?.id ?? null)
  const exercise = state.exercises.find((e) => e.id === exerciseId) ?? state.exercises[0]
  const ranked = useMemo(
    () => (exercise ? rankExercise(state.participants, state.entries, exercise.id) : []),
    [state, exercise],
  )
  const leaderTotal = ranked[0]?.total ?? 0
  const today = todayLocal()

  const hasNorm = exercise && normLabel(exercise) != null
  // Учасники без результатів у цій вправі, але з нормою — показуємо їх відхилення теж
  const idle = useMemo(() => {
    if (!exercise || !hasNorm) return []
    const rankedIds = new Set(ranked.map((r) => r.participant.id))
    return state.participants.filter((p) => !rankedIds.has(p.id))
  }, [state.participants, ranked, exercise, hasNorm])

  if (state.participants.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        Додайте учасників, щоб побачити рейтинг
      </p>
    )
  }

  const top3 = standings.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Подіум */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Залік за весь час
          <span className="normal-case tracking-normal">
            {' '}· день / тиждень / місяць — у вкладці «👑 Чемпіони»
          </span>
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
        {top3.map((row, i) => (
          <div
            key={row.participant.id}
            className={cn(
              'relative rounded-xl border p-4 sm:p-5 rise-in',
              i === 0 ? 'leader-glow border-volt/60 bg-volt/10' : 'border-border bg-card',
            )}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{MEDAL[i]}</span>
              {i === 0 && <Crown className="h-5 w-5 text-volt" />}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl">{row.participant.emoji}</span>
              <span className="font-display text-xl font-bold uppercase">{row.participant.name}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-3 text-sm text-muted-foreground">
              <CountUp value={row.points} className="text-2xl font-black text-foreground" />
              <span>{plural(row.points, 'бал', 'бали', 'балів')}</span>
              <span className="ml-auto flex gap-1.5">
                {row.gold > 0 && <span>🥇×{row.gold}</span>}
                {row.silver > 0 && <span>🥈×{row.silver}</span>}
                {row.bronze > 0 && <span>🥉×{row.bronze}</span>}
              </span>
            </div>
            {(() => {
              const streak = streakDays(state.entries, row.participant.id, today)
              return streak > 1 ? (
                <p className="mt-1.5 text-xs font-semibold text-orange-400">
                  🔥 {streak} {plural(streak, 'день', 'дні', 'днів')} поспіль
                </p>
              ) : null
            })()}
          </div>
        ))}
        </div>
      </div>

      {/* Повний залік (якщо учасників більше трьох) */}
      {standings.length > 3 && (
        <div className="rounded-xl border border-border bg-card">
          {standings.slice(3).map((row, i) => (
            <div
              key={row.participant.id}
              className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0"
            >
              <span className="w-6 text-sm font-bold text-muted-foreground">{i + 4}</span>
              <span className="text-xl">{row.participant.emoji}</span>
              <span className="font-medium">{row.participant.name}</span>
              <span className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex gap-1.5">
                  {row.gold > 0 && <span>🥇×{row.gold}</span>}
                  {row.silver > 0 && <span>🥈×{row.silver}</span>}
                  {row.bronze > 0 && <span>🥉×{row.bronze}</span>}
                </span>
                <span className="font-bold text-foreground">
                  {row.points} {plural(row.points, 'бал', 'бали', 'балів')}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Рейтинг за вправою */}
      {exercise && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
            <Medal className="h-4 w-4 text-volt" />
            <h3 className="font-display text-sm font-bold uppercase tracking-widest">Залік за вправою</h3>
            {hasNorm && (
              <span className="ml-auto flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                <Target className="h-3.5 w-3.5 text-volt" />
                норма: {normLabel(exercise)}
              </span>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-border px-4 py-3 sm:px-5">
            {state.exercises.map((e) => (
              <button
                key={e.id}
                onClick={() => setExerciseId(e.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  exercise.id === e.id
                    ? 'border-transparent bg-volt text-background'
                    : 'border-border bg-secondary/50 hover:bg-secondary',
                )}
              >
                <ExerciseIcon exercise={e} className="h-5 w-5" />
                <span>{e.name}</span>
              </button>
            ))}
          </div>

          {ranked.length === 0 && idle.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-5">
              Поки ніхто не записав результатів у цій вправі
            </p>
          ) : (
            <div className="divide-y divide-border">
              {ranked.map((r) => {
                const daySum = daySumFor(state.entries, r.participant.id, exercise.id, today)
                const skip = state.skips.find((k) => k.participantId === r.participant.id && k.date === today)
                return (
                  <div key={r.participant.id} className="px-4 py-3 sm:px-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="w-7 text-lg">
                        {r.rank <= 3 ? (
                          MEDAL[r.rank - 1]
                        ) : (
                          <span className="pl-1 text-sm font-bold text-muted-foreground">{r.rank}</span>
                        )}
                      </span>
                      <span className="text-xl">{r.participant.emoji}</span>
                      <span className="font-medium">{r.participant.name}</span>
                      {skip && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {SKIP_REASONS[skip.reason].emoji} пропуск сьогодні
                        </span>
                      )}
                      {hasNorm && <NormBadge exercise={exercise} daySum={daySum} />}
                      <span
                        className="ml-auto text-lg font-black"
                        style={{ color: r.rank === 1 ? 'hsl(71 96% 54%)' : undefined }}
                      >
                        <CountUp value={r.total} />
                        <span className="ml-1 text-xs font-medium text-muted-foreground">{exercise.unit}</span>
                      </span>
                    </div>
                    {hasNorm && (
                      <p className="mt-0.5 pl-10 text-xs text-muted-foreground">
                        сьогодні: {fmt(daySum)} {exercise.unit}
                      </p>
                    )}
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.max(3, (r.total / leaderTotal) * 100)}%`,
                          backgroundColor: r.participant.color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
              {/* Учасники без результатів у вправі, якщо задано норму */}
              {idle.map((p) => {
                const daySum = daySumFor(state.entries, p.id, exercise.id, today)
                const skip = state.skips.find((k) => k.participantId === p.id && k.date === today)
                return (
                  <div key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 opacity-70 sm:px-5">
                    <span className="w-7 pl-1 text-sm font-bold text-muted-foreground">—</span>
                    <span className="text-xl">{p.emoji}</span>
                    <span className="font-medium">{p.name}</span>
                    {skip && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {SKIP_REASONS[skip.reason].emoji} пропуск сьогодні
                      </span>
                    )}
                    <NormBadge exercise={exercise} daySum={daySum} />
                    <span className="ml-auto text-sm text-muted-foreground">немає результатів</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
