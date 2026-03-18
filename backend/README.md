# Backend - Landing Constructor API

Бэкенд для конструктора лендингов на FastAPI. Хранение данных — SQLite.

## Стек

- **FastAPI** + **Uvicorn**
- **SQLite** база данных
- **JWT** авторизация
- **Telegram Bot API** для уведомлений

## Структура

```
backend/
├── main.py                     # Главный файл с API endpoints
├── auth.py                     # Аутентификация и авторизация
├── db.py                       # Настройка БД SQLite
├── seed_db.py                  # Заполнение БД тестовыми данными
├── telegram_notifications.py   # Интеграция с Telegram
├── rbac.py                     # Контроль доступа
├── validation.py               # Схемы валидации Pydantic
├── test_telegram.py            # Скрипт для тестирования Telegram
├── TELEGRAM_SETUP.md           # Инструкция по настройке Telegram
├── requirements.txt
├── .env.example               # Пример файла окружения
├── .env                       # Файл окружения (создать вручную)
└── README.md
```

## Запуск

### 1. Установка зависимостей

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
```

### 2. Настройка переменных окружения

Создайте файл `.env` в папке `backend` на основе `.env.example`:

```env
JWT_SECRET=your_random_secret_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=120

# Telegram bot integration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_MANAGER_CHAT_ID=your_manager_chat_id_here
```

**Важно:** Для получения токена бота и Chat ID смотрите инструкцию в файле [docs/TELEGRAM_SETUP.md](./docs/TELEGRAM_SETUP.md)

### 3. Инициализация базы данных

```bash
python seed_db.py
```

Это создаст файл базы данных `data/app.db` и заполнит её тестовыми данными.

### 4. Запуск сервера

```bash
python -m uvicorn main:app --reload --port 5001
```

Откройте документацию: http://localhost:5001/docs

## Тестовые пользователи

После запуска `seed_db.py` доступны следующие пользователи:

| Роль     | Email              | Пароль      |
|----------|-------------------|-------------|
| User     | demo@example.com  | demo1234    |
| Manager  | manager@example.com| manager1234|
| Admin    | admin@example.com | admin1234   |

## API Endpoints

### Auth
- `POST /api/auth/register` - Регистрация клиента
- `POST /api/auth/login` - Вход (получение токена)
- `POST /api/auth/logout` - Выход

### Клиенты
- `GET /api/clients/me` - Профиль текущего клиента
- `PATCH /api/clients/me/plan` - Выбор тарифа
- `PATCH /api/clients/me/password` - Смена пароля
- `GET /api/clients/me/subscription` - Информация о подписке
- `GET /api/clients/me/payments` - История платежей
- `GET /api/clients/me/notifications` - Настройки уведомлений
- `PATCH /api/clients/me/notifications` - Обновление настроек уведомлений

### Тарифы
- `GET /api/plans` - Список тарифов
- `GET /api/plans/{plan_id}` - Детали тарифа
- `POST /api/plans` - Создать тариф (только admin)
- `PATCH /api/plans/{plan_id}` - Обновить тариф (только admin)
- `DELETE /api/plans/{plan_id}` - Удалить тариф (только admin)

### Шаблоны
- `GET /api/templates` - Список шаблонов
- `GET /api/templates/{template_id}` - Детали шаблона

### Проекты
- `GET /api/projects` - Список проектов
- `POST /api/projects` - Создать проект
- `GET /api/projects/{project_id}` - Получить проект
- `PATCH /api/projects/{project_id}` - Обновить проект
- `DELETE /api/projects/{project_id}` - Удалить проект

### AI генерация
- `POST /api/ai/generate` - Генерация контента для лендинга

### Экспорт
- `POST /api/projects/{project_id}/export` - Экспорт проекта
- `GET /api/projects/{project_id}/exports` - История экспортов

### Интеграции
- `POST /api/integrations/telegram/test-message` - Отправка тестового сообщения в Telegram (только admin)

## Telegram-уведомления

### Когда отправляются уведомления?

1. **При регистрации нового пользователя** - всегда
2. **При переходе на Pro тариф** - когда пользователь выбирает тариф Pro
3. **При переходе на Enterprise тариф** - когда пользователь выбирает тариф Enterprise

### Настройка Telegram-бота

Подробная инструкция по настройке Telegram-бота находится в файле [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)

### Тестирование Telegram-уведомлений

Для проверки работы Telegram-уведомлений запустите скрипт:

```bash
python test_telegram.py
```

Этот скрипт отправит 4 тестовых сообщения в ваш Telegram.

## Примечания

- Данные хранятся в SQLite базе данных `data/app.db`
- Авторизация по `Authorization: Bearer <token>`
- Все уведомления в Telegram отправляются асинхронно и не блокируют основной процесс
- Ошибки при отправке уведомлений логируются, но не прерывают работу API

## Разработка

### Добавление новых уведомлений

Чтобы добавить новый тип уведомления в Telegram:

1. Откройте файл `telegram_notifications.py`
2. Создайте новую функцию по аналогии с `send_new_user_registration_notification`
3. Используйте `send_telegram_message()` для отправки сообщения
4. Вызовите эту функцию в нужном месте в `main.py`

### Логирование

Для просмотра логов Telegram-уведомлений настройте logging:

```python
import logging
logging.basicConfig(level=logging.INFO)
```

Все запросы и ответы Telegram API логируются модулем `telegram_notifications`.

