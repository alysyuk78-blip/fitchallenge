import { useEffect, useMemo, useState } from 'react'
import { Activity, CalendarDays, CircleHelp, Flame, PartyPopper, Trophy, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import QuickLog from '@/sections/QuickLog'
import Leaderboard from '@/sections/Leaderboard'
import Champions from '@/sections/Champions'
import LiveFeed from '@/sections/LiveFeed'
import Stats from '@/sections/Stats'
import History from '@/sections/History'
import Manage from '@/sections/Manage'
import Celebration from '@/components/Celebration'
import HelpDialog from '@/components/HelpDialog'
import SyncCard from '@/components/SyncCard'
import { todayLocal, useCompetition } from '@/hooks/useCompetition'
import { useSetDrafts } from '@/hooks/useSetDrafts'
import { useSync } from '@/hooks/useSync'
import { activeDates, computeStandings, dayWinners, fmtDateFull, plural, quoteOfDay } from '@/lib/score'

export default function Home() {
  const {
    state,
    addParticipant,
    removeParticipant,
    addExercise,
    updateExercise,
    removeExercise,
    addEntry,
    removeEntry,
    addSkip,
    removeSkip,
    loadDemo,
    resetAll,
    applyRemoteState,
  } = useCompetition()

  const sync = useSync(state, applyRemoteState)
  const { drafts, addSet, removeSet, clearDraft } = useSetDrafts()

  const [tab, setTab] = useState('leaderboard')
  const [celebrate, setCelebrate] = useState(false)

  // Автоскрол активної вкладки у видиму зону (мобільний гаризонтальний список вкладок)
  useEffect(() => {
    document
      .querySelector('[role="tab"][data-state="active"]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [tab])

  const days = useMemo(() => activeDates(state.entries).length, [state.entries])
  const empty = state.participants.length === 0 && state.entries.length === 0
  const today = todayLocal()
  const winners = useMemo(() => dayWinners(state, today), [state, today])
  const allTimeLeader = useMemo(() => {
    const standings = computeStandings(state)
    return standings.length > 0 && standings[0].points > 0 ? standings[0] : null
  }, [state])
  const quote = useMemo(() => quoteOfDay(today), [today])

  // незакриті підходи за сьогодні (цього пристрою)
  const openDraftsToday = useMemo(() => drafts.filter((d) => d.date === today).length, [drafts, today])

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-16 sm:px-6">
      <div className="aurora" aria-hidden />

      {/* Шапка */}
      <header className="flex flex-col gap-4 py-6 sm:py-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-volt">Змагання друзів</p>
            <h1 className="font-display mt-1 text-4xl font-black uppercase leading-none sm:text-5xl">
              Fit<span className="text-volt">Challenge</span>
            </h1>
            <p className="mt-2 max-w-md text-sm italic text-muted-foreground">«{quote}»</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <HelpDialog
              trigger={
                <Button variant="outline" size="sm" aria-label="Інструкція">
                  <CircleHelp className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Інструкція</span>
                </Button>
              }
            />
            {!empty && (
              <span className="relative">
                <Button
                  size="sm"
                  aria-label="Підсумок дня"
                  onClick={() => winners.length > 0 && setCelebrate(true)}
                  disabled={winners.length === 0}
                  title={
                    winners.length === 0
                      ? 'Сьогодні ще ніхто не записав результатів'
                      : 'Привітати чемпіона дня'
                  }
                  className="bg-volt font-bold text-background hover:bg-volt/90 disabled:opacity-40"
                >
                  <PartyPopper className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Підсумок дня</span>
                </Button>
                {openDraftsToday > 0 && (
                  <span
                    title={`Незакриті підходи за сьогодні: ${openDraftsToday}. Відкрийте «Підходи» та натисніть «Фініш»`}
                    className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white shadow-lg"
                  >
                    {openDraftsToday}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
        {!empty && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" /> {state.participants.length}{' '}
              {plural(state.participants.length, 'учасник', 'учасники', 'учасників')}
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="h-4 w-4" /> {state.entries.length}{' '}
              {plural(state.entries.length, 'запис', 'записи', 'записів')}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {days} {plural(days, 'день', 'дні', 'днів')}
            </span>
            {sync.config && (
              <span className="flex items-center gap-1.5 text-volt">
                🌐 кімната {sync.config.roomCode}
              </span>
            )}
          </div>
        )}
        {openDraftsToday > 0 && (
          <button
            onClick={() => document.querySelector<HTMLButtonElement>('[data-mode-sets]')?.click()}
            className="flex items-center gap-2 self-start rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
          >
            <Flame className="h-3.5 w-3.5" />
            У вас незакритий день: {openDraftsToday}{' '}
            {plural(openDraftsToday, 'підхідний лист', 'підхідні листи', 'підхідних листів')} без «Фінішу»
          </button>
        )}
      </header>

      {empty && (
        /* Привітання для нового змагання */
        <div className="mb-6 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center rise-in">
          <Trophy className="mx-auto h-12 w-12 text-volt" />
          <h2 className="font-display mt-4 text-2xl font-black uppercase">Починаємо змагання!</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Додайте друзів-учасників, оберіть вправи (або створіть свої) і записуйте результати щодня.
            Кожен на своєму пристрої — налаштуйте «Спільний доступ» у вкладці «Команда і вправи».
          </p>
          <Button variant="outline" className="mt-6" onClick={loadDemo}>
            Подивитись на демо-даних
          </Button>
        </div>
      )}

      <div className="mb-6">
        <QuickLog
          participants={state.participants}
          exercises={state.exercises}
          entries={state.entries}
          drafts={drafts}
          onAdd={addEntry}
          onAddSkip={addSkip}
          onAddParticipant={addParticipant}
          onAddSet={addSet}
          onRemoveSet={removeSet}
          onClearDraft={clearDraft}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="no-scrollbar mb-6 w-full justify-start overflow-x-auto bg-card">
          <TabsTrigger value="leaderboard" className="font-display uppercase tracking-wide">
            🏆 Рейтинг
          </TabsTrigger>
          <TabsTrigger value="champions" className="font-display uppercase tracking-wide">
            👑 Чемпіони
          </TabsTrigger>
          <TabsTrigger value="live" className="font-display uppercase tracking-wide">
            🔴 Live
          </TabsTrigger>
          <TabsTrigger value="stats" className="font-display uppercase tracking-wide">
            📈 Статистика
          </TabsTrigger>
          <TabsTrigger value="history" className="font-display uppercase tracking-wide">
            🗒 Історія
          </TabsTrigger>
          <TabsTrigger value="manage" className="font-display uppercase tracking-wide">
            ⚙️ Команда і вправи
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Leaderboard state={state} />
        </TabsContent>
        <TabsContent value="champions">
          <Champions state={state} />
        </TabsContent>
        <TabsContent value="live">
          <LiveFeed state={state} synced={sync.status === 'ok'} />
        </TabsContent>
        <TabsContent value="stats">
          <Stats state={state} />
        </TabsContent>
        <TabsContent value="history">
          <History state={state} onRemove={removeEntry} onRemoveSkip={removeSkip} />
        </TabsContent>
        <TabsContent value="manage">
          <div className="space-y-6">
            <SyncCard
              config={sync.config}
              status={sync.status}
              error={sync.error}
              onConnect={sync.connect}
              onDisconnect={sync.disconnect}
            />
            <Manage
              state={state}
              onAddParticipant={addParticipant}
              onRemoveParticipant={removeParticipant}
              onAddExercise={addExercise}
              onUpdateExercise={updateExercise}
              onRemoveExercise={removeExercise}
              onResetAll={resetAll}
            />
          </div>
        </TabsContent>
      </Tabs>

      <Celebration
        winners={winners}
        allTimeLeader={allTimeLeader}
        dateLabel={fmtDateFull(today)}
        open={celebrate && winners.length > 0}
        onClose={() => setCelebrate(false)}
      />

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        {sync.config
          ? `Синхронізація через кімнату ${sync.config.roomCode} · FitChallenge`
          : 'Дані зберігаються локально · увімкніть «Спільний доступ» для гри з друзями · FitChallenge'}
      </footer>
    </div>
  )
}
