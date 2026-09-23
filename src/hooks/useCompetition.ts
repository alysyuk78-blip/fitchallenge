import { useCallback, useEffect, useState } from 'react'
import type { CompetitionState, Entry, Exercise, Participant, SkipReason, Unit } from '@/types'

const STORAGE_KEY = 'fitchallenge-state-v1'

export const UNITS: Unit[] = ['разів', 'кроків', 'км', 'хв', 'сек']

export const PARTICIPANT_COLORS = [
  '#C8F31D', // volt
  '#FF6B35', // orange
  '#4ECDC4', // teal
  '#FF3E8A', // pink
  '#8F7BFF', // violet
  '#FFC800', // yellow
  '#3EA6FF', // blue
  '#8AC926', // green
]

export const PARTICIPANT_EMOJIS = ['🦊', '🐻', '🦁', '🐯', '🦅', '🐺', '🦄', '🐼', '🐸', '🐙', '⚡', '🔥', '🚀', '🎯']

export const EXERCISE_EMOJIS = ['🏃', '🚶', '🏋️', '🤸', '🧘', '🚴', '🏊', '🤾', '⛹️', '🧗', '🥊', '⚽', '🏐', '🎿']

export const DEFAULT_EXERCISES: Exercise[] = [
  { id: 'ex-pushups', name: 'Віджимання від підлоги', unit: 'разів', emoji: '💪' },
  { id: 'ex-squats', name: 'Присідання', unit: 'разів', emoji: '🦵' },
  { id: 'ex-walk-steps', name: 'Ходьба (кроки)', unit: 'кроків', emoji: '🚶' },
  { id: 'ex-walk-km', name: 'Ходьба (км)', unit: 'км', emoji: '🥾' },
  { id: 'ex-run-km', name: 'Біг (км)', unit: 'км', emoji: '🏃' },
  { id: 'ex-plank', name: 'Планка', unit: 'сек', emoji: '🧱' },
  { id: 'ex-pullups', name: 'Підтягування', unit: 'разів', emoji: '🏋️' },
]

const EMPTY_STATE: CompetitionState = {
  participants: [],
  exercises: DEFAULT_EXERCISES,
  entries: [],
  skips: [],
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateOffset(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadState(): CompetitionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_STATE
    const parsed = JSON.parse(raw) as Partial<CompetitionState>
    if (!Array.isArray(parsed.participants) || !Array.isArray(parsed.exercises) || !Array.isArray(parsed.entries)) {
      return EMPTY_STATE
    }
    // міграція старих станів без пропусків
    return { ...parsed, skips: Array.isArray(parsed.skips) ? parsed.skips : [] } as CompetitionState
  } catch {
    return EMPTY_STATE
  }
}

/** Детерміноване демо: 4 друзі, записи за останні 14 днів */
function buildDemo(): CompetitionState {
  const participants: Participant[] = [
    { id: 'p-oleh', name: 'Олег', emoji: '🦊', color: PARTICIPANT_COLORS[0] },
    { id: 'p-marichka', name: 'Марічка', emoji: '🦄', color: PARTICIPANT_COLORS[3] },
    { id: 'p-andriy', name: 'Андрій', emoji: '🐻', color: PARTICIPANT_COLORS[1] },
    { id: 'p-sofia', name: 'Софія', emoji: '🦅', color: PARTICIPANT_COLORS[6] },
  ]
  const entries: Entry[] = []
  // базова "форма" кожного учасника для правдоподібних даних
  const form: Record<string, number> = { 'p-oleh': 1.15, 'p-marichka': 0.95, 'p-andriy': 1.3, 'p-sofia': 0.8 }
  const base: Record<string, number> = {
    'ex-pushups': 30,
    'ex-squats': 45,
    'ex-walk-steps': 6500,
    'ex-walk-km': 4.5,
    'ex-run-km': 3.2,
    'ex-plank': 70,
    'ex-pullups': 8,
  }
  for (let day = 13; day >= 0; day--) {
    for (const p of participants) {
      for (const ex of DEFAULT_EXERCISES) {
        // не кожен робить кожну вправу щодня
        const seed = (day * 7 + p.id.length * 13 + ex.id.length * 29) % 10
        if (seed < 4) continue
        const jitter = ((day * 31 + p.id.charCodeAt(2) + ex.id.charCodeAt(3)) % 40) / 100 // 0..0.39
        const raw = base[ex.id] * form[p.id] * (0.75 + jitter)
        const value = ex.unit === 'км' ? Math.round(raw * 10) / 10 : Math.round(raw)
        if (value <= 0) continue
        entries.push({
          id: `demo-${day}-${p.id}-${ex.id}`,
          participantId: p.id,
          exerciseId: ex.id,
          value,
          date: dateOffset(day),
        })
      }
    }
  }
  return {
    participants,
    exercises: DEFAULT_EXERCISES,
    entries,
    skips: [
      { id: 'demo-skip-1', participantId: 'p-sofia', date: dateOffset(2), reason: 'sick' },
      { id: 'demo-skip-2', participantId: 'p-oleh', date: dateOffset(5), reason: 'lazy' },
    ],
  }
}

