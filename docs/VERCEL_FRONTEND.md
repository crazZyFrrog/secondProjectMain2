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

## 7. Кастомный домен: JS/CSS «висят» в Network (Pending)

1. В [`frontend/vite.config.ts`](../frontend/vite.config.ts) для корня сайта задано **`base: '/'`** (или через `VITE_BASE_PATH`, см. комментарии в файле). Иначе пути к чанкам могут указывать не туда.
2. В **Vercel → Domains** домен в статусе **Valid**; откройте сайт с тем же хостом, что привязан (с `www` или без — как настроили редирект).
3. В **Build & Development** не должно быть **Output Directory** не равного **`dist`** (при Root Directory = `frontend`).
4. В **Vercel → Settings → Rewrites** не добавляйте правило, которое отдаёт `index.html` вместо файлов из **`/assets/*`** (статика обычно имеет приоритет, но кастомные правила стоит проверить).
5. После правок `vite.config.ts`: локально `npm run build`, затем push и **Redeploy**; в Vercel задайте **`VITE_API_URL`** для API (на `base` не влияет).
6. **HTML 304, CSS 200, а `index-*.js` вечно «Ожидание»:** это **не** из‑за `FRONTEND_URL` на Amvera. В сборке **`crossorigin` убирается** из `index.html` (плагин в [`frontend/vite.config.ts`](../frontend/vite.config.ts)). Страницы грузятся **лениво** (`React.lazy` в [`frontend/src/App.tsx`](../frontend/src/App.tsx)), vendor выносится в отдельные чанки — меньше один «тяжёлый» ответ при первом заходе. После push — **Redeploy** на Vercel.

7. **`net::ERR_CONNECTION_CLOSED` и в логе «200 (OK)»:** соединение оборвалось **во время передачи тела** ответа (часто HTTP/2, прокси, антивирус, мобильный оператор). Это **не** ошибка React/Vite как таковых. Имеет смысл: открыть тот же деплой по **`*.vercel.app`**, другую сеть/VPN, отключить QUIC в Chrome (см. §8), проверить DNS у домена. Разбиение бандла (п. 6) иногда помогает, если рвётся именно на крупном файле.

## 8. `net::ERR_HTTP2_PING_FAILED` и долгая загрузка JS (~50 с)

Сообщение **`ERR_HTTP2_PING_FAILED`** в Chrome почти всегда связано с **транспортом HTTP/2** (обрыв или блокировка соединения между вами и CDN Vercel), а **не** с `base` в Vite и не с путями к `/assets/`.

Типичные факторы:

- провайдер / **мобильный оператор**, фильтрация или нестабильный маршрут до зарубежных CDN;
- **VPN**, корпоративный прокси, антивирус с проверкой HTTPS;
- временные сбои на стороне **edge Vercel** для вашего региона.

**Что попробовать:**

1. Открыть **`https://myfirstproject.su`** с **другой сети** (мобильный интернет вместо Wi‑Fi или наоборот).
2. Сменить **DNS** на `1.1.1.1` / `8.8.8.8` в настройках системы или роутера.
3. В Chrome отключить **QUIC**: `chrome://flags` → **Experimental QUIC protocol** → **Disabled** (иногда обходит конфликтующие middleboxes).
4. Другой браузер (Firefox, Edge) для сравнения.
5. Проверить тот же деплой по **`*.vercel.app`**: если там всё ок, а на кастомном домене — `ERR_HTTP2_PING_FAILED`, смотреть **DNS/прокси у reg.ru** (не включён ли лишний прокси/«защита» для домена).
6. Написать в [поддержку Vercel](https://vercel.com/help) с указанием региона, провайдера и скриншотом Network — это **инфраструктурная** диагностика.

**Иконка `vite.svg` 404:** в репозитории добавлен [`frontend/public/vite.svg`](../frontend/public/vite.svg) — после redeploy запрос к `/vite.svg` должен отдавать **200** (на работу приложения не влияет, только favicon).
