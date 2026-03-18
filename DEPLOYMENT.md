# 🚀 Руководство по деплою Landing Constructor

Это руководство содержит пошаговые инструкции по развертыванию приложения Landing Constructor в продакшен.

## 📋 Оглавление

- [Архитектура проекта](#архитектура-проекта)
- [Варианты деплоя](#варианты-деплоя)
- [Вариант 1: Vercel + Amvera](#вариант-1-vercel--amvera-рекомендуется)
- [Вариант 2: Vercel + Railway](#вариант-2-vercel--railway)
- [Вариант 3: Timeweb Cloud (всё в одном)](#вариант-3-timeweb-cloud-всё-в-одном)
- [Вариант 4: VDS/VPS](#вариант-4-vdsvps-полный-контроль)
- [Настройка переменных окружения](#настройка-переменных-окружения)
- [Проверка работы](#проверка-работы)
- [Устранение проблем](#устранение-проблем)

---

## 🏗 Архитектура проекта

**Frontend**: React 18 + TypeScript + Vite + Tailwind CSS  
**Backend**: FastAPI (Python 3.11) + SQLite/PostgreSQL  
**База данных**: SQLite (локально) → PostgreSQL (продакшен)  
**Дополнительно**: JWT авторизация, Telegram-уведомления

---

## 🎯 Варианты деплоя

### Сравнение вариантов

| Вариант | Стоимость | Сложность | Данные в РФ | Рекомендация |
|---------|-----------|-----------|-------------|--------------|
| Vercel + Amvera | ~250₽/мес | Низкая | Да (Amvera) | ⭐ Лучший вариант |
| Vercel + Railway | ~0-5$/мес | Низкая | Нет | Для тестов |
| Timeweb Cloud | 300-500₽/мес | Средняя | Да | Всё в одном месте |
| VDS/VPS | 200-500₽/мес | Высокая | Да | Полный контроль |

---

## 🚀 Вариант 1: Vercel + Amvera (рекомендуется)

### Преимущества
- ✅ Простая настройка
- ✅ Backend в РФ (Amvera)
- ✅ Автоматические деплои при push в Git
- ✅ Относительно недорого

### Шаг 1: Подготовка репозитория

1. Убедитесь, что код залит в Git (GitHub, GitLab или Bitbucket)
2. Проверьте, что файлы `.env` в `.gitignore` (не должны попасть в репозиторий)

### Шаг 2: Деплой Backend на Amvera

#### 2.1. Регистрация и создание проекта

1. Зайдите на [amvera.io](https://amvera.io)
2. Зарегистрируйтесь или войдите
3. Нажмите **"Создать проект"**
4. Выберите **"Python"** как тип приложения
5. Подключите ваш Git-репозиторий

#### 2.2. Настройка базы данных

1. В панели Amvera перейдите в раздел **"Базы данных"**
2. Создайте **PostgreSQL** базу данных
3. Скопируйте строку подключения (формат: `postgresql://user:password@host:5432/dbname`)

#### 2.3. Настройка переменных окружения

В разделе **"Переменные окружения"** добавьте:

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=<сгенерируйте случайный ключ минимум 32 символа>
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=120
FRONTEND_URL=https://your-app.vercel.app
TELEGRAM_BOT_TOKEN=<ваш токен бота, если используете>
TELEGRAM_MANAGER_CHAT_ID=<ваш chat_id, если используете>
```

**Генерация JWT_SECRET:**
```bash
# В Python:
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Или онлайн: https://randomkeygen.com/
```

#### 2.4. Настройка деплоя

1. **Рабочая директория**: `backend`
2. **Команда сборки**: `pip install -r requirements.txt`
3. **Команда запуска**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Порт**: оставьте по умолчанию (автоматически)

#### 2.5. Запуск

1. Нажмите **"Задеплоить"**
2. Дождитесь завершения сборки (1-3 минуты)
3. Получите URL бекенда (например: `https://your-app.amvera.io`)
4. Проверьте работу: откройте `https://your-app.amvera.io/docs`

### Шаг 3: Деплой Frontend на Vercel

#### 3.1. Регистрация и подключение репозитория

1. Зайдите на [vercel.com](https://vercel.com)
2. Зарегистрируйтесь через GitHub
3. Нажмите **"New Project"**
4. Импортируйте ваш репозиторий

#### 3.2. Настройка проекта

1. **Framework Preset**: Vite
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

#### 3.3. Переменные окружения

Добавьте переменную окружения:

```bash
VITE_API_URL=https://your-backend.amvera.io/api
```

⚠️ **Важно**: замените `your-backend.amvera.io` на реальный URL вашего бекенда

#### 3.4. Деплой

1. Нажмите **"Deploy"**
2. Дождитесь завершения (2-4 минуты)
3. Получите URL фронтенда (например: `https://your-app.vercel.app`)

### Шаг 4: Финальная настройка CORS

1. Вернитесь в Amvera
2. Обновите переменную окружения `FRONTEND_URL`:
   ```bash
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Перезапустите бекенд

### Шаг 5: Проверка

1. Откройте ваш фронтенд: `https://your-app.vercel.app`
2. Попробуйте зарегистрироваться
3. Создайте проект
4. Проверьте, что данные сохраняются

---

## 🌐 Вариант 2: Vercel + Railway

### Преимущества
- ✅ Бесплатный тарий (trial $5 кредитов)
- ✅ Простая настройка
- ❌ Данные не в РФ

### Шаг 1: Деплой Backend на Railway

#### 1.1. Регистрация

1. Зайдите на [railway.app](https://railway.app)
2. Зарегистрируйтесь через GitHub

#### 1.2. Создание PostgreSQL

1. Нажмите **"New Project"** → **"Provision PostgreSQL"**
2. Дождитесь создания базы
3. Перейдите во вкладку **"Connect"**
4. Скопируйте **"Postgres Connection URL"**

#### 1.3. Создание Backend-сервиса

1. В том же проекте нажмите **"New Service"** → **"GitHub Repo"**
2. Выберите ваш репозиторий
3. Railway автоматически определит Python

#### 1.4. Настройка

1. Перейдите в **"Settings"**
2. **Root Directory**: `backend`
3. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### 1.5. Переменные окружения

Во вкладке **"Variables"** добавьте:

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<сгенерируйте случайный ключ>
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=120
FRONTEND_URL=https://your-app.vercel.app
TELEGRAM_BOT_TOKEN=<опционально>
TELEGRAM_MANAGER_CHAT_ID=<опционально>
```

⚠️ `${{Postgres.DATABASE_URL}}` автоматически подставит URL PostgreSQL

#### 1.6. Получение URL

1. Перейдите во вкладку **"Settings"** → **"Networking"**
2. Нажмите **"Generate Domain"**
3. Скопируйте URL (например: `https://your-app.railway.app`)

### Шаг 2: Деплой Frontend на Vercel

Аналогично **Варианту 1, Шаг 3**, но используйте Railway URL в `VITE_API_URL`:

```bash
VITE_API_URL=https://your-app.railway.app/api
```

---

## ☁️ Вариант 3: Timeweb Cloud (всё в одном)

### Преимущества
- ✅ Всё в одном месте
- ✅ Данные в РФ
- ✅ Русскоязычная поддержка
- ❌ Чуть дороже

### Шаг 1: Деплой Backend на Timeweb Cloud Apps

#### 1.1. Регистрация

1. Зайдите на [timeweb.cloud](https://timeweb.cloud)
2. Зарегистрируйтесь
3. Перейдите в раздел **"Cloud Apps"**

#### 1.2. Создание приложения

1. Нажмите **"Создать приложение"**
2. Выберите **"Python"**
3. Подключите Git-репозиторий

#### 1.3. Создание базы данных

1. В настройках приложения добавьте **PostgreSQL**
2. Скопируйте строку подключения

#### 1.4. Настройка

1. **Рабочая директория**: `backend`
2. **Команда запуска**: `uvicorn main:app --host 0.0.0.0 --port 8080`
3. Добавьте переменные окружения (аналогично Amvera)

### Шаг 2: Деплой Frontend на Timeweb Hosting

#### 2.1. Сборка локально

```bash
cd frontend
npm install
npm run build
```

#### 2.2. Загрузка на хостинг

1. В панели Timeweb перейдите в **"Hosting"**
2. Создайте сайт
3. Загрузите содержимое папки `frontend/dist` в корень сайта
4. Настройте редирект для SPA:

Создайте файл `.htaccess`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 🖥 Вариант 4: VDS/VPS (полный контроль)

### Подходит для:
- Опытных пользователей
- Проектов с высокими требованиями
- Нужен полный контроль

### Провайдеры (РФ)
- Timeweb VDS (от 199₽/мес)
- Beget VPS (от 290₽/мес)
- REG.RU VPS (от 200₽/мес)

### Краткая инструкция

1. **Арендуйте VDS** с Ubuntu 22.04
2. **Установите зависимости**:
   ```bash
   sudo apt update
   sudo apt install python3-pip nginx postgresql git
   ```
3. **Настройте PostgreSQL**:
   ```bash
   sudo -u postgres createdb landing_constructor
   sudo -u postgres createuser landing_user -P
   ```
4. **Клонируйте репозиторий**:
   ```bash
   git clone <ваш-репозиторий>
   cd secondProjectMain2
   ```
5. **Настройте Backend**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
6. **Создайте `.env`** с переменными окружения
7. **Настройте systemd** для автозапуска:
   ```ini
   [Unit]
   Description=Landing Constructor Backend
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/path/to/backend
   Environment="PATH=/path/to/venv/bin"
   ExecStart=/path/to/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000

   [Install]
   WantedBy=multi-user.target
   ```
8. **Соберите Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```
9. **Настройте Nginx**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.ru;

       # Frontend
       location / {
           root /path/to/frontend/dist;
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
10. **Настройте SSL** через Let's Encrypt:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.ru
    ```

---

## ⚙️ Настройка переменных окружения

### Backend (`.env`)

| Переменная | Описание | Пример |
|------------|----------|--------|
| `DATABASE_URL` | Строка подключения к PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Секретный ключ для JWT | `abc123xyz...` (32+ символов) |
| `JWT_ALGORITHM` | Алгоритм шифрования JWT | `HS256` |
| `JWT_EXPIRES_MINUTES` | Время жизни токена (минуты) | `120` |
| `FRONTEND_URL` | URL фронтенда для CORS | `https://your-app.vercel.app` |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram-бота (опц.) | `123456:ABC-DEF...` |
| `TELEGRAM_MANAGER_CHAT_ID` | ID чата для уведомлений (опц.) | `123456789` |

### Frontend (`.env.production`)

| Переменная | Описание | Пример |
|------------|----------|--------|
| `VITE_API_URL` | URL API бекенда | `https://api.example.com/api` |

---

## ✅ Проверка работы

### Проверка Backend

1. Откройте `https://your-backend-url/docs`
2. Должна открыться документация Swagger UI
3. Попробуйте эндпоинт `GET /api/plans` (должен вернуть список тарифов)

### Проверка Frontend

1. Откройте `https://your-frontend-url`
2. Попробуйте зарегистрироваться
3. После регистрации проверьте:
   - Перенаправление в дашборд
   - Создание проекта
   - Отображение шаблонов

### Проверка связи Frontend ↔ Backend

Откройте DevTools (F12) → Network:
- Все запросы к `/api/*` должны идти на бекенд
- Статус 200 для успешных запросов
- В ответах должны быть данные из БД

### Проверка базы данных

На платформе хостинга (Amvera/Railway):
1. Подключитесь к PostgreSQL
2. Проверьте таблицы:
   ```sql
   \dt  -- список таблиц
   SELECT * FROM clients;  -- список пользователей
   ```

---

## 🔧 Устранение проблем

### Проблема: CORS ошибки

**Симптомы**: В консоли браузера ошибки типа "CORS policy blocked"

**Решение**:
1. Проверьте, что `FRONTEND_URL` в бекенде совпадает с реальным URL фронтенда
2. Убедитесь, что оба домена используют HTTPS (или оба HTTP)
3. Перезапустите бекенд после изменения переменных

### Проблема: 401 Unauthorized

**Симптомы**: После логина сразу редирект на `/login`

**Решение**:
1. Проверьте, что JWT_SECRET одинаковый при всех запусках
2. Очистите localStorage в браузере
3. Проверьте время жизни токена (`JWT_EXPIRES_MINUTES`)

### Проблема: 500 Internal Server Error

**Симптомы**: Ошибки при регистрации/создании проектов

**Решение**:
1. Проверьте логи бекенда на платформе хостинга
2. Убедитесь, что база данных доступна:
   ```bash
   # Проверка подключения
   psql $DATABASE_URL
   ```
3. Проверьте, что таблицы созданы (`init_db()` выполнился)

### Проблема: Frontend не находит API

**Симптомы**: Ошибки "Failed to fetch" или "Network Error"

**Решение**:
1. Проверьте `VITE_API_URL` в настройках Vercel
2. Убедитесь, что бекенд запущен и доступен
3. Проверьте, что URL заканчивается на `/api` (без слэша в конце)

### Проблема: База данных SQLite вместо PostgreSQL

**Симптомы**: Работает локально, но не в продакшене

**Решение**:
1. Проверьте, что `DATABASE_URL` задана в переменных окружения
2. Убедитесь, что URL начинается с `postgresql://`
3. Проверьте, что `psycopg2-binary` установлен

### Проблема: Telegram-уведомления не отправляются

**Решение**:
1. Проверьте токен бота: напишите боту `/start` в Telegram
2. Проверьте chat_id: отправьте сообщение боту и получите ID через:
   ```bash
   curl https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
3. Уведомления отправляются асинхронно, проверьте логи бекенда

---

## 📚 Дополнительные ресурсы

- [Документация FastAPI](https://fastapi.tiangolo.com/)
- [Документация Vite](https://vitejs.dev/)
- [Документация Vercel](https://vercel.com/docs)
- [Документация Railway](https://docs.railway.app/)
- [Документация Amvera](https://amvera.io/docs)

---

## 🎉 Готово!

Ваше приложение теперь в продакшене! 

**Следующие шаги**:
- Настройте свой домен (если нужно)
- Настройте мониторинг (Sentry, LogRocket)
- Настройте бэкапы базы данных
- Настройте CI/CD для автоматического деплоя

**Вопросы?** Проверьте раздел [Устранение проблем](#устранение-проблем) или откройте issue в репозитории.
