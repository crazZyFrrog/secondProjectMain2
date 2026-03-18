# Backend - Landing Constructor API

FastAPI backend для конструктора лендингов с поддержкой PostgreSQL и SQLite.

## 🚀 Быстрый старт (локально)

### 1. Установка зависимостей

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Настройка окружения

Скопируйте `.env.example` в `.env` и настройте переменные:

```bash
cp .env.example .env
```

Для локальной разработки оставьте `DATABASE_URL` пустым (будет использоваться SQLite).

### 3. Инициализация базы данных

```bash
python seed_db.py
```

### 4. Запуск сервера

```bash
python -m uvicorn main:app --reload --port 5001
```

Откройте документацию API: http://localhost:5001/docs

## 📦 Структура

```
backend/
├── main.py              # Главный файл приложения
├── db.py                # Работа с БД (SQLite/PostgreSQL)
├── auth.py              # JWT авторизация
├── rbac.py              # Контроль доступа
├── validation.py        # Валидация запросов
├── telegram_notifications.py  # Telegram-уведомления
├── seed_db.py           # Начальные данные
├── requirements.txt     # Зависимости Python
├── .env.example         # Пример конфигурации
├── Dockerfile           # Docker для деплоя
├── amvera.yml           # Конфиг для Amvera.io
└── data/
    └── app.db           # SQLite база (локально)
```

## 🌍 Деплой в продакшен

**Полное руководство**: [../DEPLOYMENT.md](../DEPLOYMENT.md)

### Быстрый старт для популярных платформ:

#### Amvera.io (рекомендуется для РФ)

1. Создайте PostgreSQL базу данных
2. Настройте переменные окружения:
   - `DATABASE_URL` - строка подключения к PostgreSQL
   - `JWT_SECRET` - случайный ключ (32+ символа)
   - `FRONTEND_URL` - URL вашего фронтенда
3. Рабочая директория: `backend`
4. Команда запуска: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Railway

1. Создайте PostgreSQL сервис
2. Добавьте GitHub репозиторий
3. Root Directory: `backend`
4. Переменные: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`

#### Docker

```bash
docker build -t landing-backend .
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e FRONTEND_URL="https://..." \
  landing-backend
```

## 🔧 Переменные окружения

| Переменная | Обязательна | Описание |
|------------|-------------|----------|
| `DATABASE_URL` | Нет* | PostgreSQL connection string. Если пусто - SQLite |
| `JWT_SECRET` | Да** | Секретный ключ для JWT токенов |
| `JWT_ALGORITHM` | Нет | Алгоритм шифрования (по умолчанию: HS256) |
| `JWT_EXPIRES_MINUTES` | Нет | Время жизни токена (по умолчанию: 120) |
| `FRONTEND_URL` | Нет*** | URL фронтенда для CORS (по умолчанию: localhost:5173) |
| `TELEGRAM_BOT_TOKEN` | Нет | Токен Telegram-бота для уведомлений |
| `TELEGRAM_MANAGER_CHAT_ID` | Нет | ID чата для получения уведомлений |

\* Обязательна для продакшена  
\*\* Обязательна для продакшена (для локальной разработки есть дефолтное значение)  
\*\*\* Обязательна для продакшена

## 📝 API Endpoints

### Публичные (без авторизации)

- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/plans` - Список тарифов
- `GET /api/templates` - Список шаблонов

### Защищённые (требуют JWT токен)

- `GET /api/clients/me` - Текущий пользователь
- `GET /api/projects` - Список проектов
- `POST /api/projects` - Создание проекта
- `PATCH /api/projects/{id}` - Обновление проекта
- `DELETE /api/projects/{id}` - Удаление проекта
- `POST /api/ai/generate` - AI-генерация контента
- `POST /api/projects/{id}/export` - Экспорт проекта

Полная документация: `/docs` (Swagger UI)

## 🔐 Авторизация

Backend использует JWT токены. Для авторизации добавьте заголовок:

```
Authorization: Bearer <your_jwt_token>
```

Токен получается при логине/регистрации и имеет срок действия 2 часа.

## 🗄 База данных

### Локальная разработка (SQLite)

База создаётся автоматически в `backend/data/app.db`.

### Продакшен (PostgreSQL)

1. Создайте базу данных на хостинге
2. Получите connection string (формат: `postgresql://user:pass@host:5432/db`)
3. Установите в переменную `DATABASE_URL`
4. При первом запуске таблицы создадутся автоматически

### Миграции

Текущая версия не использует миграции (Alembic). Схема создаётся через `init_db()`.

При изменении схемы:
- **SQLite**: удалите `data/app.db` и перезапустите
- **PostgreSQL**: выполните ALTER TABLE команды вручную или пересоздайте базу

## 🧪 Тестирование

```bash
# E2E тесты (из корня проекта)
cd frontend
npm run test
```

## 📱 Telegram-уведомления

Настройка: [docs/TELEGRAM_SETUP.md](./docs/TELEGRAM_SETUP.md)

Уведомления отправляются при:
- Регистрации нового пользователя
- Покупке тарифа Pro/Enterprise

## 🐛 Отладка

### Логи

Backend выводит логи в консоль:
- Регистрации/логины
- Ошибки при работе с БД
- Ошибки отправки Telegram-уведомлений

### Проверка БД

SQLite:
```bash
sqlite3 data/app.db
.tables
SELECT * FROM clients;
```

PostgreSQL:
```bash
psql $DATABASE_URL
\dt
SELECT * FROM clients;
```

### Тестирование API

```bash
# Через curl
curl http://localhost:5001/api/plans

# Через httpie
http http://localhost:5001/api/plans

# Через Swagger UI
# Откройте http://localhost:5001/docs
```

## 🔒 Безопасность

### Продакшен чеклист:

- [ ] Установлен сильный `JWT_SECRET` (32+ случайных символа)
- [ ] `FRONTEND_URL` указывает на реальный домен (не *)
- [ ] Переменные окружения не в репозитории
- [ ] PostgreSQL вместо SQLite
- [ ] HTTPS для API
- [ ] Настроен rate limiting (если нужно)

## 📚 Технологии

- **FastAPI** - современный Python web framework
- **Uvicorn** - ASGI сервер
- **SQLite** / **PostgreSQL** - база данных
- **psycopg2** - PostgreSQL adapter
- **bcrypt** - хеширование паролей
- **PyJWT** - JWT токены
- **httpx** - HTTP клиент (для Telegram)
- **python-dotenv** - загрузка .env файлов

## 📄 Лицензия

MIT
