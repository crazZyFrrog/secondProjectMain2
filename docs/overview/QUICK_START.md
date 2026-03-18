# 🚀 Quick Start - Landing Constructor

## 📁 Структура проекта

```
secondProject/
├── frontend/          # React приложение
├── backend/           # FastAPI + SQLite
└── README.md
```

## ⚡ Быстрый запуск

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте: **http://localhost:5173/**

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python seed_db.py
python -m uvicorn main:app --reload --port 5001
```

Документация API: **http://localhost:5001/docs**

## 📋 Основные команды

### Frontend

```bash
# Разработка
npm run dev

# Сборка
npm run build

# Превью сборки
npm run preview

# Проверка TypeScript
npx tsc --noEmit
```

## 🎯 Что уже работает

✅ **12 страниц:**
- Главная с демо-шаблоном
- Авторизация и регистрация
- Галерея шаблонов (6 шт)
- Тарифы
- Дашборд с проектами
- Редактор проекта
- Превью лендинга
- Экспорт документов
- AI-генерация (UI)
- Настройки аккаунта

✅ **Функции:**
- Mock авторизация (любой email/пароль)
- Создание и редактирование проектов
- Сохранение в localStorage
- Адаптивный дизайн
- Dropdown меню профиля (закрывается по клику вне и Escape)

## 🔑 Тестовый вход

Используйте сид‑данные (создаются при первом запуске бэкенда):

| Роль     | Email              | Пароль    |
|----------|--------------------|-----------|
| user     | demo@example.com   | demo1234  |
| manager  | manager@example.com| manager1234 |
| admin    | admin@example.com  | admin1234 |

## 📚 Документация

- `README.md` - Главная документация
- `frontend/README.md` - Детали фронтенда
- `frontend/STRUCTURE.md` - Описание всех страниц
- `backend/README.md` - Документация по бэкенду

## 🛠 Технологии

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Zustand

**Backend:**
- FastAPI + Uvicorn
- SQLite
- JWT‑подобные токены

---

**Версия:** V2  
**Порт:** http://localhost:5173/  
**Статус:** ✅ Работает
