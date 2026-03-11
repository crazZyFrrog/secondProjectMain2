# Backend - Landing Constructor API

Бэкенд для конструктора лендингов на FastAPI. Хранение данных — в памяти.

## Стек

- **FastAPI** + **Uvicorn**
- **In-memory** хранилище (без БД)

## Структура

```
backend/
├── main.py
├── requirements.txt
└── README.md
```

## Запуск

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
set PORT=5001
uvicorn main:app --reload --port 5001
```

Откройте документацию: http://localhost:5001/docs

## API Endpoints

### Auth
- `POST /auth/register` - Регистрация клиента
- `POST /auth/login` - Вход (токен)
- `POST /auth/logout` - Выход

### Клиенты
- `GET /clients/me` - Профиль текущего клиента
- `PATCH /clients/me/plan` - Выбор тарифа

### Тарифы
- `GET /plans` - Список тарифов
- `GET /plans/{plan_id}` - Детали тарифа
- `POST /plans` - Создать тариф
- `PATCH /plans/{plan_id}` - Обновить тариф
- `DELETE /plans/{plan_id}` - Удалить тариф

## Примечания

- Все данные хранятся в памяти и теряются при перезапуске.
- Авторизация по `Authorization: Bearer <token>`.
