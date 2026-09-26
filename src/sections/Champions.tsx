import { useMemo, useState } from 'react'
import { Crown, Trophy } from 'lucide-react'
import CountUp from '@/components/CountUp'
import type { CompetitionState } from '@/types'
import {
  championsForPeriod,
  PERIOD_LABELS,
  periodRange,
  plural,
  type Period,
} from '@/lib/score'
import { todayLocal } from '@/hooks/useCompetition'
import { fireConfetti } from '@/lib/confetti'
import { cn } from '@/lib/utils'

const MEDAL = ['🥇', '🥈', '🥉']

export default function Champions({ state }: { state: CompetitionState }) {
  const [period, setPeriod] = useState<Period>('day')
  const today = todayLocal()

  const rows = useMemo(() => {
    const { from, to } = periodRange(period, today)
    return championsForPeriod(state, from, to)
  }, [state, period, today])

  if (state.participants.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        Додайте учасників, щоб побачити чемпіонів
      </p>
    )
  }

  const champion = rows[0]
  const hasResults = champion && champion.points > 0

  return (
    <div className="space-y-6">
      {/* Перемикач періоду */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors',
              period === p
                ? 'border-transparent bg-volt text-background'
                : 'border-border bg-card hover:bg-secondary',
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Бали: 🥇 = 3 · 🥈 = 2 · 🥉 = 1 за кожну вправу. При рівності балів перемагає той, у кого
        більше 🥇, далі 🥈, далі — більший обсяг роботи.
      </p>

      {!hasResults ? (
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          За цей період ще немає результатів — час відкрити рахунок! 💪
        </p>
      ) : (
        <>
          {/* Картка чемпіона */}
          <div className="leader-glow rise-in relative overflow-hidden rounded-2xl border border-volt/50 bg-gradient-to-br from-volt/15 via-card to-card p-6 text-center sm:p-8">
            <Crown className="mx-auto h-8 w-8 text-volt" />
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-volt">
              Чемпіон · {PERIOD_LABELS[period].toLowerCase()}
            </p>
            <p className="font-display mt-2 text-4xl font-black uppercase sm:text-5xl">
              {champion.participant.emoji} {champion.participant.name}
            </p>
            <p className="mt-2 text-muted-foreground">
              <CountUp value={champion.points} className="text-2xl font-black text-foreground" />{' '}
              {plural(champion.points, 'бал', 'бали', 'балів')}
              <span className="mx-2">·</span>
              {champion.gold > 0 && `🥇×${champion.gold} `}
              {champion.silver > 0 && `🥈×${champion.silver} `}
              {champion.bronze > 0 && `🥉×${champion.bronze}`}
            </p>
            <button
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
                fireConfetti({ count: 120, x: rect.left + rect.width / 2, y: rect.top })
              }}
              className="btn-glow mt-5 rounded-xl bg-volt px-6 py-2.5 font-bold text-background transition-colors hover:bg-volt/90"
            >
              👏 Аплодувати чемпіону
            </button>
          </div>

          {/* Решта рейтингу за період */}
          {rows.length > 1 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
                <Trophy className="h-4 w-4 text-volt" />
                <h3 className="font-display text-sm font-bold uppercase tracking-widest">
                  Повний залік · {PERIOD_LABELS[period].toLowerCase()}
                </h3>
              </div>
              <div className="divide-y divide-border">
                {rows.map((r, i) => (
                  <div key={r.participant.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                    <span className="w-7 text-lg">
                      {i < 3 ? MEDAL[i] : <span className="pl-1 text-sm font-bold text-muted-foreground">{i + 1}</span>}
                    </span>
                    <span className="text-xl">{r.participant.emoji}</span>
                    <span className="font-medium">{r.participant.name}</span>
                    <span className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex gap-1.5">
                        {r.gold > 0 && <span>🥇×{r.gold}</span>}
                        {r.silver > 0 && <span>🥈×{r.silver}</span>}
                        {r.bronze > 0 && <span>🥉×{r.bronze}</span>}
                      </span>
                      <span className={cn('font-black', i === 0 && 'text-volt')}>
                        <CountUp value={r.points} /> {plural(r.points, 'бал', 'бали', 'балів')}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
