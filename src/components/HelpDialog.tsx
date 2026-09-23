import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-volt text-sm font-black text-background">
        {n}
      </span>
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}

/** Інструкція з користування FitChallenge */
export default function HelpDialog({ trigger }: { trigger: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">Як користуватися</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-5 pb-2">
            <Step n={1} title="Підключіть спільний доступ">
              Кожен грає на своєму пристрої — з дому чи іншого міста. У вкладці «Команда і вправи» →
              «Спільний доступ»: один із вас <b>створює кімнату</b> і ділиться 6-літерним кодом, решта{' '}
              <b>приєднуються за кодом</b>. Усі зміни синхронізуються автоматично кожні кілька секунд.
              Сервер запускається командою{' '}
              <code className="rounded bg-secondary px-1 py-0.5 text-xs">node server/server.cjs</code> на
              будь-якому спільному хостингу.
            </Step>
            <Step n={2} title="Додайте учасників">
              Натисніть <b>+ Учасник</b> у блоці запису або у вкладці «Команда і вправи». Друзів можна
              додавати в будь-який момент — вони одразу з'являться в рейтингу.
            </Step>
            <Step n={3} title="Налаштуйте вправи та норми">
              Є 7 готових вправ; додайте свої з одиницею виміру (разів, кроків, км, хв, сек). Олівець ✏️
              біля вправи — денна норма: <b>мінімум, максимум або обидва</b> (напр., від 50 віджимань або
              до 10 км). У заліку видно відхилення кожного від норми.
            </Step>
            <Step n={4} title="Записуйте результати щодня">
              Оберіть <b>хто</b> → <b>вправу</b> → <b>скільки</b> і дату. Є два способи: <b>«💪 Разово»</b> —
              одне число одразу, або <b>«🔢 Підходи»</b> — додавайте підходи протягом дня (20 + 25 + 15…), а
              наприкінці натисніть <b>«🏁 Фініш»</b> — сума піде в залік одним записом. За запис — залп
              конфеті 🎉, а якщо вийшли в лідери вправи — особливе святкування!
            </Step>
            <Step n={5} title="Пропуск дня — з причиною">
              Не вдалось потренуватися? Перемкніть «💪 Разово» на <b>«😴 Пропуск»</b> і оберіть причину:
              😴 лінь чи 🤕 травма/хвороба. Пропуск видно в історії та біля імені в рейтингу.
            </Step>
            <Step n={6} title="Рейтинг, чемпіон і стрічка дня">
              За кожну вправу перші троє отримують медалі: 🥇 = 3 бали, 🥈 = 2, 🥉 = 1. Вкладка{' '}
              <b>«👑 Чемпіони»</b> показує найкращого за день / тиждень / місяць / весь час. Вкладка{' '}
              <b>«📡 Live»</b> — хто що записав сьогодні, в реальному часі. На подіумі видно 🔥 стрік — скільки
              днів поспіль учасник тренується. Подіум у «Рейтингу» — це залік <b>за весь час</b>, а кнопка{' '}
              <b>«🎉 Підсумок дня»</b> вітає чемпіона <b>саме сьогоднішнього дня</b> (рахуються лише сьогоднішні
              результати) — тому вони можуть відрізнятися. Якщо забули натиснути «Фініш» — червоний бейдж біля
              кнопки «Підсумок дня» нагадає про незакриті підходи.
            </Step>
            <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
              💾 Без підключення до кімнати дані зберігаються лише у вашому браузері. Для гри з друзями
              обов'язково налаштуйте «Спільний доступ» (крок 1).
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
