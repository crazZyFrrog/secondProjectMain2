# ✅ Настройка Telegram-уведомлений завершена

## Что было сделано

### 1. Добавлена отправка уведомлений

#### ✅ При регистрации нового пользователя
- Срабатывает автоматически при `POST /api/auth/register`
- Отправляется информация: имя, email, тип компании, ID клиента
- Пример сообщения:
  ```
  🎉 Новая регистрация пользователя
  👤 Имя: Иван Иванов
  📧 Email: ivan@example.com
  🏢 Тип компании: Малый бизнес
  🆔 ID клиента: abc-123
  📦 Текущий тариф: Free
  ```

#### ✅ При переходе на Pro тариф
- Срабатывает при `PATCH /api/clients/me/plan` с `plan_id` тарифа Pro
- Отправляется информация: тариф, email, ID клиента
- Пример сообщения:
  ```
  💎 Новый клиент оформил тариф Pro
  📦 Тариф: Pro
  📧 Email: user@example.com
  🆔 ID клиента: abc-123
  ```

#### ✅ При переходе на Enterprise тариф
- Срабатывает аналогично Pro, но для Enterprise тарифа
- Использует другой emoji (👑)

### 2. Добавлены файлы

```
backend/
├── telegram_notifications.py         # Модуль для работы с Telegram API
├── test_telegram.py                  # Скрипт для тестирования
├── .env                              # Файл с настройками (создайте!)
├── .env.example                      # Пример настроек
├── TELEGRAM_SETUP.md                 # Подробная инструкция
├── QUICK_TELEGRAM_SETUP.md           # Краткая инструкция
├── API_EXAMPLES.md                   # Примеры API-запросов
└── NOTIFICATION_EXAMPLES.md          # Примеры уведомлений

В корне проекта:
└── CHANGELOG_TELEGRAM.md             # История изменений
```

### 3. Изменены файлы

#### `backend/main.py`
- Добавлен импорт `send_new_user_registration_notification`
- В функцию `register()` добавлен вызов отправки уведомления
- Улучшены комментарии в функции `select_plan()`

#### `backend/README.md`
- Добавлена секция о Telegram-уведомлениях
- Обновлена документация по структуре проекта
- Добавлены инструкции по тестированию

#### `README.md` (корневой)
- Добавлена информация о Telegram-уведомлениях
- Обновлён список реализованных возможностей

---

## Как начать использовать

### Шаг 1: Настройте Telegram-бота

Следуйте инструкции в одном из файлов:
- **Быстрая настройка (3 минуты):** [backend/QUICK_TELEGRAM_SETUP.md](backend/QUICK_TELEGRAM_SETUP.md)
- **Подробная инструкция:** [backend/TELEGRAM_SETUP.md](backend/TELEGRAM_SETUP.md)

### Шаг 2: Настройте `.env` файл

Создайте файл `backend/.env` и добавьте:

```env
JWT_SECRET=your_random_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=120

TELEGRAM_BOT_TOKEN=ваш_токен_от_BotFather
TELEGRAM_MANAGER_CHAT_ID=ваш_chat_id
```

### Шаг 3: Проверьте работу

```bash
cd backend
python test_telegram.py
```

Должно прийти 4 тестовых сообщения в Telegram!

---

## Тестирование

### Вариант 1: Через веб-интерфейс

1. Откройте http://localhost:5173/register
2. Зарегистрируйте нового пользователя
3. Проверьте Telegram - должно прийти уведомление

4. Войдите в систему
5. Перейдите в настройки аккаунта
6. Выберите тариф Pro
7. Проверьте Telegram - должно прийти уведомление

### Вариант 2: Через API

```bash
# 1. Регистрация
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "Test User",
    "company_type": "small"
  }'

# 2. Авторизация (сохраните токен)
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# 3. Получите ID тарифа Pro
curl -X GET http://localhost:5001/api/plans

# 4. Перейдите на Pro (замените YOUR_TOKEN и PRO_PLAN_ID)
curl -X PATCH http://localhost:5001/api/clients/me/plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan_id": "PRO_PLAN_ID"}'
```

Больше примеров: [backend/API_EXAMPLES.md](backend/API_EXAMPLES.md)

### Вариант 3: Через Python-скрипт

```bash
cd backend
python test_telegram.py
```

---

## Устранение проблем

### Уведомления не приходят

