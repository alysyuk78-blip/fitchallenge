# 🚀 Деплой FitChallenge — публічний доступ для друзів

Додаток готовий до деплою **одним сервісом**: сервер (`server/server.cjs`) віддає і API синхронізації, і сам додаток. Нижче — покрокова інструкція для Render.com (безкоштовно, ~10 хвилин).

## Крок 1. Код на GitHub

```bash
cd app
git init            # якщо папка ще не в git
git add .
git commit -m "FitChallenge"
```

Далі на github.com створіть новий репозиторій (наприклад, `fitchallenge`, можна приватний) і виконайте команди, які GitHub покаже:

```bash
git remote add origin https://github.com/ВАШ_АКАУНТ/fitchallenge.git
git branch -M main
git push -u origin main
```

## Крок 2. Render.com

1. Зареєструйтесь на [render.com](https://render.com) (можна через GitHub).
2. **New → Blueprint Instance** → виберіть репозиторій `fitchallenge`.
3. Render сам підхопить `render.yaml`: збірка `npm ci && npm run build`, запуск `node server/server.cjs`.
4. Натисніть **Apply** і дочекайтесь зеленого статусу (3–5 хв).
5. Отримаєте публічне посилання виду `https://fitchallenge.onrender.com`.

> Альтернатива без Blueprint: **New → Web Service** → репозиторій → Build Command `npm ci && npm run build`, Start Command `node server/server.cjs`.

## Крок 3. Підключення друзів

1. Кожен відкриває посилання на своєму телефоні/комп'ютері.
2. Вкладка **«⚙️ Команда і вправи» → «Спільний доступ»**.
3. У поле «Адреса сервера» введіть те саме посилання (`https://fitchallenge.onrender.com`).
4. Хтось один натискає **«Створити кімнату»** і ділиться 6-літерним кодом; решта — **«Приєднатися»** за кодом.
5. Далі все синхронізується автоматично кожні кілька секунд — результати всіх видно у вкладці **«🔴 Live»**.

## Нюанси безкоштовного тарифу Render

- **Перше відкриття** після періоду неактивності може тривати до ~50 сек (сервіс «прокидається») — це нормально.
- **Дані кімнат** зберігаються у файл `server/data/rooms.json` на диску сервісу. На безкоштовному тарифі при рестарті/редеплої файл може бути скинутий. Якщо змагання триватиме місяцями — у Render можна підключити Persistent Disk (платно) або перейти на VPS.

## Локальна перевірка продакшн-режиму

```bash
npm run build
node server/server.cjs   # http://localhost:8787 — і додаток, і API
```
