import { useCallback, useEffect, useState } from 'react'

export interface SetDraft {
  participantId: string
  exerciseId: string
  date: string
  sets: number[]
}

const DRAFTS_KEY = 'fitchallenge-drafts-v1'

function loadDrafts(): SetDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const sameKey = (d: SetDraft, p: string, e: string, date: string) =>
  d.participantId === p && d.exerciseId === e && d.date === date

/**
 * Чернетки підходів: локально (без синхронізації) — це особистий робочий стан,
 * у спільний залік йде лише сума після «Фінішу».
 */
export function useSetDrafts() {
  const [drafts, setDrafts] = useState<SetDraft[]>(loadDrafts)

  useEffect(() => {
    try {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
    } catch {
      // сховище недоступне
    }
  }, [drafts])

  const addSet = useCallback((participantId: string, exerciseId: string, date: string, value: number) => {
    setDrafts((ds) => {
      const i = ds.findIndex((d) => sameKey(d, participantId, exerciseId, date))
      if (i >= 0) {
        const next = [...ds]
        next[i] = { ...next[i], sets: [...next[i].sets, value] }
        return next
      }
      return [...ds, { participantId, exerciseId, date, sets: [value] }]
    })
  }, [])

  const removeSet = useCallback((participantId: string, exerciseId: string, date: string, index: number) => {
    setDrafts((ds) =>
      ds
        .map((d) =>
          sameKey(d, participantId, exerciseId, date)
            ? { ...d, sets: d.sets.filter((_, i) => i !== index) }
            : d,
        )
        .filter((d) => d.sets.length > 0),
    )
  }, [])

  const clearDraft = useCallback((participantId: string, exerciseId: string, date: string) => {
    setDrafts((ds) => ds.filter((d) => !sameKey(d, participantId, exerciseId, date)))
  }, [])

  return { drafts, addSet, removeSet, clearDraft }
}
