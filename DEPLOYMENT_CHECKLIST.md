# 📋 Чеклист подготовки к деплою

Этот документ содержит краткий список всех изменений, внесённых для подготовки проекта к деплою.

## ✅ Выполненные изменения

### 1. Backend - Поддержка PostgreSQL

**Файлы:**
- ✅ `backend/db.py` - добавлена поддержка PostgreSQL через psycopg2
- ✅ `backend/requirements.txt` - добавлен psycopg2-binary

**Описание:**
- Автоматическое определение типа БД через переменную `DATABASE_URL`
- SQLite для локальной разработки (по умолчанию)
- PostgreSQL для продакшена (если задан DATABASE_URL)
- Совместимость SQL-запросов между обеими БД

### 2. Backend - CORS для продакшена

**Файлы:**
- ✅ `backend/main.py` - обновлена настройка CORS middleware

**Описание:**
- CORS теперь использует переменную окружения `FRONTEND_URL`
- Поддержка нескольких доменов через запятую
- По умолчанию: `http://localhost:5173` для локальной разработки

### 3. Frontend - Динамический API URL

**Файлы:**
- ✅ `frontend/src/api/apiClient.ts` - добавлена поддержка `VITE_API_URL`

**Описание:**
- В разработке: использует прокси Vite (`/api`)
- В продакшене: использует `VITE_API_URL` из переменных окружения
- Плавный переход между локальной и продакшен-средой

### 4. Конфигурационные файлы окружения

**Файлы:**
- ✅ `backend/.env.example` - шаблон переменных для backend
- ✅ `frontend/.env.example` - шаблон переменных для frontend
- ✅ `frontend/.env.production` - продакшен-конфиг для frontend

**Описание:**
- Документированы все необходимые переменные окружения
- Примеры значений для быстрой настройки
- Разделение на development и production

### 5. Deployment конфигурации

**Файлы:**
- ✅ `backend/Dockerfile` - Docker-образ для backend
- ✅ `backend/.dockerignore` - исключения для Docker
- ✅ `backend/amvera.yml` - конфигурация для Amvera.io
- ✅ `vercel.json` - конфигурация для Vercel (frontend)
- ✅ `railway.json` - конфигурация для Railway (backend)

**Описание:**
- Готовые конфигурации для популярных платформ деплоя
- Оптимизированные Docker-образы
- Автоматическое определение PORT через переменные окружения

### 6. Документация

**Файлы:**
- ✅ `DEPLOYMENT.md` - **главное руководство по деплою**
- ✅ `backend/README.md` - обновлённая документация backend
- ✅ `README.md` - обновлён с ссылкой на DEPLOYMENT.md

**Описание:**
- Пошаговые инструкции для 4 вариантов деплоя
- Vercel + Amvera (рекомендуется)
- Vercel + Railway
- Timeweb Cloud (всё в одном)
- VDS/VPS (полный контроль)
- Раздел устранения проблем
- Таблицы сравнения платформ

## 🎯 Что можно делать сейчас

### Локальная разработка
Ничего не изменилось! Проект работает как раньше:
```bash
# Backend
cd backend
.venv\Scripts\activate
python -m uvicorn main:app --reload --port 5001

# Frontend
cd frontend
npm run dev
```

### Деплой в продакшен
Теперь можно задеплоить на любую платформу:

1. **Быстрый старт**: следуйте инструкции в [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Выберите вариант**: Vercel+Amvera, Railway, Timeweb или VDS
3. **Настройте переменные**: используйте `.env.example` как шаблон
4. **Задеплойте**: следуйте пошаговой инструкции для выбранной платформы

## 📝 Важные замечания

### Переменные окружения

**Backend (обязательно для продакшена):**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - случайный ключ 32+ символа
- `FRONTEND_URL` - URL вашего фронтенда

**Frontend (обязательно для продакшена):**
- `VITE_API_URL` - URL вашего бекенда с `/api` на конце

### Миграция с SQLite на PostgreSQL

При первом деплое с PostgreSQL:
1. Создайте базу данных на хостинге
2. Установите `DATABASE_URL`
3. Запустите backend - таблицы создадутся автоматически
4. Данные из локального SQLite НЕ переносятся автоматически

### CORS настройки

После деплоя:
1. Задеплойте фронтенд, получите URL
2. Обновите `FRONTEND_URL` в настройках бекенда
3. Перезапустите бекенд

## 🔍 Проверка изменений

### Проверить поддержку PostgreSQL:
```bash
cd backend
# Установите DATABASE_URL с PostgreSQL
python -c "from db import get_connection; print(type(get_connection()))"
# Должно показать psycopg2.extensions.connection
```

### Проверить CORS:
```bash
cd backend
# Посмотреть текущие настройки
python -c "import os; print(os.getenv('FRONTEND_URL', 'http://localhost:5173'))"
```

### Проверить API URL во фронтенде:
```bash
cd frontend
# В production сборке
npm run build
# Проверить что VITE_API_URL используется
grep -r "VITE_API_URL" dist/ || echo "Using default /api"
```

## 🚀 Следующие шаги

1. **Выберите платформу деплоя** из [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Создайте базу данных PostgreSQL** на выбранной платформе
3. **Настройте переменные окружения** используя `.env.example`
4. **Задеплойте backend**, получите URL
5. **Обновите VITE_API_URL** для frontend
6. **Задеплойте frontend**
7. **Обновите FRONTEND_URL** в backend
8. **Протестируйте**: регистрация, создание проекта, все функции

## 📚 Дополнительные ресурсы

- [DEPLOYMENT.md](./DEPLOYMENT.md) - полное руководство по деплою
- [backend/README.md](./backend/README.md) - документация backend API
- [frontend/README.md](./frontend/README.md) - документация frontend
- [backend/.env.example](./backend/.env.example) - шаблон переменных backend
- [frontend/.env.example](./frontend/.env.example) - шаблон переменных frontend

---

**Дата подготовки:** 2026-03-18  
**Статус:** ✅ Готов к деплою  
**Протестировано:** Локально работает, конфигурации созданы
