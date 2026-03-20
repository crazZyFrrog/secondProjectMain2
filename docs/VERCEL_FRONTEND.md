# Деплой фронтенда на Vercel (бэкенд на Amvera)

**Перед деплоем:** полный чеклист с `VITE_API_URL`, локальной сборкой и preview — в [**FRONTEND_PRE_DEPLOY.md**](./FRONTEND_PRE_DEPLOY.md).

Бэкенд: `https://conslanback-vladislav7599.amvera.io`  
API префикс в коде: `/api` (см. `backend/main.py`).

## 1. Подключить проект в Vercel

### Вариант A (рекомендуется): корень проекта = `frontend`

1. Импортировать репозиторий на [vercel.com](https://vercel.com).
2. **Settings → General → Root Directory** → указать **`frontend`** и сохранить.
3. Framework: Vercel подхватит [`frontend/vercel.json`](../frontend/vercel.json) (`framework: vite`, сборка `npm run build`, выход **`dist`**).
4. Переменные окружения и redeploy — как в п. 2 ниже.

Так Vercel выполняет `npm install` и `npm run build` **внутри папки с Vite**, без `cd frontend` — меньше сбоев на новых версиях CLI.

### Вариант B (не используется в репозитории)

Раньше в корне был `vercel.json` с `cd frontend && …`. При **Root Directory = `frontend`** это ломало сборку (`cd frontend: No such file or directory`). Сейчас корневого `vercel.json` **нет** — задайте в Vercel **Root Directory = `frontend`** (вариант A).

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

## 6. Лог обрывается / `cd frontend: No such file or directory`

1. В Vercel должен быть **Root Directory = `frontend`**. Корневого `vercel.json` в репозитории нет — конфиг только [`frontend/vercel.json`](../frontend/vercel.json). Команды **`cd frontend && …`** в **Settings → Build & Development** нужно **удалить** (Override), если вы когда-то задавали их вручную.
2. Откройте **Build Logs** целиком (**View Raw**) — ищите **`Error`** / **`tsc` / `vite build`**.
3. Задайте **`VITE_API_URL`** (см. п. 2); без неё сборка проходит, но прод ходит в относительный `/api`.
4. Если в логах **`Permission denied`** на `node_modules/.bin/tsc`: в [`frontend/package.json`](../frontend/package.json) сборка идёт через **`node ./node_modules/typescript/lib/tsc.js`** и **`node ./node_modules/vite/bin/vite.js`**, без `.bin`-symlink.
