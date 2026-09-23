const COLORS = ['#C8F31D', '#FF6B35', '#4ECDC4', '#FF3E8A', '#8F7BFF', '#FFC800', '#3EA6FF', '#ffffff']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rot: number
  vrot: number
  circle: boolean
}

/**
 * Разовий залп конфеті з точки (за замовчуванням — центр екрана).
 * Використовується як мікро-винагорода за запис результату.
 */
export function fireConfetti(options?: { count?: number; x?: number; y?: number; spread?: number; power?: number }) {
  if (typeof document === 'undefined') return
  const count = options?.count ?? 60
  const ox = options?.x ?? window.innerWidth / 2
  const oy = options?.y ?? window.innerHeight / 2
  const spread = options?.spread ?? Math.PI * 2
  const power = options?.power ?? 9

  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:70'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }

  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread
    const speed = power * (0.4 + Math.random() * 0.8)
    particles.push({
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.3,
      circle: Math.random() > 0.6,
    })
  }

  let frames = 0
  const tick = () => {
    frames++
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let alive = 0
    for (const p of particles) {
      p.vy += 0.32
      p.vx *= 0.985
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vrot
      if (p.y < canvas.height + 20) alive++
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.globalAlpha = Math.max(0, 1 - frames / 70)
      ctx.fillStyle = p.color
      if (p.circle) {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2.2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      }
      ctx.restore()
    }
    if (alive > 0 && frames < 120) requestAnimationFrame(tick)
    else canvas.remove()
  }
  requestAnimationFrame(tick)
}
