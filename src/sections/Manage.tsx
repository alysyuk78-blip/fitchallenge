import { toast } from 'sonner'
import { Dumbbell, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import ParticipantDialog from '@/components/ParticipantDialog'
import ExerciseIcon from '@/components/ExerciseIcon'
import ExerciseDialog from '@/components/ExerciseDialog'
import { normLabel, plural } from '@/lib/score'
import type { CompetitionState, Exercise, Unit } from '@/types'

interface Props {
  state: CompetitionState
  onAddParticipant: (name: string, emoji: string) => string
  onRemoveParticipant: (id: string) => void
  onAddExercise: (name: string, unit: Unit, emoji: string, normMin?: number, normMax?: number) => void
  onUpdateExercise: (id: string, patch: Partial<Omit<Exercise, 'id'>>) => void
  onRemoveExercise: (id: string) => void
  onResetAll: () => void
}

export default function Manage({
  state,
  onAddParticipant,
  onRemoveParticipant,
  onAddExercise,
  onUpdateExercise,
  onRemoveExercise,
  onResetAll,
}: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Учасники */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-volt" />
            <h3 className="font-display text-sm font-bold uppercase tracking-widest">
              Учасники <span className="text-muted-foreground">({state.participants.length})</span>
            </h3>
          </div>
          <ParticipantDialog
            takenEmojis={state.participants.map((p) => p.emoji)}
            onAdd={onAddParticipant}
            trigger={
              <Button size="sm" className="bg-volt text-background hover:bg-volt/90">
                <Plus className="mr-1 h-4 w-4" /> Додати
              </Button>
            }
          />
        </div>
        {state.participants.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Додайте друзів, які беруть участь у змаганні. Нових учасників можна додавати в будь-який момент.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {state.participants.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                  style={{ backgroundColor: p.color + '26' }}
                >
                  {p.emoji}
                </span>
                <span className="font-medium">{p.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {state.entries.filter((e) => e.participantId === p.id).length}{' '}
                  {plural(state.entries.filter((e) => e.participantId === p.id).length, 'запис', 'записи', 'записів')}
                </span>
                <ConfirmDelete
                  title={`Видалити ${p.name}?`}
                  description="Усі записи цього учасника також будуть видалені."
                  onConfirm={() => {
                    onRemoveParticipant(p.id)
                    toast.success(`${p.name} видалено`)
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Вправи */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-volt" />
            <h3 className="font-display text-sm font-bold uppercase tracking-widest">
              Вправи <span className="text-muted-foreground">({state.exercises.length})</span>
            </h3>
          </div>
          <ExerciseDialog
            onAdd={onAddExercise}
            trigger={
              <Button size="sm" className="bg-volt text-background hover:bg-volt/90">
                <Plus className="mr-1 h-4 w-4" /> Додати
              </Button>
            }
          />
        </div>
        <div className="divide-y divide-border">
          {state.exercises.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-lg">
                <ExerciseIcon exercise={e} className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{e.name}</p>
                <p className="text-xs text-muted-foreground">
                  одиниця: {e.unit}
                  {normLabel(e) && <span className="text-volt"> · норма: {normLabel(e)}</span>}
                </p>
              </div>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {state.entries.filter((x) => x.exerciseId === e.id).length}{' '}
                {plural(state.entries.filter((x) => x.exerciseId === e.id).length, 'запис', 'записи', 'записів')}
              </span>
              <ExerciseDialog
                exercise={e}
                onSave={onUpdateExercise}
                trigger={
                  <button
                    aria-label={`Редагувати ${e.name}`}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                }
              />
              <ConfirmDelete
                title={`Видалити вправу «${e.name}»?`}
                description="Усі записи цієї вправи також будуть видалені."
                onConfirm={() => {
                  onRemoveExercise(e.id)
                  toast.success(`Вправу «${e.name}» видалено`)
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Небезпечна зона */}
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 sm:p-5 lg:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-destructive">Скинути все</p>
            <p className="text-sm text-muted-foreground">
              Видаляє учасників, власні вправи та всі записи. Дію не можна скасувати.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Скинути змагання
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Скинути все змагання?</AlertDialogTitle>
                <AlertDialogDescription>
                  Будуть видалені всі учасники, власні вправи та кожен записаний результат.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Скасувати</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onResetAll()
                    toast.success('Змагання скинуто')
                  }}
                >
                  Так, скинути
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

function ConfirmDelete({
  title,
  description,
  onConfirm,
}: {
  title: string
  description: string
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          aria-label="Видалити"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Скасувати</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Видалити</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
