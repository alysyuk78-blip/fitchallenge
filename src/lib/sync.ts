import type { CompetitionState } from '@/types'

export interface SyncConfig {
  serverUrl: string
  roomCode: string
}

const SYNC_KEY = 'fitchallenge-sync-v1'

export function loadSyncConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(SYNC_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SyncConfig
    return parsed.serverUrl && parsed.roomCode ? parsed : null
  } catch {
    return null
  }
}

export function saveSyncConfig(config: SyncConfig) {
  localStorage.setItem(SYNC_KEY, JSON.stringify(config))
}

export function clearSyncConfig() {
  localStorage.removeItem(SYNC_KEY)
}

export function normalizeServerUrl(url: string): string {
  let u = url.trim().replace(/\/+$/, '')
  if (u && !/^https?:\/\//i.test(u)) u = 'http://' + u
  return u
}

export class SyncError extends Error {
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.status = status
  }
}

export class ConflictError extends Error {
  version: number
  state: CompetitionState
  constructor(version: number, state: CompetitionState) {
    super('conflict')
    this.version = version
    this.state = state
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    throw new SyncError('Сервер недоступний — перевірте адресу та інтернет')
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (res.status === 409) {
    throw new ConflictError(body.version as number, body.state as CompetitionState)
  }
  if (!res.ok) {
    throw new SyncError((body.error as string) || `Помилка сервера (${res.status})`, res.status)
  }
  return body as T
}

export async function checkServer(serverUrl: string): Promise<boolean> {
  try {
    await request<{ ok: boolean }>(`${serverUrl}/api/health`)
    return true
  } catch {
    return false
  }
}

export async function createRoom(
  serverUrl: string,
  state: CompetitionState,
): Promise<{ code: string; version: number }> {
  return request(`${serverUrl}/api/rooms`, { method: 'POST', body: JSON.stringify({ state }) })
}

export async function getRoom(
  serverUrl: string,
  code: string,
): Promise<{ state: CompetitionState; version: number }> {
  return request(`${serverUrl}/api/rooms/${encodeURIComponent(code.toUpperCase())}`)
}

export async function putRoom(
  serverUrl: string,
  code: string,
  state: CompetitionState,
  version: number,
): Promise<{ version: number }> {
  return request(`${serverUrl}/api/rooms/${encodeURIComponent(code.toUpperCase())}`, {
    method: 'PUT',
    body: JSON.stringify({ state, version }),
  })
}
