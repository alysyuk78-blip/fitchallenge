import type { CompetitionState, Entry, Exercise, Participant } from '@/types'

/** Сума результатів учасника за вправу */
export function totalFor(entries: Entry[], participantId: string, exerciseId: string): number {
  let sum = 0
  for (const e of entries) {
    if (e.participantId === participantId && e.exerciseId === exerciseId) sum += e.value
  }
  return Math.round(sum * 10) / 10
}

export interface ExerciseRankRow {
  participant: Participant
  total: number
  rank: number // 1 = лідер (щільний ранг: однакові суми = однаковий ранг)
}

/** Рейтинг учасників у межах однієї вправи (тільки ті, хто має результат > 0) */
export function rankExercise(participants: Participant[], entries: Entry[], exerciseId: string): ExerciseRankRow[] {
  const rows = participants
    .map((p) => ({ participant: p, total: totalFor(entries, p.id, exerciseId) }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
  let rank = 0
  let prev = Number.NaN
  return rows.map((r, i) => {
    if (r.total !== prev) {
      rank = i + 1
      prev = r.total
    }
    return { ...r, rank }
  })
}

export interface StandingRow {
  participant: Participant
  gold: number
  silver: number
  bronze: number
  points: number // 3/2/1 за медалі
}

/** Загальний залік: медалі за кожну вправу (золото=3 бали, срібло=2, бронза=1) */
export function computeStandings(state: CompetitionState): StandingRow[] {
  const rows: StandingRow[] = state.participants.map((p) => ({
    participant: p,
    gold: 0,
    silver: 0,
    bronze: 0,
    points: 0,
  }))
  const byId = new Map(rows.map((r) => [r.participant.id, r]))
  for (const ex of state.exercises) {
    const ranked = rankExercise(state.participants, state.entries, ex.id)
    for (const r of ranked) {
      const row = byId.get(r.participant.id)
      if (!row) continue
      if (r.rank === 1) {
        row.gold += 1
        row.points += 3
      } else if (r.rank === 2) {
        row.silver += 1
        row.points += 2
      } else if (r.rank === 3) {
        row.bronze += 1
        row.points += 1
      }
    }
  }
  return rows.sort(
    (a, b) => b.points - a.points || b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze,
  )
}

/** Усі дати з записами, відсортовані за зростанням */
export function activeDates(entries: Entry[]): string[] {
  return [...new Set(entries.map((e) => e.date))].sort()
}

export interface DayPoint {
  date: string
  [participantId: string]: number | string
}

/** Кумулятивний прогрес за вправою по днях для кожного учасника */
export function cumulativeSeries(
  participants: Participant[],
  entries: Entry[],
  exercise: Exercise,
): DayPoint[] {
  const dates = activeDates(entries.filter((e) => e.exerciseId === exercise.id))
  const sums: Record<string, number> = {}
  for (const p of participants) sums[p.id] = 0
  return dates.map((date) => {
    for (const e of entries) {
      if (e.exerciseId === exercise.id && e.date === date) {
        sums[e.participantId] = Math.round((sums[e.participantId] + e.value) * 10) / 10
      }
    }
    const point: DayPoint = { date }
    for (const p of participants) point[p.id] = sums[p.id]
    return point
  })
}

const nf = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 })

export function fmt(n: number): string {
  return nf.format(n)
}

export function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

