# Проверка фронта перед деплоем на Vercel

Бэкенд (пример): `https://conslanback-vladislav7599.amvera.io/api`

## Шаг 1 — `VITE_API_URL` для локальной «прод»-сборки

Vite подхватывает **`frontend/.env.production`** только при команде **`vite build`** (и `vite build --mode production`).

1. Создайте файл **`frontend/.env.production`** (он в `.gitignore`, в репозиторий не коммитится):

   **Windows (PowerShell), из папки `frontend`:**

   ```powershell
   Copy-Item .env.production.example .env.production
   ```

   **macOS / Linux:**

   ```bash
   cd frontend && cp .env.production.example .env.production
   ```

2. При необходимости отредактируйте `VITE_API_URL` в `.env.production` (должен заканчиваться на **`/api`**, без лишнего слэша в конце).

Альтернатива без файла (только для одной сборки в PowerShell):

```powershell
cd frontend
$env:VITE_API_URL = "https://conslanback-vladislav7599.amvera.io/api"
npm run build
npx vite preview --host --port 4173
```

## Шаг 2 — локальная проверка (сборка + preview)

Из папки **`frontend`**:

```bash
npm run verify:prod
```

Или из **корня** монорепо:

```bash
npm run verify:frontend
```

Скрипт выполняет **`npm run build`** (tsc + vite build) и поднимает **preview** на **http://localhost:4173** (или `http://<ваш-LAN-IP>:4173` из-за `--host`).

### Что проверить в браузере

1. Открыть URL из вывода терминала (обычно `http://localhost:4173`).
2. **DevTools → Network**: запросы к домену Amvera, статусы **200** (например `/api/plans`, логин).
3. **Console**: нет ошибок **CORS**.
4. Сценарии: главная, регистрация/вход, одна защищённая страница (дашборд).

Если **`verify:prod` без `.env.production`**, в сборку не попадёт `VITE_API_URL`, запросы пойдут на относительный **`/api`** и с preview **не ударят** в Amvera — обязательно шаг 1.

## Шаг 3 — деплой на Vercel

1. Закоммитьте код (без `.env.production`).
2. В Vercel: **Settings → Environment Variables** для **Production** (и при необходимости **Preview**):

   | Name | Value |
   |------|--------|
   | `VITE_API_URL` | `https://conslanback-vladislav7599.amvera.io/api` |

3. **Redeploy** после добавления или смены переменных.

4. На Amvera при необходимости уточните CORS:  
   `FRONTEND_URL=https://ваш-проект.vercel.app` (или оставьте `*` на время отладки).

Подробнее: [VERCEL_FRONTEND.md](./VERCEL_FRONTEND.md).

## Ошибка «Failed to fetch» после регистрации (preview / Vercel)

Если в Telegram приходит уведомление о новом пользователе, а в браузере — **Failed to fetch**, обычно падает шаг после `register`: **PATCH /api/clients/me/plan** (выбор тарифа). Браузер перед ним шлёт **OPTIONS** (CORS preflight); middleware не должен требовать для **OPTIONS** заголовок `Authorization`. В бэкенде это исправлено в `backend/main.py` (пропуск `OPTIONS` в auth-middleware). После деплоя бэкенда на Amvera повторите проверку.

## Краткий чеклист

| Действие | Команда / место |
|----------|------------------|
| Локально как прод | `frontend/.env.production` из примера |
| Сборка + preview | `npm run verify:prod` в `frontend` или `npm run verify:frontend` в корне |
| Переменная на Vercel | `VITE_API_URL` в настройках проекта |
| После смены env на Vercel | Redeploy |