export function useCompetition() {
  const [state, setState] = useState<CompetitionState>(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // сховище недоступне — працюємо в пам'яті
    }
  }, [state])

  const addParticipant = useCallback((name: string, emoji: string): string => {
    const id = uid()
    setState((s) => ({
      ...s,
      participants: [
        ...s.participants,
        {
          id,
          name: name.trim(),
          emoji,
          color: PARTICIPANT_COLORS[s.participants.length % PARTICIPANT_COLORS.length],
        },
      ],
    }))
    return id
  }, [])

  const removeParticipant = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      participants: s.participants.filter((p) => p.id !== id),
      entries: s.entries.filter((e) => e.participantId !== id),
      skips: s.skips.filter((k) => k.participantId !== id),
    }))
  }, [])

  const addExercise = useCallback((name: string, unit: Unit, emoji: string, normMin?: number, normMax?: number) => {
    setState((s) => ({
      ...s,
      exercises: [...s.exercises, { id: uid(), name: name.trim(), unit, emoji, custom: true, normMin, normMax }],
    }))
  }, [])

  const updateExercise = useCallback((id: string, patch: Partial<Omit<Exercise, 'id'>>) => {
    setState((s) => ({
      ...s,
      exercises: s.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }))
  }, [])

  const removeExercise = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      exercises: s.exercises.filter((e) => e.id !== id),
      entries: s.entries.filter((e) => e.exerciseId !== id),
    }))
  }, [])

  const addEntry = useCallback((participantId: string, exerciseId: string, value: number, date: string) => {
    setState((s) => ({
      ...s,
      entries: [...s.entries, { id: uid(), participantId, exerciseId, value, date, ts: Date.now() }],
      // запис результату знімає пропуск за цей день
      skips: s.skips.filter((k) => !(k.participantId === participantId && k.date === date)),
    }))
  }, [])

  const removeEntry = useCallback((id: string) => {
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }))
  }, [])

  const addSkip = useCallback((participantId: string, date: string, reason: SkipReason) => {
    setState((s) => ({
      ...s,
      // один пропуск на день — попередній перезаписується
      skips: [...s.skips.filter((k) => !(k.participantId === participantId && k.date === date)), {
        id: uid(),
        participantId,
        date,
        reason,
      }],
    }))
  }, [])

  const removeSkip = useCallback((id: string) => {
    setState((s) => ({ ...s, skips: s.skips.filter((k) => k.id !== id) }))
  }, [])

  const loadDemo = useCallback(() => setState(buildDemo()), [])
  const resetAll = useCallback(() => setState(EMPTY_STATE), [])

  /** Застосувати стан, отриманий із сервера спільного доступу */
  const applyRemoteState = useCallback((remote: CompetitionState) => {
    setState({ ...remote, skips: Array.isArray(remote.skips) ? remote.skips : [] })
  }, [])

  return {
    state,
    addParticipant,
    removeParticipant,
    addExercise,
    updateExercise,
    removeExercise,
    addEntry,
    removeEntry,
    addSkip,
    removeSkip,
    loadDemo,
    resetAll,
    applyRemoteState,
  }
}
