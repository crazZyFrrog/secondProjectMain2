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

### Вариант B: корень = весь монорепо

1. **Root Directory** оставить **`.`** (корень репозитория).
2. Используется корневой [`vercel.json`](../vercel.json): **`installCommand`** ставит зависимости в `frontend/`, затем **`buildCommand`** собирает проект, **`outputDirectory`**: `frontend/dist`.
3. Framework Preset: **Other** (или оставить авто).

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

## 6. Лог обрывается после «Installing dependencies» / нет Deployment Summary

Частые причины:

1. **Не задан `installCommand` для монорепо** (исправлено в корневом `vercel.json`) — до `frontend` не доходили зависимости для Vite/TypeScript. Закоммитьте актуальный репозиторий и сделайте **Redeploy**.
2. **Удобнее включить Root Directory = `frontend`** (вариант A выше) — тогда используется `frontend/vercel.json` и стандартный пайплайн Vite.
3. Откройте **Build Logs** целиком (прокрутка / **View Raw**) — строки с **`Error`** или падение **`tsc` / `vite build`** обычно ниже блока `Installing dependencies`.
4. Убедитесь, что задан **`VITE_API_URL`** (см. п. 2); без неё сборка всё равно должна проходить, но прод будет бить в относительный `/api`.
