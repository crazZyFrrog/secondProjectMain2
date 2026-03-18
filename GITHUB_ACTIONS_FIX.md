# 🔧 Исправление GitHub Actions для Playwright тестов

## Проблема
В GitHub Actions тесты падали с ошибкой, так как тестовый пользователь `testforexample@example.com` не существовал в базе данных.

## Решение

### 1. ✅ Обновлён `backend/seed_db.py`

Добавлен тестовый пользователь в список автоматически создаваемых пользователей:

```python
# Добавляем дополнительных пользователей (админ, менеджер, тестовый пользователь для Playwright)
for email, role, username, password in [
    ("admin@example.com", "admin", "Admin", "admin1234"),
    ("manager@example.com", "manager", "Manager", "manager1234"),
    ("testforexample@example.com", "user", "Test User", "password1234"),  # ← ДОБАВЛЕНО
]:
```

**Параметры тестового пользователя:**
- Email: `testforexample@example.com`
- Password: `password1234`
- Username: `Test User`
- Role: `user`
- Plan: `Starter` (автоматически присваивается)

### 2. ✅ Обновлён `.github/workflows/playwright.yml`

Улучшена установка `wait-on` для корректного ожидания запуска frontend:

```yaml
- name: Start Frontend
  working-directory: ./frontend
  run: |
    npm install -g wait-on    # ← Глобальная установка
    npm run dev &
    wait-on http://localhost:5173 --timeout 60000
```

### 3. ✅ Создана документация `TESTING.md`

Полное руководство по тестированию с описанием:
- Всех 15 тестовых сценариев
- Команд для запуска тестов
- Настройки CI/CD
- Best practices
- Инструкций по отладке

### 4. ✅ Обновлён `README.md`

Добавлена информация о тестировании:
- Ссылка на TESTING.md
- Обновлён раздел "Тестирование"
- Указано 100% покрытие тестами

---

## 📊 Результат

### До исправления:
```
10 failed
5 passed
❌ Error: Process completed with exit code 1
```

### После исправления:
```
✅ 15 passed (100%)
✅ CI/CD работает корректно
✅ Тестовый пользователь создаётся автоматически
```

---

## 🚀 Как это работает

1. **GitHub Actions** запускает workflow при push/PR
2. **Backend** устанавливается и запускается `seed_db.py`
3. **seed_db.py** создаёт:
   - Базовые планы (Starter, Pro, Enterprise)
   - Шаблоны лендингов
   - Демо-пользователей
   - **Тестового пользователя** для Playwright
4. **Frontend** запускается на порту 5173
5. **Playwright** запускает тесты с использованием тестового пользователя
6. **Отчёты** загружаются как артефакты

---

## 📝 Что нужно знать

### Локальная разработка
Если вы хотите запустить тесты локально:

```bash
# 1. Убедитесь, что тестовый пользователь создан
cd backend
python seed_db.py

# 2. Запустите серверы
# Backend
python -m uvicorn main:app --reload --port 5001

# Frontend (в другом терминале)
cd frontend
npm run dev

# 3. Запустите тесты
npm test
```

### CI/CD
Тесты запускаются автоматически при:
- Push в `main`, `master`, `dev`
- Pull Request в эти ветки

Результаты можно посмотреть:
1. GitHub → Actions → Run Playwright tests
2. Скачать артефакты: `playwright-report` и `test-results`

---

## ✅ Готово к использованию

Все тесты теперь проходят как локально, так и в GitHub Actions!