1. **Проверьте файл `.env`:**
   - Файл должен находиться в папке `backend`
   - Проверьте правильность токена и Chat ID
   - Убедитесь, что нет лишних пробелов

2. **Проверьте, что бот активирован:**
   - Найдите вашего бота в Telegram
   - Отправьте ему команду `/start` или любое сообщение

3. **Запустите тест:**
   ```bash
   python backend/test_telegram.py
   ```
   Смотрите на вывод - он покажет детали ошибки

4. **Проверьте логи сервера:**
   - При запуске backend должны быть видны запросы к Telegram
   - Ищите строки с "Telegram request" и "Telegram response"

### Ошибка "TELEGRAM_BOT_TOKEN и TELEGRAM_MANAGER_CHAT_ID должны быть заданы"

- Убедитесь, что файл `.env` находится в папке `backend` (НЕ в корне проекта)
- Проверьте, что переменные заданы без лишних пробелов:
  ```env
  TELEGRAM_BOT_TOKEN=123456:ABC  # правильно
  TELEGRAM_BOT_TOKEN = 123456:ABC  # неправильно (пробелы вокруг =)
  ```

### Ошибка 401 Unauthorized от Telegram

- Проверьте токен бота - он должен быть в формате `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
- Создайте нового бота через @BotFather, если токен неверный

### Ошибка 400 Bad Request от Telegram

- Проверьте Chat ID - он должен быть числом
- Убедитесь, что вы отправили хотя бы одно сообщение боту
- Chat ID для групп может быть отрицательным (это нормально)

---

## Что дальше?

### Возможности для расширения

1. **Больше типов уведомлений:**
   - При создании нового проекта
   - При экспорте проекта
   - При достижении лимитов тарифа
   - При ошибках в системе

2. **Настройки уведомлений в UI:**
   - Выбор, какие уведомления получать
   - Несколько получателей
   - Разные чаты для разных событий

3. **Другие каналы уведомлений:**
   - Email
   - Slack
   - Discord
   - Webhook

4. **Аналитика:**
   - Статистика по уведомлениям
   - Отслеживание конверсий
   - A/B тестирование сообщений

### Добавление нового типа уведомления

1. Откройте `backend/telegram_notifications.py`
2. Создайте новую функцию:
   ```python
   def send_new_project_notification(
       *,
       email: str,
       project_name: str,
       client_id: str,
   ) -> None:
       text = (
           "🎨 <b>Создан новый проект</b>\n\n"
           f"📝 Название: <b>{project_name}</b>\n"
           f"📧 Email: <code>{email}</code>\n"
           f"🆔 ID клиента: <code>{client_id}</code>"
       )
       send_telegram_message(text=text)
   ```

3. Добавьте импорт в `backend/main.py`:
   ```python
   from telegram_notifications import (
       send_new_plan_purchase_notification,
       send_test_message,
       send_new_user_registration_notification,
       send_new_project_notification,  # новый импорт
   )
   ```

4. Вызовите в нужном месте:
   ```python
   @api_router.post("/projects")
   def create_project(...):
       # ... создание проекта ...
       
       send_new_project_notification(
           email=str(client["email"]),
           project_name=payload.name.strip(),
           client_id=str(client["id"]),
       )
       
       return project_from_row(row)
   ```

---

## Документация

- 📖 [Подробная настройка Telegram](backend/TELEGRAM_SETUP.md)
- ⚡ [Быстрая настройка (3 минуты)](backend/QUICK_TELEGRAM_SETUP.md)
- 🔧 [Примеры API-запросов](backend/API_EXAMPLES.md)
- 💬 [Примеры уведомлений](backend/NOTIFICATION_EXAMPLES.md)
- 📋 [История изменений](CHANGELOG_TELEGRAM.md)
- 📚 [Backend README](backend/README.md)

---

## Поддержка

При возникновении проблем:

1. Прочитайте [TELEGRAM_SETUP.md](backend/TELEGRAM_SETUP.md) - раздел "Устранение проблем"
2. Запустите `python backend/test_telegram.py` для диагностики
3. Проверьте логи backend-сервера
4. Убедитесь, что все переменные окружения настроены правильно

---

**Статус:** ✅ Готово к использованию  
**Версия:** 1.0.0  
**Дата:** 15 марта 2026

🎉 **Telegram-уведомления успешно настроены и готовы к работе!**
