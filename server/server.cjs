/**
 * FitChallenge Sync Server — спільний доступ до змагання з кількох пристроїв.
 *
 * Запуск локально:        node server/server.cjs  (порт 8787 або PORT з env)
 * Продакшн (все-в-одному): спочатку `npm run build`, потім `node server/server.cjs` —
 *                         сервер віддасть і API (/api/...), і зібраний додаток з dist/.
 * Розгортання:            будь-який Node-хостинг (Render, Railway, Fly.io, VPS):
 *                         build `npm ci && npm run build`, start `node server/server.cjs`,
 *                         змінна PORT задається хостингом.
 *
 * API:
 *   POST /api/rooms           { state }                → { code, version }      створити кімнату
 *   GET  /api/rooms/:code                              → { state, version, updatedAt }
 *   PUT  /api/rooms/:code     { state, version }       → { version }            запис (optimistic lock)
 *                                                        409 → { version, state } при конфлікті
 *   GET  /api/health                                   → { ok: true }
 *
 * Дані зберігаються у server/data/rooms.json (створюється автоматично).
 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = Number(process.env.PORT || 8787)
const DATA_DIR = path.join(__dirname, 'data')
const DATA_FILE = path.join(DATA_DIR, 'rooms.json')
const MAX_BODY = 2 * 1024 * 1024 // 2 МБ — з запасом для великої історії
const DIST_DIR = path.join(__dirname, '..', 'dist')

// Резервне копіювання у приватний GitHub-репозиторій (на хостингу з тимчасовим диском).
// Задається змінними середовища: GITHUB_BACKUP_TOKEN, GITHUB_BACKUP_REPO (owner/name),
// GITHUB_BACKUP_FILE (за замовчуванням rooms.json). Без них бекап просто вимкнено.
const GH_TOKEN = process.env.GITHUB_BACKUP_TOKEN || ''
const GH_REPO = process.env.GITHUB_BACKUP_REPO || ''
const GH_FILE = process.env.GITHUB_BACKUP_FILE || 'rooms.json'
const BACKUP_ON = Boolean(GH_TOKEN && GH_REPO)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

// Код кімнати без схожих символів (0/O, 1/I/L)
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** @type {Record<string, { state: unknown, version: number, updatedAt: string }>} */
let rooms = {}

function loadData() {
  try {
    rooms = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  } catch {
    rooms = {}
  }
}

// ── Резервна копія у приватному GitHub-репозиторії ──────────────────────────
let backupSha = null
let backupTimer = null
let backupDirty = false

async function ghApi(method, apiPath, body) {
  const res = await fetch(`https://api.github.com${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'fitchallenge-sync',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`)
  return res.json()
}

/** Відновлення даних при старті, якщо локальний файл порожній (свіжий деплой) */
async function restoreFromBackup() {
  if (!BACKUP_ON) return
  try {
    const file = await ghApi('GET', `/repos/${GH_REPO}/contents/${GH_FILE}`)
    if (!file || !file.content) {
      console.log('☁️  Резервної копії поки нема — починаємо з чистого аркуша')
      return
    }
    rooms = JSON.parse(Buffer.from(String(file.content).replace(/\n/g, ''), 'base64').toString('utf8'))
    backupSha = file.sha
    console.log(`☁️  Відновлено з резервної копії: ${Object.keys(rooms).length} кімнат(и)`)
  } catch (e) {
    console.error('☁️  Не вдалося відновити резервну копію:', e.message)
  }
}

async function pushBackup() {
  if (!backupDirty) return
  backupDirty = false
  try {
    const content = Buffer.from(JSON.stringify(rooms, null, 1)).toString('base64')
    const body = { message: `backup ${new Date().toISOString()}`, content }
    if (backupSha) body.sha = backupSha
    const res = await ghApi('PUT', `/repos/${GH_REPO}/contents/${GH_FILE}`, body)
    backupSha = res && res.content && res.content.sha ? res.content.sha : backupSha
    console.log('☁️  Резервну копію оновлено')
  } catch (e) {
    // можливо, sha застарів — заберемо свіжий і спробуємо ще раз
    try {
      const file = await ghApi('GET', `/repos/${GH_REPO}/contents/${GH_FILE}`)
      backupSha = file && file.sha ? file.sha : null
      const content = Buffer.from(JSON.stringify(rooms, null, 1)).toString('base64')
      const body = { message: `backup ${new Date().toISOString()}`, content }
      if (backupSha) body.sha = backupSha
      const res = await ghApi('PUT', `/repos/${GH_REPO}/contents/${GH_FILE}`, body)
      backupSha = res && res.content && res.content.sha ? res.content.sha : backupSha
      console.log('☁️  Резервну копію оновлено (після конфлікту)')
    } catch (e2) {
      backupDirty = true // повторимо при наступній зміні
      console.error('☁️  Помилка резервного копіювання:', e2.message)
    }
  }
}

