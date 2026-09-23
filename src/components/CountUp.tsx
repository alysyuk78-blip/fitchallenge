import { useEffect, useRef, useState } from 'react'
import { fmt } from '@/lib/score'

/** Число з плавною анімацією «набігання» при зміні значення */
export default function CountUp({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const rafRef = useRef(0)

  useEffect(() => {
    const from = prevRef.current
    const to = value
    prevRef.current = value
    if (from === to) return
    const start = performance.now()
    const duration = 650
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setDisplay(Math.round((from + (to - from) * eased) * 10) / 10)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value])

  return <span className={className}>{fmt(display)}</span>
}
