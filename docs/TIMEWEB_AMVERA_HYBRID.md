# Гибрид Timeweb (фронт) + Amvera (бэкенд) — гайд для новичка

Пошаговая инструкция: **сайт на Timeweb Хостинг**, **API и база данных на Amvera**.  
Не нужны Timeweb Cloud Apps и managed PostgreSQL (~770 ₽/мес).

**Домен в примере:** `myfirstproject.su` (Reg.ru)  
**Бэкенд:** `https://conslanback-vladislav7599.amvera.io`

---

## Содержание

1. [Схема: что где живёт](#1-схема-что-где-живёт)
2. [Подготовка](#2-подготовка)
3. [Шаг 1 — Проверить Amvera](#3-шаг-1--проверить-amvera)
4. [Шаг 2 — Сайт на Timeweb Хостинг](#4-шаг-2--сайт-на-timeweb-хостинг)
5. [Шаг 3 — Сборка фронта на компьютере](#5-шаг-3--сборка-фронта-на-компьютере)
6. [Шаг 4 — Загрузка на хостинг по FTP](#6-шаг-4--загрузка-на-хостинг-по-ftp)
7. [Шаг 5 — CORS на Amvera](#7-шаг-5--cors-на-amvera)
8. [Шаг 6 — Домен myfirstproject.su](#8-шаг-6--домен-myfirstprojectsu)
9. [Шаг 7 — API остаётся на Amvera](#9-шаг-7--api-остаётся-на-amvera)
10. [Шаг 8 — Проверка](#10-шаг-8--проверка)
11. [Шаг 9 — Отключить Vercel](#11-шаг-9--отключить-vercel)
12. [Шаг 10 — Обновление сайта в будущем](#12-шаг-10--обновление-сайта-в-будущем)
13. [Словарь](#13-словарь)
14. [Частые ошибки](#14-частые-ошибки)
15. [Короткий чеклист](#15-короткий-чеклист)

---

## 1. Схема: что где живёт

```
Пользователь
     │
     ▼
myfirstproject.su  (DNS на Reg.ru)
     │
     ▼
Timeweb Хостинг  hosting.timeweb.ru
  └── статические файлы (index.html, assets/, .htaccess)
     │
     │  запросы API из браузера (fetch)
     ▼
Amvera  conslanback-vladislav7599.amvera.io
  └── FastAPI + PostgreSQL
```

| Компонент | Где | Адрес / панель |
|-----------|-----|----------------|
| **Сайт (кнопки, страницы)** | Timeweb **Хостинг** | `hosting.timeweb.ru` |
| **API (логин, проекты)** | **Amvera** | `conslanback-vladislav7599.amvera.io` |
| **База данных** | **Amvera** (PostgreSQL) | Уже настроена, трогать не нужно |
| **Домен** | **Reg.ru** | `myfirstproject.su` |

### Что НЕ нужно для этого сценария

| Сервис | Зачем был | Нужен сейчас? |
|--------|-----------|---------------|
| **timeweb.cloud** (Cloud Apps, PostgreSQL 770 ₽) | Всё в облаке Timeweb | **Нет** |
| **Vercel** | Фронтенд | **Заменяем** на Timeweb Хостинг |
| **MySQL** на `hosting.timeweb.ru` | PHP-сайты | **Нет** — наш API на Amvera |

### Две панели Timeweb — не путать

| Панель | URL | Для гибрида |
|--------|-----|-------------|
| **Хостинг** | `hosting.timeweb.ru` | **Да** — загрузка сайта |
| **Cloud** | `timeweb.cloud` | **Нет** — это другой продукт |

---

## 2. Подготовка

### Аккаунты

| Сервис | Где войти | Что должно быть |
|--------|-----------|-----------------|
| Timeweb Хостинг | [hosting.timeweb.ru](https://hosting.timeweb.ru) | Тариф хостинга (у вас тестовый период) |
| Amvera | [amvera.io](https://amvera.io) | Бэкенд уже задеплоен |
| Reg.ru | [reg.ru](https://reg.ru) | Домен `myfirstproject.su` |

### На компьютере

| Программа | Зачем | Где взять |
|-----------|--------|-----------|
| **Node.js** (LTS) | Сборка фронта `npm run build` | [nodejs.org](https://nodejs.org) |
| **FileZilla** (или другой FTP-клиент) | Загрузка файлов на хостинг | [filezilla-project.org](https://filezilla-project.org) |
| Текстовый редактор | Правка `.env.production` | Блокнот, VS Code |

### Запишите в блокнот (заполните по ходу)

```text
BACKEND_URL = https://conslanback-vladislav7599.amvera.io
VITE_API_URL = https://conslanback-vladislav7599.amvera.io/api
FRONTEND_URL = https://myfirstproject.su
FTP_HOST = (из панели Timeweb)
FTP_LOGIN = (из панели Timeweb)
FTP_PASSWORD = (из панели Timeweb)
```

---

## 3. Шаг 1 — Проверить Amvera

Бэкенд **уже работает** на Amvera. Нужно только убедиться.

### Действия

1. Откройте в браузере:

   ```text
   https://conslanback-vladislav7599.amvera.io/docs
   ```

2. Должна открыться страница **Swagger** (документация API).

3. Альтернативная проверка:

   ```text
   https://conslanback-vladislav7599.amvera.io/health
   ```

   Ожидается ответ вроде `{"status":"ok"}`.

### Если не открывается

1. Войдите на [amvera.io](https://amvera.io) → ваш проект бэкенда.
2. Статус должен быть **Running** / **Работает**.
3. Если остановлен — **Запустить** / **Задеплоить**.
4. Проверьте логи на ошибки (`DATABASE_URL`, `JWT_SECRET`).

### Что записать

| Переменная | Значение |
|------------|----------|
| `VITE_API_URL` (для фронта) | `https://conslanback-vladislav7599.amvera.io/api` |

⚠️ На конце **обязательно** `/api`, **без** слэша после `api`.

**На этом шаге Amvera больше не трогаем** — вернёмся в шаге 5 (CORS).

---

## 4. Шаг 2 — Сайт на Timeweb Хостинг

### 4.1. Вход

1. Откройте [hosting.timeweb.ru](https://hosting.timeweb.ru) (не `timeweb.cloud`).
2. Войдите логином из письма (например `cd252710`).

### 4.2. Создать или выбрать сайт

1. В левом меню: **Сайты**.
2. Если сайта нет — **Создать сайт** / **Добавить**.
3. Укажите домен `myfirstproject.su` (или временное имя — домен привяжете в шаге 6).

### 4.3. Данные FTP — откуда брать

1. Откройте карточку сайта.
2. Найдите раздел **FTP** / **Доступ по FTP** / **Файловый менеджер**.
3. Скопируйте в блокнот:

| Поле | Пример | Куда использовать |
|------|--------|-------------------|
| **Хост (Host)** | `vhXXX.timeweb.ru` или IP | FileZilla → Host |
| **Логин** | `cd252710` или `cd252710_site` | FileZilla → Username |
| **Пароль** | из панели или письма | FileZilla → Password |
| **Порт** | `21` (FTP) или `22` (SFTP) | FileZilla → Port |

### 4.4. Корневая папка сайта

В панели указана **корневая директория** сайта. Обычно одно из:

- `public_html`
- `www`
- `myfirstproject.su/public_html`

**Сюда** (в корень сайта, не в подпапку) позже загрузите файлы из `dist/`.

### 4.5. MySQL — не создавать

Раздел **Базы данных → MySQL** на хостинге **для этого проекта не нужен**. Данные хранятся в PostgreSQL на Amvera.

---

## 5. Шаг 3 — Сборка фронта на компьютере

Фронтенд — это React-приложение. Перед загрузкой на хостинг его **собирают** в папку `dist/` на вашем ПК.

### 5.1. Открыть терминал в папке проекта

**Windows (PowerShell):**

```powershell
cd "C:\Users\1\Desktop\curse\vibe coding\projectSecond\secondProjectMain2\frontend"
```

(Путь замените на свой, если репозиторий лежит в другом месте.)

### 5.2. Создать файл настроек для сборки

```powershell
copy .env.timeweb-hosting.example .env.production
```

Файл `.env.production` **не попадает в Git** — это нормально.

### 5.3. Отредактировать `.env.production`

Откройте `frontend/.env.production` в блокноте. Должна быть **одна** строка (или проверьте, что она верная):

```text
VITE_API_URL=https://conslanback-vladislav7599.amvera.io/api
```

| Правило | Пример |
|---------|--------|
| ✅ С `https://` | `https://conslanback...` |
| ✅ С `/api` на конце | `...amvera.io/api` |
| ❌ Без слэша после api | не `.../api/` |
| ❌ Без пробелов | вокруг `=` |

**Что это делает:** при сборке Vite «вшивает» этот URL в JavaScript. Браузер будет слать запросы на Amvera, а не на Timeweb.

Код: [`frontend/src/api/apiClient.ts`](../frontend/src/api/apiClient.ts) — `VITE_API_URL || '/api'`.

### 5.4. Установить зависимости и собрать

```powershell
npm install
npm run build
```

Ожидаемый результат в конце: `✓ built in ...s`

### 5.5. Проверить папку `dist/`

В `frontend/dist/` должны быть:

| Файл / папка | Назначение |
|--------------|------------|
| `index.html` | Главная страница |
| `assets/` | JS, CSS (с хешами в именах) |
| `.htaccess` | Маршруты React (SPA) на Apache |
| `vite.svg` | Иконка (опционально) |

Если **нет `.htaccess`** — пересоберите: файл лежит в [`frontend/public/.htaccess`](../frontend/public/.htaccess) и копируется при `npm run build`.

### 5.6. Локальная проверка (рекомендуется)

```powershell
npm run verify:prod
```

Откройте http://localhost:4173

- Главная загружается.
- В DevTools → **Сеть**: запросы идут на `conslanback-vladislav7599.amvera.io`.
- Попробуйте **Вход** или **Тарифы**.

Если CORS ругается — это нормально **до шага 5** (ещё не обновили `FRONTEND_URL` на Amvera). После шага 5 проверьте снова.

---

## 6. Шаг 4 — Загрузка на хостинг по FTP

### 6.1. Подключиться в FileZilla

1. Запустите FileZilla.
2. Вверху введите данные из шага 4.3:

   - **Хост:** из панели Timeweb  
   - **Имя пользователя:** FTP-логин  
   - **Пароль:** FTP-пароль  
   - **Порт:** `21` (или `22` для SFTP)

3. **Быстрое соединение** / **Connect**.

4. Справа откроется сервер — перейдите в **корень сайта** (`public_html` и т.д.).

### 6.2. Очистить старые файлы (если есть)

Если на хостинге уже лежали тестовые файлы или старый сайт:

1. На сервере (правая панель) выделите старые `index.html`, папки — **удалите**.
2. **Не удаляйте** служебные папки вроде `cgi-bin`, если панель их показывает как системные.

### 6.3. Загрузить содержимое `dist/`

**Важно:** загружайте **содержимое** папки `dist/`, а не саму папку `dist`.

**Слева (ПК):** откройте `frontend/dist/`  
**Справа (сервер):** корень сайта

Выделите на **левой** панели всё внутри `dist/`:

- `index.html`
- папка `assets`
- `.htaccess`
- остальные файлы

Перетащите на **правую** панель (или ПКМ → Загрузить).

### 6.4. Проверить на сервере

В корне сайта на FTP должно быть:

```text
public_html/
  index.html
  .htaccess
  assets/
    index-xxxxx.js
    index-xxxxx.css
    ...
```

### 6.5. Временный адрес сайта

До настройки DNS Timeweb может дать **временный URL** (технический домен). Откройте его в браузере — должна появиться главная страница приложения.

Если белый экран — см. [раздел 14](#14-частые-ошибки).

---

## 7. Шаг 5 — CORS на Amvera

### Зачем

Браузер открывает сайт с одного адреса (`https://myfirstproject.su`), а API — с другого (`https://conslanback-vladislav7599.amvera.io`). Бэкенд должен **разрешить** такие запросы. Это настройка **CORS** через переменную `FRONTEND_URL`.

### Действия в Amvera

1. [amvera.io](https://amvera.io) → проект бэкенда.
2. **Переменные окружения** / **Environment**.
3. Найдите или создайте **`FRONTEND_URL`**.
4. Установите значение (подставьте **свои** адреса):

```text
https://myfirstproject.su,https://www.myfirstproject.su,http://localhost:5173
```

| Часть | Зачем |
|-------|--------|
| `https://myfirstproject.su` | Основной домен |
| `https://www.myfirstproject.su` | Вариант с www |
| `http://localhost:5173` | Локальная разработка |

5. Если есть **`ALLOW_VERCEL_APP_CORS`** — удалите или поставьте `false` (Vercel больше не используем).

6. **Сохраните** и **перезапустите** / **Redeploy** приложение.

### Правила для URL в FRONTEND_URL

| ✅ Правильно | ❌ Неправильно |
|-------------|----------------|
| `https://myfirstproject.su` | `https://myfirstproject.su/` (слэш на конце) |
| `https://myfirstproject.su` | `myfirstproject.su` (без https) |
| Несколько через **запятую** | Несколько через пробел без запятой |

### Если сайт ещё только на временном URL Timeweb

Добавьте его в список через запятую, например:

```text
https://myfirstproject.su,https://cd252710.tw1.ru,http://localhost:5173
```

(Точный временный URL смотрите в панели хостинга.)

---

## 8. Шаг 6 — Домен myfirstproject.su

### 8.1. Привязать домен в Timeweb Хостинг

1. `hosting.timeweb.ru` → **Сайты** → ваш сайт.
2. **Домены** → **Добавить домен** → `myfirstproject.su`.
3. При необходимости добавьте `www.myfirstproject.su`.
4. Панель покажет **инструкцию по DNS** — что прописать на Reg.ru (A-запись или NS).

### 8.2. Настройка DNS на Reg.ru

1. [reg.ru](https://reg.ru) → **Мои домены** → `myfirstproject.su`.
2. **Управление зоной DNS** (если NS: `ns1.reg.ru`, `ns2.reg.ru`).

**Удалите** старые записи на Vercel, если есть:

| Тип | Имя | Старое значение (удалить) |
|-----|-----|----------------------------|
| CNAME | `@` или `www` | `cname.vercel-dns.com` |

**Добавьте** записи **как указано в Timeweb** (пример — у вас могут быть другие IP):

| Тип | Имя | Значение | Зачем |
|-----|-----|----------|--------|
| A | `@` | IP из панели Timeweb | Основной домен |
| A или CNAME | `www` | IP или хост Timeweb | www |

3. Сохраните. Обновление DNS: **15 минут – 24 часа** (часто 1–2 часа).

### 8.3. SSL (HTTPS)

1. В панели Timeweb Хостинг: **SSL** / **Let's Encrypt**.
2. Включите сертификат для `myfirstproject.su` и `www`.
3. Включите **редирект HTTP → HTTPS**, если есть опция.

### 8.4. Cloudflare (если был только для Vercel)

Раньше Cloudflare мог проксировать трафик на Vercel ([`infrastructure/README.md`](../infrastructure/README.md)).

Для Timeweb Хостинг **Cloudflare не нужен**:

1. В Reg.ru верните NS на `ns1.reg.ru` / `ns2.reg.ru` (если меняли на Cloudflare).
2. Или в Cloudflare отключите прокси (серое облако) и укажите A-запись на IP Timeweb.

### 8.5. После смены DNS

1. Откройте `https://myfirstproject.su` — должен открыться ваш сайт с хостинга.
2. Убедитесь, что `FRONTEND_URL` на Amvera содержит **именно** `https://myfirstproject.su` (шаг 5).
3. Если меняли только DNS — **пересборка фронта не нужна** (`VITE_API_URL` не изменился).

---

## 9. Шаг 7 — API остаётся на Amvera

### Стандартная схема (рекомендуется)

- Сайт: `https://myfirstproject.su`
- API: `https://conslanback-vladislav7599.amvera.io/api`

**DNS для API менять не нужно.** Браузер обращается к Amvera напрямую по URL из `VITE_API_URL`.

### Опционально: поддомен api.myfirstproject.su

Для «красивого» URL API (продвинутый вариант):

1. Reg.ru: CNAME `api` → `conslanback-vladislav7599.amvera.io` (если Amvera это поддерживает в настройках домена).
2. Amvera: привязать домен `api.myfirstproject.su`.
3. Пересобрать фронт с `VITE_API_URL=https://api.myfirstproject.su/api`.

Для старта **достаточно** адреса `*.amvera.io`.

---

## 10. Шаг 8 — Проверка

### Чеклист

- [ ] `https://conslanback-vladislav7599.amvera.io/docs` открывается
- [ ] `https://myfirstproject.su` — главная страница Landing Constructor
- [ ] `F12` → **Консоль** — нет красных ошибок CORS
- [ ] `F12` → **Сеть** → фильтр `amvera` — статус **200** на `/api/plans` и т.д.
- [ ] **Регистрация** — успех
- [ ] **Вход** — личный кабинет
- [ ] **Создать проект** — появляется в списке
- [ ] Прямой URL `https://myfirstproject.su/dashboard` — не 404 (работает `.htaccess`)

### Как смотреть Network

1. Откройте сайт → `F12` → вкладка **Сеть** / **Network**.
2. Обновите страницу (`F5`).
3. В фильтре введите `amvera` или `api`.
4. Кликните на запрос — статус должен быть **200** (зелёный), не **(failed)**.

### Как смотреть CORS

1. `F12` → **Консоль** / **Console**.
2. Ошибка вида `Access to fetch ... has been blocked by CORS policy` → вернитесь к [шагу 5](#7-шаг-5--cors-на-amvera).

---

## 11. Шаг 9 — Отключить Vercel

Делайте **только после** успешной проверки (1–2 дня).

1. [vercel.com](https://vercel.com) → ваш проект.
2. **Settings** → внизу **Delete Project** или отключите деплой.
3. Reg.ru: убедитесь, что нет DNS на `cname.vercel-dns.com`.
4. Amvera: `ALLOW_VERCEL_APP_CORS` не нужен.

---

## 12. Шаг 10 — Обновление сайта в будущем

При изменении кода фронтенда:

```powershell
cd frontend
npm run build
```

Затем снова загрузите **содержимое** `dist/` на FTP (шаг 4), заменив старые файлы.

| Ситуация | Действие |
|----------|----------|
| Изменился только дизайн/страницы | `npm run build` → FTP |
| Сменился URL API | Правка `.env.production` → `npm run build` → FTP |
| Сменился домен сайта | Обновить `FRONTEND_URL` на Amvera + redeploy бэкенда |

**Бэкенд на Amvera** при обновлении только фронта **не трогаете**.

---

## 13. Словарь

| Термин | Простыми словами |
|--------|------------------|
| **Фронтенд** | Сайт в браузере (HTML, JS, CSS) |
| **Бэкенд / API** | Сервер на Amvera: логин, сохранение данных |
| **`dist/`** | Папка с готовым сайтом после `npm run build` |
| **`VITE_API_URL`** | Адрес API в сборке фронта; **с `/api`** |
| **`FRONTEND_URL`** | Адрес сайта для Amvera (CORS); **без `/api`** |
| **FTP** | Протокол загрузки файлов на хостинг |
| **CORS** | Разрешение браузеру звонить с сайта на API |
| **DNS** | Настройка «домен → сервер» на Reg.ru |
| **SPA** | Одна `index.html`, маршруты `/dashboard` и т.д. — нужен `.htaccess` |
| **Redeploy** | Перезапуск приложения на Amvera после смены env |

---

## 14. Частые ошибки

### «Failed to fetch»

| Причина | Решение |
|---------|---------|
| Неверный `VITE_API_URL` | Проверить `/api` на конце, пересобрать `npm run build`, залить FTP |
| Неверный `FRONTEND_URL` на Amvera | Точный URL из адресной строки, без слэша на конце, redeploy |
| Amvera остановлен | Запустить проект на amvera.io |

### Белый экран, нет стилей

| Причина | Решение |
|---------|---------|
| Загружена папка `dist`, а не её содержимое | Файлы должны быть в корне `public_html` |
| Нет папки `assets/` на сервере | Перезалить полный `dist/` |
| Старый кэш | `Ctrl+F5` или режим инкогнито |

### 404 на `/dashboard` или `/login` при прямом URL

| Причина | Решение |
|---------|---------|
| Нет `.htaccess` в корне сайта | Проверить `dist/.htaccess`, пересобрать, залить |

### CORS после регистрации (PATCH)

Убедитесь, что `FRONTEND_URL` содержит **https**-версию домена, с которого открыт сайт. Перезапустите Amvera.

### Сайт открывается, но данные старые / пустые

Данные на **Amvera PostgreSQL** — смена хостинга фронта **не очищает** БД. Если «пусто» — возможно, новый тестовый аккаунт; старые пользователи остались на Amvera.

### Путаю hosting.timeweb.ru и timeweb.cloud

| URL | Продукт |
|-----|---------|
| `hosting.timeweb.ru` | **Хостинг** — для этого гайда |
| `timeweb.cloud` | **Cloud** — Apps, дорогая PostgreSQL — **не нужен** |

---

## 15. Короткий чеклист

```
□ Amvera /docs работает
□ hosting.timeweb.ru — сайт создан, FTP-данные в блокноте
□ frontend: copy .env.timeweb-hosting.example .env.production
□ VITE_API_URL=https://conslanback-vladislav7599.amvera.io/api
□ npm install && npm run build
□ dist/ содержит index.html, assets/, .htaccess
□ FTP: содержимое dist/ в корень сайта
□ Amvera: FRONTEND_URL=https://myfirstproject.su,https://www.myfirstproject.su,http://localhost:5173
□ Amvera: redeploy
□ Reg.ru: DNS на Timeweb, убрать Vercel
□ Timeweb: SSL включён
□ Проверка: сайт, регистрация, Network 200
□ Отключить Vercel
```

---

## Файлы в репозитории

| Файл | Назначение |
|------|------------|
| [`frontend/.env.timeweb-hosting.example`](../frontend/.env.timeweb-hosting.example) | Шаблон для `.env.production` |
| [`frontend/public/.htaccess`](../frontend/public/.htaccess) | SPA на Apache (попадает в `dist/`) |
| [`frontend/src/api/apiClient.ts`](../frontend/src/api/apiClient.ts) | Логика `VITE_API_URL` |
| [`backend/main.py`](../backend/main.py) | CORS / `FRONTEND_URL` |
| [`docs/VERCEL_FRONTEND.md`](./VERCEL_FRONTEND.md) | Старый гайд Vercel (для сравнения) |

**Стоимость гибрида (ориентир):** тариф Timeweb Хостинг + Amvera (без Timeweb Cloud PostgreSQL 770 ₽).
