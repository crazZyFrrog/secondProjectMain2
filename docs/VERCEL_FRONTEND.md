# Деплой фронтенда на Vercel (бэкенд на Amvera)

**Перед деплоем:** полный чеклист с `VITE_API_URL`, локальной сборкой и preview — в [**FRONTEND_PRE_DEPLOY.md**](./FRONTEND_PRE_DEPLOY.md).

Бэкенд: `https://conslanback-vladislav7599.amvera.io`  
API префикс в коде: `/api` (см. `backend/main.py`).

## 1. Подключить проект в Vercel

1. Зайти на [vercel.com](https://vercel.com), импортировать репозиторий с этим монорепо.
2. **Root Directory** оставить **корень репозитория** (как сейчас): в корне уже есть [`vercel.json`](../vercel.json) с `buildCommand` и `outputDirectory` для `frontend/`.
3. Framework Preset можно оставить «Other» — сборка идёт по `vercel.json`.

## 2. Переменная окружения (обязательно)

В Vercel: **Project → Settings → Environment Variables** добавить для **Production** (и при необходимости Preview):

| Name | Value |
|------|--------|
| `VITE_API_URL` | `https://conslanback-vladislav7599.amvera.io/api` |

Важно: у Vite переменные `VITE_*` **подставляются на этапе сборки**. После добавления или изменения переменной нужно **пересобрать** деплой (**Redeploy**).

Логика в коде: [`frontend/src/api/apiClient.ts`](../frontend/src/api/apiClient.ts) — `VITE_API_URL || '/api'`.

## 3. CORS на Amvera

В секретах сейчас `FRONTEND_URL=*` — для запросов с **Authorization: Bearer** это обычно достаточно.

Когда появится постоянный URL Vercel (например `https://xxx.vercel.app`), можно сузить CORS:

- В Amvera задать, например:  
  `FRONTEND_URL=https://ваш-проект.vercel.app`  
  или несколько через запятую:  
  `FRONTEND_URL=https://xxx.vercel.app,http://localhost:5173`

После смены переменных — перезапуск приложения на Amvera.

## 4. Как убедиться, что «можно деплоить»

1. Деплой на Vercel завершился без ошибок сборки.
2. Открыть сайт с Vercel, в DevTools → **Network**: запросы к `conslanback-vladislav7599.amvera.io` со статусом **200** (например логин, список планов).
3. Нет ошибок CORS в консоли браузера.

## 5. Локальная проверка перед пушем

См. [FRONTEND_PRE_DEPLOY.md](./FRONTEND_PRE_DEPLOY.md). Кратко:

1. `frontend/.env.production` из [`frontend/.env.production.example`](../frontend/.env.production.example)
2. `cd frontend && npm run verify:prod` (или из корня: `npm run verify:frontend`)
3. Открыть **http://localhost:4173** и проверить API / CORS / логин
