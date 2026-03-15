# ⚡ Быстрая настройка Telegram-уведомлений

## 3 простых шага

### 1️⃣ Создайте Telegram-бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot` и следуйте инструкциям
3. **Скопируйте токен** (например: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2️⃣ Получите свой Chat ID

1. Откройте [@userinfobot](https://t.me/userinfobot) в Telegram
2. Отправьте любое сообщение
3. **Скопируйте Chat ID** (например: `123456789`)

### 3️⃣ Настройте файл .env

Откройте файл `backend/.env` и замените:

```env
TELEGRAM_BOT_TOKEN=ВАШ_ТОКЕН_СЮДА
TELEGRAM_MANAGER_CHAT_ID=ВАШ_CHAT_ID_СЮДА
```

---

## Проверка

Запустите тест:

```bash
cd backend
python test_telegram.py
```

Должно прийти 4 сообщения в Telegram ✅

---

## Что дальше?

- **Регистрируйте пользователей** → приходят уведомления 🎉
- **Переходите на Pro тариф** → приходят уведомления 💎

**Не работает?** → Смотрите полную инструкцию: [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)
