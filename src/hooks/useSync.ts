import { useCallback, useEffect, useRef, useState } from 'react'
import type { CompetitionState } from '@/types'
import {
  clearSyncConfig,
  ConflictError,
  createRoom,
  getRoom,
  loadSyncConfig,
  normalizeServerUrl,
  putRoom,
  saveSyncConfig,
  type SyncConfig,
} from '@/lib/sync'

export type SyncStatus = 'off' | 'connecting' | 'ok' | 'error'

const POLL_MS = 5000
const PUSH_DEBOUNCE_MS = 800

/**
 * Синхронізація стану змагання з сервером спільного доступу.
 * Стратегія: optimistic locking за версією; при конфлікті перемагає сервер.
 */
export function useSync(
  state: CompetitionState,
  applyRemoteState: (s: CompetitionState) => void,
) {
  const [config, setConfig] = useState<SyncConfig | null>(loadSyncConfig)
  const [status, setStatus] = useState<SyncStatus>(loadSyncConfig() ? 'connecting' : 'off')
  const [error, setError] = useState<string | null>(null)

  const versionRef = useRef(0)
  const lastSyncedJsonRef = useRef<string | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pushingRef = useRef(false)

  const applyRemote = useCallback(
    (remote: CompetitionState, version: number) => {
      versionRef.current = version
      lastSyncedJsonRef.current = JSON.stringify(remote)
      applyRemoteState(remote)
    },
    [applyRemoteState],
  )

  /** Підключення до наявної кімнати при завантаженні сторінки */
  useEffect(() => {
    if (!config) return
    let cancelled = false
    ;(async () => {
      try {
        const room = await getRoom(config.serverUrl, config.roomCode)
        if (cancelled) return
        applyRemote(room.state, room.version)
        setStatus('ok')
        setError(null)
      } catch (e) {
        if (cancelled) return
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Помилка підключення')
      }
    })()
    return () => {
      cancelled = true
    }
    // лише при монтуванні / зміні кімнати
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.serverUrl, config?.roomCode])

  /** Опитування сервера — підтягуємо зміни друзів */
  useEffect(() => {
    if (!config || status === 'off') return
    const timer = setInterval(async () => {
      if (pushingRef.current) return
      try {
        const room = await getRoom(config.serverUrl, config.roomCode)
        if (room.version !== versionRef.current) {
          applyRemote(room.state, room.version)
        }
        setStatus('ok')
        setError(null)
      } catch (e) {
        if (e instanceof ConflictError) return // не буває на GET
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Помилка синхронізації')
      }
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [config, status, applyRemote])

  /** Надсилання локальних змін на сервер (з дебаунсом) */
  useEffect(() => {
    if (!config || status === 'off') return
    const json = JSON.stringify(state)
    if (json === lastSyncedJsonRef.current) return // зміна прийшла з сервера

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    pushTimerRef.current = setTimeout(async () => {
      pushingRef.current = true
      try {
        const res = await putRoom(config.serverUrl, config.roomCode, stateRef.current, versionRef.current)
        versionRef.current = res.version
        lastSyncedJsonRef.current = JSON.stringify(stateRef.current)
        setStatus('ok')
        setError(null)
      } catch (e) {
        if (e instanceof ConflictError) {
          // хтось встиг записати раніше — застосовуємо серверний стан
          applyRemote(e.state, e.version)
        } else {
          setStatus('error')
          setError(e instanceof Error ? e.message : 'Помилка синхронізації')
        }
      } finally {
        pushingRef.current = false
      }
    }, PUSH_DEBOUNCE_MS)

    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    }
  }, [state, config, status, applyRemote])

  const connect = useCallback(
    async (serverUrlRaw: string, roomCodeRaw?: string): Promise<string | null> => {
      const serverUrl = normalizeServerUrl(serverUrlRaw)
      if (!serverUrl) {
        setError('Вкажіть адресу сервера')
        return null
      }
      setStatus('connecting')
      setError(null)
      try {
        if (roomCodeRaw?.trim()) {
          // приєднання: серверний стан замінює локальний
          const code = roomCodeRaw.trim().toUpperCase()
          const room = await getRoom(serverUrl, code)
          const cfg = { serverUrl, roomCode: code }
          saveSyncConfig(cfg)
          versionRef.current = room.version
          lastSyncedJsonRef.current = JSON.stringify(room.state)
          applyRemoteState(room.state)
          setConfig(cfg)
        } else {
          // нова кімната: публікуємо поточний локальний стан
          const res = await createRoom(serverUrl, stateRef.current)
          const cfg = { serverUrl, roomCode: res.code }
          saveSyncConfig(cfg)
          versionRef.current = res.version
          lastSyncedJsonRef.current = JSON.stringify(stateRef.current)
          setConfig(cfg)
        }
        setStatus('ok')
        return null
      } catch (e) {
        setStatus(config ? 'error' : 'off')
        const msg = e instanceof Error ? e.message : 'Помилка підключення'
        setError(msg)
        return msg
      }
    },
    [applyRemoteState, config],
  )

  const disconnect = useCallback(() => {
    clearSyncConfig()
    setConfig(null)
    setStatus('off')
    setError(null)
    versionRef.current = 0
    lastSyncedJsonRef.current = null
  }, [])

  return { config, status, error, connect, disconnect }
}
