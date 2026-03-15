# Landing Constructor - Конструктор Лендингов

Полнофункциональный конструктор лендингов и коммерческих предложений с AI-генерацией контента.

## 📁 Структура проекта

```
secondProject/
├── frontend/          # React + TypeScript + Tailwind CSS
│   ├── src/
│   ├── package.json
│   └── README.md
│
├── backend/           # FastAPI + SQLite
│   └── README.md
│
└── README.md         # Этот файл
```

## 🚀 Быстрый старт

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173/

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python seed_db.py
python -m uvicorn main:app --reload --port 5001
```

Откройте документацию: http://localhost:5001/docs

## 🎯 Возможности

### Реализовано (V2)
- ✅ Система авторизации с JWT
- ✅ 12 страниц (публичные + приватные)
- ✅ Галерея из 6 шаблонов
- ✅ Редактор проектов
- ✅ Превью лендингов
- ✅ UI экспорта (PDF, HTML, DOCX)
- ✅ UI AI-генерации
- ✅ Настройки аккаунта
- ✅ Демонстрационный шаблон на главной
- ✅ Улучшенная навигация профиля
- ✅ **Telegram-уведомления о регистрациях и покупках тарифов**

### В разработке
- 🔄 Реальная AI-генерация
- 🔄 Реальный экспорт документов
- 🔄 Система платежей

## 📚 Документация

- [Frontend README](./frontend/README.md) - Детальная документация фронтенда
- [Backend README](./backend/README.md) - Документация бэкенда и API
- [Telegram Setup](./backend/TELEGRAM_SETUP.md) - **Настройка Telegram-уведомлений**
- [Структура страниц](./frontend/STRUCTURE.md) - Описание всех страниц
- [Changelog V2](./frontend/CHANGELOG_V2.md) - Изменения в версии 2

## 📱 Telegram-уведомления

Проект поддерживает отправку уведомлений в Telegram:
- 🎉 При регистрации нового пользователя
- 💎 При переходе на тариф Pro
- 👑 При переходе на тариф Enterprise

**Инструкция по настройке:** [backend/TELEGRAM_SETUP.md](./backend/TELEGRAM_SETUP.md)

## 🛠 Технологии

### Frontend
- React 18 + TypeScript
- React Router v6
- Tailwind CSS
- Zustand (state management)
- Vite

### Backend
- FastAPI + Uvicorn
- SQLite (локальный файл)
- JWT-токены для авторизации
- Telegram Bot API для уведомлений
- httpx для HTTP-запросов

## 📝 Лицензия

MIT

---

**Версия:** V2  
**Статус:** Frontend готов, Backend работает на FastAPI + SQLite
