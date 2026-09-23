import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartLine, ChartColumn } from 'lucide-react'
import ExerciseIcon from '@/components/ExerciseIcon'
import type { CompetitionState } from '@/types'
import { cumulativeSeries, fmt, fmtDate, totalFor } from '@/lib/score'
import { cn } from '@/lib/utils'

const tooltipStyle = {
  backgroundColor: 'hsl(240 7% 10%)',
  border: '1px solid hsl(240 5% 20%)',
  borderRadius: '10px',
  fontSize: '13px',
} as const

export default function Stats({ state }: { state: CompetitionState }) {
  const [exerciseId, setExerciseId] = useState<string | null>(state.exercises[0]?.id ?? null)
  const exercise = state.exercises.find((e) => e.id === exerciseId) ?? state.exercises[0]

  const bars = useMemo(() => {
    if (!exercise) return []
    return state.participants
      .map((p) => ({
        name: `${p.emoji} ${p.name}`,
        total: totalFor(state.entries, p.id, exercise.id),
        fill: p.color,
      }))
      .filter((b) => b.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [state, exercise])

  const series = useMemo(
    () => (exercise ? cumulativeSeries(state.participants, state.entries, exercise) : []),
    [state, exercise],
  )

  const activeParticipants = useMemo(
    () =>
      state.participants.filter((p) =>
        state.entries.some((e) => e.participantId === p.id && e.exerciseId === exercise?.id),
      ),
    [state, exercise],
  )

  if (!exercise || state.participants.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        Додайте учасників і записи, щоб побачити статистику
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {/* Вибір вправи */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {state.exercises.map((e) => (
          <button
            key={e.id}
            onClick={() => setExerciseId(e.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              exercise.id === e.id
                ? 'border-transparent bg-volt text-background'
                : 'border-border bg-card hover:bg-secondary',
            )}
          >
            <ExerciseIcon exercise={e} className="h-4 w-4" />
            <span>{e.name}</span>
          </button>
        ))}
      </div>

      {/* Стовпчики: суми по учасниках */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
          <ChartColumn className="h-4 w-4 text-volt" />
          <h3 className="font-display text-sm font-bold uppercase tracking-widest">
            Підсумок — {exercise.name} <span className="text-muted-foreground">({exercise.unit})</span>
          </h3>
        </div>
        <div className="p-4 sm:p-5">
          {bars.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Немає даних для цієї вправи</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bars} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 16%)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'hsl(240 5% 58%)', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(240 5% 20%)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(240 5% 58%)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => fmt(v)}
                    width={56}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'hsl(240 6% 14%)' }}
                    formatter={(value) => [`${fmt(Number(value))} ${exercise.unit}`, exercise.name]}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={64}>
                    {bars.map((b) => (
                      <Cell key={b.name} fill={b.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Лінії: кумулятивний прогрес */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
          <ChartLine className="h-4 w-4 text-volt" />
          <h3 className="font-display text-sm font-bold uppercase tracking-widest">
            Прогрес у часі — {exercise.name}
          </h3>
        </div>
        <div className="p-4 sm:p-5">
          {series.length < 2 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Потрібно щонайменше два дні з записами, щоб показати динаміку
            </p>
          ) : (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 16%)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'hsl(240 5% 58%)', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(240 5% 20%)' }}
                      tickLine={false}
                      tickFormatter={(d: string) => fmtDate(d)}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(240 5% 58%)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => fmt(v)}
                      width={56}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={(d) => fmtDate(String(d))}
                      formatter={(value, name) => {
                        const p = state.participants.find((x) => x.id === name)
                        return [`${fmt(Number(value))} ${exercise.unit}`, p ? `${p.emoji} ${p.name}` : String(name)]
                      }}
                    />
                    {activeParticipants.map((p) => (
                      <Line
                        key={p.id}
                        type="monotone"
                        dataKey={p.id}
                        stroke={p.color}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {activeParticipants.map((p) => (
                  <span key={p.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.emoji} {p.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
