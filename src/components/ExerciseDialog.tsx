import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EXERCISE_EMOJIS, UNITS } from '@/hooks/useCompetition'
import type { Exercise, Unit } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  trigger: ReactNode
  /** Режим додавання */
  onAdd?: (name: string, unit: Unit, emoji: string, normMin?: number, normMax?: number) => void
  /** Режим редагування існуючої вправи (норми тощо) */
  exercise?: Exercise
  onSave?: (id: string, patch: Partial<Omit<Exercise, 'id'>>) => void
}

function parseNum(s: string): number | undefined {
  const n = Number(s.replace(',', '.'))
  return s.trim() !== '' && Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : undefined
}

/** Діалог додавання / редагування вправи з денною нормою min/max */
export default function ExerciseDialog({ trigger, onAdd, exercise, onSave }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState<Unit>('разів')
  const [emoji, setEmoji] = useState(EXERCISE_EMOJIS[0])
  const [normMin, setNormMin] = useState('')
  const [normMax, setNormMax] = useState('')

  useEffect(() => {
    if (open && exercise) {
      setName(exercise.name)
      setUnit(exercise.unit)
      setEmoji(exercise.emoji)
      setNormMin(exercise.normMin ? String(exercise.normMin) : '')
      setNormMax(exercise.normMax ? String(exercise.normMax) : '')
    }
  }, [open, exercise])

  const min = parseNum(normMin)
  const max = parseNum(normMax)
  const normInvalid = min != null && max != null && min > max

  const submit = () => {
    if (!name.trim() || normInvalid) return
    if (exercise && onSave) {
      onSave(exercise.id, { name: name.trim(), unit, emoji, normMin: min, normMax: max })
      toast.success(`Вправу «${name.trim()}» оновлено`)
    } else if (onAdd) {
      onAdd(name, unit, emoji, min, max)
      toast.success(`Вправу «${name.trim()}» додано`)
    }
    setName('')
    setNormMin('')
    setNormMax('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{exercise ? 'Редагувати вправу' : 'Нова вправа'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            autoFocus
            placeholder="Назва (напр., Бурпі)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="h-11 bg-secondary/50"
          />
          <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
            <SelectTrigger className="h-11 bg-secondary/50">
              <SelectValue placeholder="Одиниця виміру" />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Денна норма для всіх (необов'язково)
            </p>
            <div className="flex items-center gap-2">
              <Input
                inputMode="decimal"
                placeholder="мін"
                value={normMin}
                onChange={(e) => setNormMin(e.target.value.replace(/[^\d.,]/g, ''))}
                className="h-11 bg-secondary/50"
              />
              <span className="text-muted-foreground">—</span>
              <Input
                inputMode="decimal"
                placeholder="макс"
                value={normMax}
                onChange={(e) => setNormMax(e.target.value.replace(/[^\d.,]/g, ''))}
                className="h-11 bg-secondary/50"
              />
              <span className="shrink-0 text-sm text-muted-foreground">{unit}/день</span>
            </div>
            {normInvalid && <p className="mt-1.5 text-xs text-destructive">Мінімум не може бути більшим за максимум</p>}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {EXERCISE_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition-colors',
                  emoji === e ? 'border-volt bg-volt/15' : 'border-border bg-secondary/50 hover:bg-secondary',
                )}
              >
                {e}
              </button>
            ))}
          </div>
          <Button
            onClick={submit}
            disabled={!name.trim() || normInvalid}
            className="w-full bg-volt text-background hover:bg-volt/90"
          >
            {exercise ? 'Зберегти зміни' : 'Додати вправу'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