function scheduleBackup() {
  if (!BACKUP_ON) return
  backupDirty = true
  clearTimeout(backupTimer)
  backupTimer = setTimeout(pushBackup, 15000) // дебаунс 15 с
}

let saveTimer = null
function saveData() {
  // дебаунс запису на диск
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true })
      fs.writeFileSync(DATA_FILE, JSON.stringify(rooms))
    } catch (e) {
      console.error('Помилка збереження:', e.message)
    }
  }, 200)
  scheduleBackup()
}

function makeCode() {
  let code = ''
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  return rooms[code] ? makeCode() : code
}

function send(res, status, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch {
        reject(new Error('invalid json'))
      }
    })
    req.on('error', reject)
  })
}

/** Роздача зібраного фронтенду (dist/) з SPA-fallback на index.html */
function serveStatic(res, pathname) {
  let rel
  try {
    rel = decodeURIComponent(pathname)
  } catch {
    return send(res, 400, { error: 'Bad path' })
  }
  // захист від виходу за межі dist
  let file = path.normalize(path.join(DIST_DIR, rel))
  if (!file.startsWith(DIST_DIR)) return send(res, 403, { error: 'Forbidden' })
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(DIST_DIR, 'index.html')
  }
  if (!fs.existsSync(file)) {
    return send(res, 503, { error: 'Фронтенд не зібрано — виконайте: npm run build' })
  }
  const ext = path.extname(file).toLowerCase()
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    // хешовані ассети Vite можна кешувати назавжди; index.html — ні
    'Cache-Control': /assets/.test(file) ? 'public, max-age=31536000, immutable' : 'no-cache',
  }
  res.writeHead(200, headers)
  fs.createReadStream(file).pipe(res)
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const parts = url.pathname.split('/').filter(Boolean) // ['api','rooms',':code']

  if (req.method === 'OPTIONS') return send(res, 204, {})

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return send(res, 200, { ok: true, rooms: Object.keys(rooms).length, backup: BACKUP_ON })
  }
  if (parts[0] === 'api' && parts[1] === 'rooms') {
    // Створити кімнату
    if (req.method === 'POST' && parts.length === 2) {
      try {
        const body = await readBody(req)
        if (!body || typeof body.state !== 'object' || body.state === null) {
          return send(res, 400, { error: 'Потрібен об\'єкт state' })
        }
        const code = makeCode()
        rooms[code] = { state: body.state, version: 1, updatedAt: new Date().toISOString() }
        saveData()
        return send(res, 201, { code, version: 1 })
      } catch (e) {
        return send(res, 400, { error: e.message })
      }
    }

    const code = (parts[2] || '').toUpperCase()
    if (parts.length === 3 && /^[A-Z2-9]{6}$/.test(code)) {
      const room = rooms[code]

      if (req.method === 'GET') {
        if (!room) return send(res, 404, { error: 'Кімнату не знайдено' })
        return send(res, 200, { state: room.state, version: room.version, updatedAt: room.updatedAt })
      }

      if (req.method === 'PUT') {
        if (!room) return send(res, 404, { error: 'Кімнату не знайдено' })
        try {
          const body = await readBody(req)
          if (!body || typeof body.state !== 'object' || body.state === null) {
            return send(res, 400, { error: 'Потрібен об\'єкт state' })
          }
          if (body.version !== room.version) {
            // конфлікт версій — клієнт має забрати свіжий стан
            return send(res, 409, { version: room.version, state: room.state })
          }
          room.state = body.state
          room.version += 1
          room.updatedAt = new Date().toISOString()
          saveData()
          return send(res, 200, { version: room.version })
        } catch (e) {
          return send(res, 400, { error: e.message })
        }
      }
    }
  }

  // Невідомі /api/* — JSON 404, а не SPA-сторінка
  if (parts[0] === 'api') return send(res, 404, { error: 'Not found' })

  // Усе, що не /api — віддаємо зібраний додаток (SPA)
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(res, url.pathname)

  return send(res, 404, { error: 'Not found' })
})

loadData()
server.listen(PORT, async () => {
  console.log(`🏆 FitChallenge sync server: http://localhost:${PORT}`)
  console.log(`   Кімнат у пам'яті: ${Object.keys(rooms).length} · дані: ${DATA_FILE}`)
  // Свіжий деплой = порожній тимчасовий диск → відновлюємо з резервної копії
  if (Object.keys(rooms).length === 0) await restoreFromBackup()
})

// Перед зупинкою (деплой/перезапуск) — встигаємо записати резервну копію
async function shutdown() {
  clearTimeout(backupTimer)
  if (BACKUP_ON && backupDirty) await pushBackup()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
