import Pictogram, { type PictogramName } from '@/components/pictograms'
import type { Exercise } from '@/types'

/** Спортивні піктограми для стандартних вправ (за id). Користувацькі вправи — емодзі. */
const EXERCISE_PICTOGRAMS: Record<string, PictogramName> = {
  'ex-pushups': 'pushup', // віджимання від підлоги
  'ex-squats': 'squat', // присідання
  'ex-walk-steps': 'walk', // ходьба (кроки)
  'ex-walk-km': 'walk', // ходьба (км)
  'ex-run-km': 'run', // біг
  'ex-cycling': 'cycling', // велопробіг
  'ex-plank': 'plank', // планка
  'ex-pullups': 'pullup', // підтягування
  'ex-core': 'core', // м'язи кора
}

interface Props {
  exercise: Pick<Exercise, 'id' | 'emoji' | 'name'>
  className?: string
}

export default function ExerciseIcon({ exercise, className = 'h-5 w-5' }: Props) {
  const pictogram = EXERCISE_PICTOGRAMS[exercise.id]
  if (pictogram) return <Pictogram name={pictogram} className={className} />
  return <span className={className}>{exercise.emoji}</span>
}