export function fmtDateFull(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('uk-UA', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

/** Українське відмінювання: plural(1, 'запис', 'записи', 'записів') → 'запис' */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = Math.abs(n) % 10
  const mod100 = Math.abs(n) % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/** Сума результатів учасника за вправу за конкретний день */
export function daySumFor(entries: Entry[], participantId: string, exerciseId: string, date: string): number {
  let sum = 0
  for (const e of entries) {
    if (e.participantId === participantId && e.exerciseId === exerciseId && e.date === date) sum += e.value
  }
  return Math.round(sum * 10) / 10
}

export type NormStatus = 'below' | 'ok' | 'above' | 'none'

/** Статус учасника відносно денної норми вправи */
export function normStatus(exercise: Exercise, daySum: number): NormStatus {
  const hasMin = exercise.normMin != null && exercise.normMin > 0
  const hasMax = exercise.normMax != null && exercise.normMax > 0
  if (!hasMin && !hasMax) return 'none'
  if (hasMax && daySum > (exercise.normMax as number)) return 'above'
  if (hasMin && daySum < (exercise.normMin as number)) return 'below'
  return 'ok'
}

/** Текстовий опис норми: "30–100 разів/день", "від 30 разів/день" */
export function normLabel(exercise: Exercise): string | null {
  const hasMin = exercise.normMin != null && exercise.normMin > 0
  const hasMax = exercise.normMax != null && exercise.normMax > 0
  if (!hasMin && !hasMax) return null
  if (hasMin && hasMax) return `${fmt(exercise.normMin as number)}–${fmt(exercise.normMax as number)} ${exercise.unit}/день`
  if (hasMin) return `від ${fmt(exercise.normMin as number)} ${exercise.unit}/день`
  return `до ${fmt(exercise.normMax as number)} ${exercise.unit}/день`
}

export interface DayWinnerRow {
  participant: Participant
  points: number
  golds: number
  silvers: number
  /** сумарний обсяг за день (усі вправи) — фінальний тай-брейк */
  volume: number
}

/**
 * Чемпіон дня — завжди ОДИН. Бали 3/2/1 за місця в вправах дня;
 * при рівності балів тай-брейк: більше золота → більше срібла →
 * більший сумарний обсяг → стабільний id (детерміновано).
 */
export function dayWinners(state: CompetitionState, date: string): DayWinnerRow[] {
  const rows: DayWinnerRow[] = state.participants.map((p) => ({
    participant: p,
    points: 0,
    golds: 0,
    silvers: 0,
    volume: 0,
  }))
  const byId = new Map(rows.map((r) => [r.participant.id, r]))
  for (const ex of state.exercises) {
    const dayEntries = state.entries.filter((e) => e.exerciseId === ex.id && e.date === date)
    if (dayEntries.length === 0) continue
    const ranked = rankExercise(state.participants, dayEntries, ex.id)
    for (const r of ranked) {
      const row = byId.get(r.participant.id)
      if (!row) continue
      if (r.rank === 1) {
        row.points += 3
        row.golds += 1
      } else if (r.rank === 2) {
        row.points += 2
        row.silvers += 1
      } else if (r.rank === 3) row.points += 1
    }
  }
  for (const e of state.entries) {
    if (e.date !== date) continue
    const row = byId.get(e.participantId)
    if (row) row.volume += e.value
  }
  const best = Math.max(0, ...rows.map((r) => r.points))
  if (best === 0) return []
  const top = rows.filter((r) => r.points === best)
  if (top.length === 1) return top
  top.sort(
    (a, b) =>
      b.golds - a.golds ||
      b.silvers - a.silvers ||
      b.volume - a.volume ||
      a.participant.id.localeCompare(b.participant.id),
  )
  return [top[0]]
}

/* ── Чемпіони за періодами ── */

export type Period = 'day' | 'week' | 'month' | 'all'

export const PERIOD_LABELS: Record<Period, string> = {
  day: 'День',
  week: 'Тиждень',
  month: 'Місяць',
  all: 'Весь час',
}

/** Діапазон дат [from, to] включно для періоду; all → без обмежень */
export function periodRange(period: Period, today: string): { from: string | null; to: string | null } {
  if (period === 'all') return { from: null, to: null }
  if (period === 'day') return { from: today, to: today }
  const d = new Date(today + 'T00:00:00')
  if (period === 'week') {
    // тиждень з понеділка
    const dow = (d.getDay() + 6) % 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - dow)
    return { from: toISODate(monday), to: today }
  }
  // month
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  return { from: toISODate(first), to: today }
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface ChampionRow {
  participant: Participant
  points: number
  gold: number
  silver: number
  bronze: number
  /** сумарна «робота» за період у кількості записів */
  entries: number
}

/** Рейтинг за період: медалі 3/2/1 за кожну вправу в межах діапазону дат */
export function championsForPeriod(
  state: CompetitionState,
  from: string | null,
  to: string | null,
): ChampionRow[] {
  const inRange = (date: string) => (!from || date >= from) && (!to || date <= to)
  const rows: ChampionRow[] = state.participants.map((p) => ({
    participant: p,
    points: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
    entries: 0,
  }))
  const byId = new Map(rows.map((r) => [r.participant.id, r]))
  for (const ex of state.exercises) {
    const scoped = state.entries.filter((e) => e.exerciseId === ex.id && inRange(e.date))
    if (scoped.length === 0) continue
    const ranked = rankExercise(state.participants, scoped, ex.id)
    for (const r of ranked) {
      const row = byId.get(r.participant.id)
      if (!row) continue
      if (r.rank === 1) {
        row.gold += 1
        row.points += 3
      } else if (r.rank === 2) {
        row.silver += 1
        row.points += 2
      } else if (r.rank === 3) {
        row.bronze += 1
        row.points += 1
      }
    }
  }
  for (const e of state.entries) {
    if (!inRange(e.date)) continue
    const row = byId.get(e.participantId)
    if (row) row.entries += 1
  }
  return rows.sort(
    (a, b) => b.points - a.points || b.gold - a.gold || b.silver - a.silver || b.entries - a.entries,
  )
}

/* ── Стрік: дні поспіль з результатами (до сьогодні включно) ── */

export function streakDays(entries: Entry[], participantId: string, today: string): number {
  const dates = new Set(entries.filter((e) => e.participantId === participantId).map((e) => e.date))
  let streak = 0
  const d = new Date(today + 'T00:00:00')
  // якщо сьогодні ще немає запису — стрік рахується від вчора
  if (!dates.has(toISODate(d))) d.setDate(d.getDate() - 1)
  while (dates.has(toISODate(d))) {
    streak += 1
    d.setDate(d.getDate() - 1)
  }
  return streak
}

/* ── Мотиваційні цитати ── */

export const MOTIVATIONAL_QUOTES: string[] = [
  'Невеликий прогрес щодня — це великий результат за рік.',
  'Не зупиняйся, коли втомився. Зупинись, коли завершив.',
  'Твоє єдине змагання — ти вчорашній.',
  'Дисципліна перемагає мотивацію. Але сьогодні хай буде і те, і те.',
  'Хто тренується сьогодні — перемагає завтра.',
  'Потом сьогодні — медалі завтра.',
  'Найважчий підхід — перший. Решта — інерція.',
  'Ти сильніший, ніж твої виправдання.',
  'Чемпіони не народжуються. Вони віджимаються.',
  'Повільний прогрес — це теж прогрес.',
  'Зроби сьогодні те, що завтра скажеш собі «дякую».',
  'Сила не приходить з перемог. Вона приходить з боротьби.',
  'Кожен запис у таблиці — цеглина твоєї перемоги.',
  'Твої друзі вже тренуються. А ти? 😉',
]

/** Цитата дня — стабільна протягом дня */
export function quoteOfDay(today: string): string {
  const d = new Date(today + 'T00:00:00')
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length]
}
