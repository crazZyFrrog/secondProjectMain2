# API Examples для тестирования Telegram-уведомлений

## Предварительные требования

1. Backend сервер должен быть запущен на `http://localhost:5001`
2. Файл `.env` должен быть настроен с корректными токенами Telegram
3. Для некоторых запросов нужен токен авторизации

---

## 1. Регистрация нового пользователя (вызывает Telegram-уведомление)

**Запрос:**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "username": "Новый Пользователь",
    "company_type": "small"
  }'
```

**Ожидаемый результат:**
- Пользователь создан
- В Telegram приходит уведомление:
  ```
  🎉 Новая регистрация пользователя

  👤 Имя: Новый Пользователь
  📧 Email: newuser@example.com
  🏢 Тип компании: Малый бизнес
  🆔 ID клиента: abc-123-def
  📦 Текущий тариф: Free
  ```

---

## 2. Авторизация

**Запрос:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "demo1234"
  }'
```

**Ответ:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Сохраните токен** для следующих запросов!

---

## 3. Получение списка тарифов

**Запрос:**
```bash
curl -X GET http://localhost:5001/api/plans
```

**Ответ:**
```json
[
  {
    "id": "starter-id",
    "name": "Starter",
    "features": ["Templates: 3", "Projects: 1", "Exports: HTML"],
    "limits": {"projects": 1, "templates": 3}
  },
  {
    "id": "pro-id",
    "name": "Pro",
    "features": ["Templates: 12", "Projects: 10", "Exports: HTML/PDF/DOCX"],
    "limits": {"projects": 10, "templates": 12}
  },
  {
    "id": "enterprise-id",
    "name": "Enterprise",
    "features": ["Unlimited templates", "Unlimited projects", "Priority support"],
    "limits": null
  }
]
```

**Сохраните `id` тарифа Pro** для следующего запроса!

---

## 4. Переход на Pro тариф (вызывает Telegram-уведомление)

**Замените:**
- `YOUR_TOKEN` на токен из шага 2
- `pro-plan-id-here` на ID тарифа Pro из шага 3

**Запрос:**
```bash
curl -X PATCH http://localhost:5001/api/clients/me/plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "pro-plan-id-here"
  }'
```

**Ожидаемый результат:**
- Тариф пользователя обновлён на Pro
- В Telegram приходит уведомление:
  ```
  💎 Новый клиент оформил тариф Pro

  📦 Тариф: Pro
  📧 Email: demo@example.com
  🆔 ID клиента: abc-123-def
  ```

---

## 5. Тестовое сообщение в Telegram (только для админов)

**Сначала авторизуйтесь как админ:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin1234"
  }'
```

**Затем отправьте тестовое сообщение:**
```bash
curl -X POST http://localhost:5001/api/integrations/telegram/test-message \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Тестовое сообщение из API"
  }'
```

**Ожидаемый результат:**
- В Telegram приходит сообщение: "Тестовое сообщение из API"

---

## 6. Тестирование через Python-скрипт

Вместо curl можно использовать наш Python-скрипт:

```bash
cd backend
python test_telegram.py
```

Этот скрипт отправит 4 тестовых сообщения в Telegram.

---

## Полный сценарий тестирования

### Вариант 1: Регистрация нового пользователя

1. Зарегистрировать нового пользователя через фронтенд (http://localhost:5173/register)
2. Проверить, что пришло уведомление в Telegram о регистрации
3. Войти в систему
4. Перейти в настройки и выбрать тариф Pro
5. Проверить, что пришло уведомление в Telegram о покупке Pro тарифа

### Вариант 2: Через API

1. Выполнить запрос 1 (регистрация) → должно прийти уведомление
2. Выполнить запрос 2 (авторизация) → получить токен
3. Выполнить запрос 3 (список тарифов) → получить ID тарифа Pro
4. Выполнить запрос 4 (переход на Pro) → должно прийти уведомление

### Вариант 3: Через Python-скрипт

```bash
cd backend
python test_telegram.py
```

---

## Устранение проблем

### Уведомления не приходят

1. **Проверьте файл `.env`:**
   ```bash
   cat backend/.env  # Linux/Mac
   type backend\.env  # Windows
   ```
   
2. **Убедитесь, что переменные окружения корректны:**
   - `TELEGRAM_BOT_TOKEN` должен быть реальным токеном от @BotFather
   - `TELEGRAM_MANAGER_CHAT_ID` должен быть вашим числовым Chat ID

3. **Проверьте, что вы отправили хотя бы одно сообщение боту:**
   - Найдите вашего бота в Telegram
   - Нажмите "Start" или отправьте любое сообщение

4. **Проверьте логи сервера:**
   - При запуске сервера должны быть видны запросы к Telegram API
   - Ищите строки с "Telegram request" и "Telegram response"

5. **Запустите тестовый скрипт:**
   ```bash
   python test_telegram.py
   ```
   Это покажет детальную информацию об ошибках.

### Ошибка 401 Unauthorized при отправке в Telegram

- Проверьте, что `TELEGRAM_BOT_TOKEN` корректный
- Токен должен быть в формате: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### Ошибка 400 Bad Request при отправке в Telegram

- Проверьте, что `TELEGRAM_MANAGER_CHAT_ID` корректный
- Chat ID должен быть числом (может быть отрицательным для групп)
- Убедитесь, что вы отправили хотя бы одно сообщение боту

---

## Дополнительно: Postman Collection

Вы можете импортировать эти запросы в Postman для удобного тестирования.

1. Создайте новую коллекцию в Postman
2. Добавьте переменные окружения:
   - `base_url`: `http://localhost:5001`
   - `token`: (будет заполнен после авторизации)
3. Добавьте запросы из этого файла
