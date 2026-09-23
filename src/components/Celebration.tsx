import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { DayWinnerRow, StandingRow } from '@/lib/score'
import { plural } from '@/lib/score'

const CONFETTI_COLORS = ['#C8F31D', '#FF6B35', '#4ECDC4', '#FF3E8A', '#8F7BFF', '#FFC800', '#3EA6FF', '#ffffff']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rot: number
  vrot: number
  shape: 'rect' | 'circle'
}

/** Конфеті на canvas — без зовнішніх залежностей */
function useConfetti(active: boolean) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: Particle[] = []
    const spawn = (count: number, fromBottom = false) => {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: fromBottom ? canvas.height + 20 : -20 - Math.random() * canvas.height * 0.3,
          vx: (Math.random() - 0.5) * 2.4,
          vy: fromBottom ? -(6 + Math.random() * 7) : 1.2 + Math.random() * 2.4,
          size: 5 + Math.random() * 7,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 0.22,
          shape: Math.random() > 0.35 ? 'rect' : 'circle',
        })
      }
    }
    spawn(160)
    // Бокові "гармати" на старті
    const burst = setTimeout(() => spawn(120, true), 250)

    let raf = 0
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.vy += 0.045 // гравітація
        p.vx *= 0.995
        p.x += p.vx + Math.sin(p.rot * 2) * 0.6
        p.y += p.vy
        p.rot += p.vrot
        if (p.y > canvas.height + 30) {
          particles.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
      // підживлення, щоб свято не вгасало одразу
      if (particles.length < 90) spawn(24)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(burst)
      window.removeEventListener('resize', resize)
    }
  }, [active])

  return ref
}

interface Props {
  winners: DayWinnerRow[]
  allTimeLeader: StandingRow | null
  dateLabel: string
  open: boolean
  onClose: () => void
}

export default function Celebration({ winners, allTimeLeader, dateLabel, open, onClose }: Props) {
  const confettiRef = useConfetti(open)

  if (!open) return null
  const tie = winners.length > 1
  const leaderIsChampion =
    allTimeLeader != null && winners.some((w) => w.participant.id === allTimeLeader.participant.id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm">
      <canvas ref={confettiRef} className="pointer-events-none fixed inset-0" />
      <button
        onClick={onClose}
        aria-label="Закрити"
        className="absolute right-4 top-4 z-10 rounded-full border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative px-6 text-center">
        <p className="animate-bounce text-7xl sm:text-8xl">🏆</p>
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.35em] text-volt">
          {tie ? 'Чемпіони дня' : 'Чемпіон дня'}
        </p>
        <h2 className="font-display mt-2 text-5xl font-black uppercase leading-tight sm:text-6xl">
          {winners.map((w) => (
            <span key={w.participant.id} className="block">
              {w.participant.emoji} {w.participant.name}
            </span>
          ))}
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          {winners[0].points} {plural(winners[0].points, 'бал', 'бали', 'балів')} ·{' '}
          {winners[0].golds} {plural(winners[0].golds, 'перемога', 'перемоги', 'перемог')} сьогодні
        </p>
        <p className="mt-1 text-sm capitalize text-muted-foreground">{dateLabel}</p>
        <p className="mx-auto mt-6 max-w-sm text-sm text-muted-foreground">
          {tie
            ? 'Неймовірно — нічия на вершині! Завтра все вирішиться ⚔️'
            : 'Так тримати! Решті — завтра новий шанс помститись 💪'}
        </p>

        {/* Лідер за весь час */}
        {allTimeLeader && (
          <div className="mx-auto mt-6 max-w-sm rounded-xl border border-volt/30 bg-volt/5 px-4 py-3">
            {leaderIsChampion ? (
              <p className="text-sm text-muted-foreground">
                👑 {allTimeLeader.participant.name} — ще й{' '}
                <span className="font-bold text-foreground">лідер за весь час</span>:{' '}
                {allTimeLeader.points} {plural(allTimeLeader.points, 'бал', 'бали', 'балів')}!
              </p>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-volt">
                  Лідер за весь час
                </p>
                <p className="mt-1 text-sm">
                  <span className="mr-1.5">{allTimeLeader.participant.emoji}</span>
                  <span className="font-bold">{allTimeLeader.participant.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    {allTimeLeader.points} {plural(allTimeLeader.points, 'бал', 'бали', 'балів')}
                    {allTimeLeader.gold > 0 && ` · 🥇×${allTimeLeader.gold}`}
                    {allTimeLeader.silver > 0 && ` · 🥈×${allTimeLeader.silver}`}
                    {allTimeLeader.bronze > 0 && ` · 🥉×${allTimeLeader.bronze}`}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Наздоганяйте! ⚔️</p>
              </>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-8 rounded-xl bg-volt px-8 py-3 font-bold text-background transition-colors hover:bg-volt/90"
        >
          До завтра! 🔥
        </button>
      </div>
    </div>
  )
}
