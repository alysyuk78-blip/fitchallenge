export type Unit = 'разів' | 'кроків' | 'км' | 'хв' | 'сек'

export interface Participant {
  id: string
  name: string
  emoji: string
  color: string
}

export interface Exercise {
  id: string
  name: string
  unit: Unit
  emoji: string
  custom?: boolean
  /** Денна норма для всіх учасників: мінімум, максимум або обидва (необов'язково) */
  normMin?: number
  normMax?: number
}

export interface Entry {
  id: string
  participantId: string
  exerciseId: string
  value: number
  date: string // YYYY-MM-DD (local)
  ts?: number // мітка часу створення (для live-стрічки)
}

export type SkipReason = 'lazy' | 'sick'

export interface Skip {
  id: string
  participantId: string
  date: string // YYYY-MM-DD (local)
  reason: SkipReason
}

export const SKIP_REASONS: Record<SkipReason, { emoji: string; label: string }> = {
  lazy: { emoji: '😴', label: 'Лінь' },
  sick: { emoji: '🤕', label: 'Травма / хвороба' },
}

export interface CompetitionState {
  participants: Participant[]
  exercises: Exercise[]
  entries: Entry[]
  skips: Skip[]
  /** Версія набору стандартних вправ — для міграції при додаванні нових */
  defaultsVersion?: number
}
