import type { ReactNode } from 'react'

export type PictogramName =
  | 'pushup'
  | 'finish'
  | 'plank'
  | 'pullup'
  | 'cycling'
  | 'core'
  | 'run'
  | 'walk'
  | 'squat'

/** Обгортка: єдиний стиль для всіх піктограм — 24×24, контур currentColor, круглі кінці */
function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const HEAD = { fill: 'currentColor', stroke: 'none' } as const

/** Віджимання від підлоги — фігура в упорі, лінія підлоги */
function Pushup({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="5.4" cy="7.4" r="2" {...HEAD} />
      <path d="M7.9 9.7 L13.4 12.3 L19.2 15.5" />
      <path d="M7.9 9.7 L7.1 14.3 L8.9 18.7" />
      <path d="M19.2 15.5 L20.2 19" />
      <path d="M3 19.4 L21 19.4" />
    </Svg>
  )
}

/** Фініш — два схрещені картаті прапорці */
function Finish({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M7 21 L10.6 4.8" />
      <path d="M17 21 L13.4 4.8" />
      <path d="M10.6 4.8 L4.8 7 L6 11.6 L11.2 9.7" />
      <path d="M13.4 4.8 L19.2 7 L18 11.6 L12.8 9.7" />
      <rect x="6.5" y="7.3" width="1.6" height="1.6" {...HEAD} stroke="none" />
      <rect x="8.4" y="8.6" width="1.6" height="1.6" {...HEAD} stroke="none" />
      <rect x="15.9" y="7.3" width="1.6" height="1.6" {...HEAD} stroke="none" />
      <rect x="14" y="8.6" width="1.6" height="1.6" {...HEAD} stroke="none" />
    </Svg>
  )
}

/** Планка — прямі руки, тіло по діагоналі */
function Plank({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="5" cy="8" r="2" {...HEAD} />
      <path d="M7.5 9.9 L19.4 14.7" />
      <path d="M7.5 9.9 L6.7 19.2" />
      <path d="M19.4 14.7 L20.4 19.2" />
    </Svg>
  )
}

/** Підтягування — фігура висить на турніку */
function Pullup({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M3 4.6 L21 4.6" />
      <path d="M8.4 4.6 L10.8 10" />
      <path d="M15.6 4.6 L13.2 10" />
      <circle cx="12" cy="8.2" r="1.9" {...HEAD} />
      <path d="M12 10.6 L12 14.6" />
      <path d="M12 14.6 L9.3 17.1 L11.4 20.4" />
    </Svg>
  )
}

/** Велопробіг — велосипедист */
function Cycling({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="6.2" cy="17" r="3.4" />
      <circle cx="17.8" cy="17" r="3.4" />
      <circle cx="13.8" cy="4.3" r="1.9" {...HEAD} />
      <path d="M13 7.2 L10.4 10.6" />
      <path d="M12.5 8 L16.2 9.9 L17.5 8.5" />
      <path d="M10.4 10.6 L13.1 13.5 L10.9 16.6" />
    </Svg>
  )
}

/** М'язи кора — скручування лежачи, коліна підняті */
function Core({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="6" cy="10.4" r="1.9" {...HEAD} />
      <path d="M7.8 12.4 L12.4 16.8" />
      <path d="M12.4 16.8 L15.8 12.7" />
      <path d="M15.8 12.7 L18.6 18.5" />
      <path d="M3 19.2 L21 19.2" />
    </Svg>
  )
}

/** Біг — фігура в русі */
function Run({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="14.8" cy="4.3" r="2" {...HEAD} />
      <path d="M13.6 7.3 L11 12.3" />
      <path d="M13.4 8.1 L15.9 10.5 L18.1 8.9" />
      <path d="M13.2 8.3 L10.1 10.7 L8 9.7" />
      <path d="M11 12.3 L14.7 15.3 L17.7 19.4" />
      <path d="M11 12.3 L7.7 14.9 L5.3 18.7" />
    </Svg>
  )
}

/** Ходьба — фігура йде */
function Walk({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="13" cy="4.5" r="2" {...HEAD} />
      <path d="M12.9 7.9 L11.8 12.7" />
      <path d="M12.7 8.5 L15.6 10.4 L17.2 8.7" />
      <path d="M12.5 8.5 L9.5 10.9" />
      <path d="M11.8 12.7 L15 16.1 L16.4 19.9" />
      <path d="M11.8 12.7 L9.1 16.3 L7 19.5" />
    </Svg>
  )
}

/** Присідання — фігура у присяді, руки вперед */
function Squat({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="12.6" cy="4.3" r="2" {...HEAD} />
      <path d="M12.3 7.1 L11.5 12.3" />
      <path d="M12.1 8.3 L16.8 10.9" />
      <path d="M11.5 12.3 L16.9 13.1" />
      <path d="M16.9 13.1 L16.5 18.7" />
      <path d="M16.5 18.7 L19.5 18.7" />
    </Svg>
  )
}

const PICTOGRAMS: Record<PictogramName, (p: { className?: string }) => ReactNode> = {
  pushup: Pushup,
  finish: Finish,
  plank: Plank,
  pullup: Pullup,
  cycling: Cycling,
  core: Core,
  run: Run,
  walk: Walk,
  squat: Squat,
}

interface Props {
  name: PictogramName
  className?: string
}

/** Спортивна піктограма у єдиному стилі (наслідує currentColor) */
export default function Pictogram({ name, className = 'h-4 w-4' }: Props) {
  const Icon = PICTOGRAMS[name]
  return <Icon className={className} />
}
