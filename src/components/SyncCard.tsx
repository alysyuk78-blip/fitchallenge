import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy, Globe, Link2, Unplug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SyncStatus } from '@/hooks/useSync'
import type { SyncConfig } from '@/lib/sync'
import { cn } from '@/lib/utils'

interface Props {
  config: SyncConfig | null
  status: SyncStatus
  error: string | null
  onConnect: (serverUrl: string, roomCode?: string) => Promise<string | null>
  onDisconnect: () => void
}

const STATUS_UI: Record<SyncStatus, { dot: string; label: string }> = {
  off: { dot: 'bg-muted-foreground', label: 'не підключено' },
  connecting: { dot: 'bg-yellow-400 animate-pulse', label: 'підключення…' },
  ok: { dot: 'bg-volt', label: 'синхронізовано' },
  error: { dot: 'bg-red-500', label: 'помилка зв\'язку' },
}

export default function SyncCard({ config, status, error, onConnect, onDisconnect }: Props) {
  const [serverUrl, setServerUrl] = useState('http://localhost:8787')
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const run = async (fn: () => Promise<string | null>, okMsg: string) => {
    setBusy(true)
    const err = await fn()
    setBusy(false)
    if (err) toast.error(err)
    else toast.success(okMsg)
  }

  const copyCode = async () => {
    if (!config) return
    try {
      await navigator.clipboard.writeText(config.roomCode)
    } catch {
      // clipboard API недоступний — код видно на екрані
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const st = STATUS_UI[status]

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden lg:col-span-2">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
        <Globe className="h-4 w-4 text-volt" />
        <h3 className="font-display text-sm font-bold uppercase tracking-widest">Спільний доступ</h3>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn('h-2 w-2 rounded-full', st.dot)} />
          {st.label}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        {config ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Код кімнати</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-display text-3xl font-black tracking-[0.2em] text-volt">{config.roomCode}</span>
                <button
                  onClick={copyCode}
                  aria-label="Скопіювати код"
                  className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {copied ? <Check className="h-4 w-4 text-volt" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                Друзі відкривають свій додаток → «Спільний доступ» → вводять цей код. Усі зміни
                синхронізуються автоматично кожні кілька секунд.
              </p>
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </div>
            <Button variant="outline" size="sm" className="sm:ml-auto" onClick={onDisconnect}>
              <Unplug className="mr-2 h-4 w-4" /> Від'єднатися
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Кожен записує результати на своєму пристрої — з будь-якого міста. Запустіть сервер
              (<code className="rounded bg-secondary px-1.5 py-0.5 text-xs">node server/server.cjs</code> на
              спільному хостингу), створіть кімнату й поділіться кодом з друзями.
            </p>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Адреса сервера
              </p>
              <Input
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://localhost:8787 або https://ваш-сервер.onrender.com"
                className="h-11 bg-secondary/50"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                disabled={busy || !serverUrl.trim()}
                onClick={() => run(() => onConnect(serverUrl), 'Кімнату створено — поділіться кодом!')}
                className="bg-volt font-bold text-background hover:bg-volt/90"
              >
                <Globe className="mr-2 h-4 w-4" /> Створити кімнату з моїми даними
              </Button>
              <div className="flex flex-1 gap-2">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6))}
                  placeholder="КОД КІМНАТИ"
                  className="h-10 max-w-40 bg-secondary/50 text-center font-bold tracking-[0.2em]"
                />
                <Button
                  variant="outline"
                  disabled={busy || joinCode.length !== 6 || !serverUrl.trim()}
                  onClick={() =>
                    run(() => onConnect(serverUrl, joinCode), 'Підключено! Дані друзів завантажено')
                  }
                >
                  <Link2 className="mr-2 h-4 w-4" /> Приєднатися
                </Button>
              </div>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <p className="text-xs text-muted-foreground">
              ⚠️ Приєднуючись за кодом, ваші локальні дані заміняться даними кімнати.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
