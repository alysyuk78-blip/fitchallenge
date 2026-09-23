import { useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { BedDouble, Flag, ListPlus, Plus, UserPlus, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ParticipantDialog from '@/components/ParticipantDialog'
import { todayLocal } from '@/hooks/useCompetition'
import type { SetDraft } from '@/hooks/useSetDrafts'
import { fireConfetti } from '@/lib/confetti'
import { fmt, normStatus, totalFor } from '@/lib/score'
import { SKIP_REASONS, type Entry, type Exercise, type Participant, type SkipReason } from '@/types'
import { cn } from '@/lib/utils'

type Mode = 'result' | 'sets' | 'skip'

interface Props {
  participants: Participant[]
  exercises: Exercise[]
  entries: Entry[]
  drafts: SetDraft[]
  onAdd: (participantId: string, exerciseId: string, value: number, date: string) => void
  onAddSkip: (participantId: string, date: string, reason: SkipReason) => void
  onAddParticipant: (name: string, emoji: string) => string
  onAddSet: (participantId: string, exerciseId: string, date: string, value: number) => void
  onRemoveSet: (participantId: string, exerciseId: string, date: string, index: number) => void
  onClearDraft: (participantId: string, exerciseId: string, date: string) => void
}

export default function QuickLog({
  participants,
  exercises,
  entries,
  drafts,
  onAdd,
  onAddSkip,
  onAddParticipant,
  onAddSet,
  onRemoveSet,
  onClearDraft,
}: Props) {
  const [mode, setMode] = useState<Mode>('result')
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [exerciseId, setExerciseId] = useState<string | null>(null)
  const [reason, setReason] = useState<SkipReason | null>(null)
  const [value, setValue] = useState('')
  const [setInput, setSetInput] = useState('')
  const [date, setDate] = useState(todayLocal())
  const submitBtnRef = useRef<HTMLButtonElement>(null)

  const exercise = useMemo(() => exercises.find((e) => e.id === exerciseId) ?? null, [exercises, exerciseId])
  const participant = useMemo(
    () => participants.find((p) => p.id === participantId) ?? null,
    [participants, participantId],
  )

  const parsed = Number(value.replace(',', '.'))
  const validResult = participant && exercise && Number.isFinite(parsed) && parsed > 0 && date
  const validSkip = participant && reason && date

  /* ── Підходи ── */
  const draft = useMemo(
    () =>
      drafts.find(
        (d) => d.participantId === participantId && d.exerciseId === exerciseId && d.date === date,
      ) ?? null,
    [drafts, participantId, exerciseId, date],
  )
  const draftTotal = draft ? Math.round(draft.sets.reduce((a, b) => a + b, 0) * 10) / 10 : 0
  const parsedSet = Number(setInput.replace(',', '.'))
  const validSet = participant && exercise && Number.isFinite(parsedSet) && parsedSet > 0

  const addSet = () => {
    if (!validSet || !participant || !exercise) return
    onAddSet(participant.id, exercise.id, date, Math.round(parsedSet * 10) / 10)
    setSetInput('')
  }

  const removeSet = (index: number) => {
    if (!participant || !exercise) return
    onRemoveSet(participant.id, exercise.id, date, index)
  }

  const clearDraft = () => {
    if (!participant || !exercise) return
    onClearDraft(participant.id, exercise.id, date)
  }

  const burstFromButton = (count: number) => {
    const rect = submitBtnRef.current?.getBoundingClientRect()
    fireConfetti({
      count,
      x: rect ? rect.left + rect.width / 2 : undefined,
      y: rect ? rect.top : undefined,
    })
  }

  /** Тост «новий лідер», якщо запис виводить учасника уперед */
  const commitEntry = (valueTotal: number, finishMode: boolean) => {
    if (!participant || !exercise) return
    const prevTotals = participants.map((p) => ({ id: p.id, total: totalFor(entries, p.id, exercise.id) }))
    const prevLeader = prevTotals.reduce((a, b) => (b.total > a.total ? b : a), { id: '', total: 0 })
    const myNewTotal = (prevTotals.find((t) => t.id === participant.id)?.total ?? 0) + valueTotal
    const isNewLeader = myNewTotal > prevLeader.total && prevLeader.id !== participant.id && prevLeader.total > 0

    onAdd(participant.id, exercise.id, valueTotal, date)

    if (isNewLeader) {
      burstFromButton(140)
      toast.success('🔥 Новий лідер вправи!', {
        description: `${participant.emoji} ${participant.name} виходить уперед: ${exercise.name} — ${fmt(myNewTotal)} ${exercise.unit}`,
      })
    } else {
      burstFromButton(finishMode ? 90 : 50)
      toast.success(finishMode ? '🏁 День завершено!' : 'Записано!', {
        description: `${participant.emoji} ${participant.name} — ${exercise.name}: ${fmt(valueTotal)} ${exercise.unit}`,
      })
    }
  }

  const submitResult = () => {
    if (!validResult) return
    commitEntry(Math.round(parsed * 10) / 10, false)
    setValue('')
  }

  const submitFinish = () => {
    if (!draft || draftTotal <= 0) return
    commitEntry(draftTotal, true)
    clearDraft()
  }

  const submitSkip = () => {
    if (!validSkip || !participant || !reason) return
    onAddSkip(participant.id, date, reason)
    const r = SKIP_REASONS[reason]
    toast.success('Пропуск зафіксовано', {
      description: `${participant.emoji} ${participant.name} — ${r.emoji} ${r.label}`,
    })
    setReason(null)
  }

  const addAndSelect = (name: string, emoji: string): string => onAddParticipant(name, emoji)

  if (participants.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <p className="text-muted-foreground">Спочатку додайте учасників — це займе 10 секунд</p>
        <ParticipantDialog
          takenEmojis={[]}
          onAdd={addAndSelect}
          onAdded={() => toast.info('Тепер оберіть вправу та запишіть перший результат')}
          trigger={
            <Button className="mt-3 bg-volt font-bold text-background hover:bg-volt/90">
              <UserPlus className="mr-2 h-4 w-4" /> Додати першого учасника
            </Button>
          }
        />
      </div>
    )
  }

  const MODE_UI: Record<Mode, { icon: ReactNode; title: string; tab: string }> = {
    result: { icon: <Zap className="h-4 w-4 text-volt" />, title: 'Записати результат', tab: '💪 Разово' },
    sets: { icon: <ListPlus className="h-4 w-4 text-volt" />, title: 'Підходи за день', tab: '🔢 Підходи' },
    skip: { icon: <BedDouble className="h-4 w-4 text-volt" />, title: 'Зафіксувати пропуск', tab: '😴 Пропуск' },
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
        <span className="hidden items-center gap-2 sm:flex">
          {MODE_UI[mode].icon}
          <h2 className="font-display text-sm font-bold uppercase tracking-widest">{MODE_UI[mode].title}</h2>
        </span>
        {/* Перемикач режиму */}
        <div className="ml-auto flex rounded-full border border-border bg-secondary/50 p-0.5 text-xs font-semibold">
          {(Object.keys(MODE_UI) as Mode[]).map((m) => (
            <button
              key={m}
              data-mode-sets={m === 'sets' ? true : undefined}
              onClick={() => setMode(m)}
              className={cn(
                'rounded-full px-2.5 py-1 transition-colors sm:px-3',
                mode === m ? 'bg-volt text-background' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {MODE_UI[m].tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Хто */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Хто</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {participants.map((p) => (
              <button
                key={p.id}
                onClick={() => setParticipantId(p.id)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  participantId === p.id
                    ? 'border-transparent text-background'
                    : 'border-border bg-secondary/50 text-foreground hover:bg-secondary',
                )}
                style={participantId === p.id ? { backgroundColor: p.color } : undefined}
              >
                <span>{p.emoji}</span>
                <span>{p.name}</span>
              </button>
            ))}
            <ParticipantDialog
              takenEmojis={participants.map((p) => p.emoji)}
              onAdd={addAndSelect}
              onAdded={(id) => setParticipantId(id)}
              trigger={
                <button
                  aria-label="Додати учасника"
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-volt hover:text-volt"
                >
                  <Plus className="h-4 w-4" /> Учасник
                </button>
              }
            />
          </div>
        </div>

        {mode !== 'skip' && (
          /* Вправа */
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Вправа</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {exercises.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setExerciseId(e.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                    exerciseId === e.id
                      ? 'border-transparent bg-volt text-background'
                      : 'border-border bg-secondary/50 text-foreground hover:bg-secondary',
                  )}
                >
                  <span>{e.emoji}</span>
                  <span>{e.name}</span>
                  <span className={cn('text-xs', exerciseId === e.id ? 'text-background/70' : 'text-muted-foreground')}>
                    {e.unit}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'result' && (
          /* Разовий запис */
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Скільки{exercise ? ` (${exercise.unit})` : ''}
              </p>
              <Input
                inputMode="decimal"
                placeholder={exercise ? `напр., ${exercise.unit === 'км' ? '5.2' : exercise.unit === 'кроків' ? '8000' : '30'}` : '0'}
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && submitResult()}
                className="h-12 text-lg font-bold bg-secondary/50"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Дата</p>
              <Input
                type="date"
                value={date}
                max={todayLocal()}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 bg-secondary/50 sm:w-44"
              />
            </div>
            <Button
              ref={submitBtnRef}
              onClick={submitResult}
              disabled={!validResult}
              className="btn-glow h-12 px-6 text-base font-bold bg-volt text-background hover:bg-volt/90 disabled:opacity-40 disabled:[animation:none]"
            >
              <Plus className="mr-1 h-5 w-5" /> Записати
            </Button>
          </div>
        )}

        {mode === 'sets' && (
          /* Підходи протягом дня */
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Підхід{exercise ? ` (${exercise.unit})` : ''}
                </p>
                <Input
                  inputMode="decimal"
                  placeholder={exercise ? `напр., ${exercise.unit === 'км' ? '1.5' : '20'}` : '0'}
                  value={setInput}
                  onChange={(e) => setSetInput(e.target.value.replace(/[^\d.,]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && addSet()}
                  className="h-12 text-lg font-bold bg-secondary/50"
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Дата</p>
                <Input
                  type="date"
                  value={date}
                  max={todayLocal()}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 bg-secondary/50 sm:w-44"
                />
              </div>
              <Button
                onClick={addSet}
                disabled={!validSet}
                variant="outline"
                className="h-12 px-5 font-bold disabled:opacity-40"
              >
                <ListPlus className="mr-1.5 h-5 w-5" /> Додати підхід
              </Button>
            </div>

            {/* Список підходів */}
            {participant && exercise && (
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                {draft && draft.sets.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {draft.sets.map((s, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold"
                        >
                          <span className="text-xs text-muted-foreground">#{i + 1}</span>
                          {fmt(s)}
                          <button
                            onClick={() => removeSet(i)}
                            aria-label={`Видалити підхід ${i + 1}`}
                            className="text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-sm text-muted-foreground">
                        Разом за день:{' '}
                        <span className="text-lg font-black text-foreground">
                          {fmt(draftTotal)} {exercise.unit}
                        </span>
                      </p>
                      {exercise.normMin != null && exercise.normMin > 0 && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-semibold',
                            normStatus(exercise, draftTotal) === 'below'
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-volt/15 text-volt',
                          )}
                        >
                          {normStatus(exercise, draftTotal) === 'below'
                            ? `ще ${fmt(exercise.normMin - draftTotal)} до норми`
                            : 'норму виконано ✓'}
                        </span>
                      )}
                      <Button
                        ref={submitBtnRef}
                        onClick={submitFinish}
                        className="btn-glow ml-auto bg-volt px-6 font-black text-background hover:bg-volt/90"
                      >
                        <Flag className="mr-1.5 h-4 w-4" /> Фініш
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    Додавайте підходи протягом дня — вони збережуться тут. Наприкінці дня натисніть{' '}
                    <span className="font-semibold text-foreground">«Фініш»</span>, і сума піде в залік.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {mode === 'skip' && (
          <>
            {/* Причина пропуску */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Причина пропуску
              </p>
              <div className="grid grid-cols-2 gap-2 sm:max-w-md">
                {(Object.keys(SKIP_REASONS) as SkipReason[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 transition-colors',
                      reason === r
                        ? 'border-volt bg-volt/10'
                        : 'border-border bg-secondary/50 hover:bg-secondary',
                    )}
                  >
                    <span className="text-3xl">{SKIP_REASONS[r].emoji}</span>
                    <span className="text-sm font-medium">{SKIP_REASONS[r].label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Дата</p>
                <Input
                  type="date"
                  value={date}
                  max={todayLocal()}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 bg-secondary/50 sm:w-44"
                />
              </div>
              <Button
                onClick={submitSkip}
                disabled={!validSkip}
                className="h-12 px-6 text-base font-bold bg-volt text-background hover:bg-volt/90 disabled:opacity-40"
              >
                <BedDouble className="mr-2 h-5 w-5" /> Зафіксувати пропуск
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
