import {
  ArrowDownUp,
  BicepsFlexed,
  Dumbbell,
  Footprints,
  Route,
  StretchHorizontal,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import type { Exercise } from '@/types'

/** Преміальні контурні іконки для стандартних вправ (за id). Користувацькі вправи — емодзі. */
const EXERCISE_ICONS: Record<string, LucideIcon> = {
  'ex-pushups': BicepsFlexed, // віджимання — напружений біцепс
  'ex-squats': ArrowDownUp, // присідання — рух вниз-вгору
  'ex-walk-steps': Footprints, // ходьба в кроках — сліди
  'ex-walk-km': Route, // ходьба в км — маршрут
  'ex-run-km': Wind, // біг — швидкість
  'ex-plank': StretchHorizontal, // планка — горизонтальне тіло
  'ex-pullups': Dumbbell, // підтягування — силова
}

interface Props {
  exercise: Pick<Exercise, 'id' | 'emoji' | 'name'>
  className?: string
}

export default function ExerciseIcon({ exercise, className = 'h-4 w-4' }: Props) {
  const Icon = EXERCISE_ICONS[exercise.id]
  if (Icon) return <Icon className={className} aria-label={exercise.name} />
  return <span className={className}>{exercise.emoji}</span>
}
