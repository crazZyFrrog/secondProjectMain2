# 🔍 Отладка GitHub Actions - Пошаговая инструкция

## Что было сделано для исправления ошибки

### ✅ Улучшения в `.github/workflows/playwright.yml`

#### 1. **Добавлена проверка доступности Backend**
```yaml
- name: Check Backend
  run: |
    echo "Waiting for backend to be ready..."
    timeout 30 bash -c 'until curl -s http://localhost:5001/docs > /dev/null; do sleep 1; done'
    echo "Backend is ready!"
    curl -s http://localhost:5001/docs | head -n 20
```

#### 2. **Добавлена проверка базы данных**
```yaml
- name: Start Backend
  working-directory: ./backend
  run: |
    echo "Initializing database..."
    python seed_db.py
    echo "Database initialized"
    ls -la data/  # Проверяем что БД создана
```

#### 3. **Добавлена финальная верификация серверов**
```yaml
- name: Verify Servers
  run: |
    echo "Checking Backend..."
    curl -f http://localhost:5001/docs || exit 1
    echo "Checking Frontend..."
    curl -f http://localhost:5173 || exit 1
    echo "All servers are running!"
```

#### 4. **Улучшено логирование тестов**
```yaml
- name: Run Playwright tests
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Playwright version: $(npx playwright --version)"
    echo "Starting Playwright tests..."
    npx playwright test --project=chromium --reporter=list,html
```

#### 5. **Исправлены пути к артефактам**
```yaml
- uses: actions/upload-artifact@v4
  with:
    path: frontend/playwright-report/  # Было: playwright-report/
```

---

## 📊 Как проверить результаты в GitHub

### Шаг 1: Перейти в Actions
1. Откройте репозиторий на GitHub
2. Перейдите во вкладку **Actions**
3. Найдите последний workflow run с именем "Playwright Tests"

### Шаг 2: Просмотреть логи
Кликните на workflow run и разверните каждый шаг:

#### Критичные шаги для проверки:
- ✅ **Start Backend** - должно быть "Database initialized" и "Starting backend server..."
- ✅ **Check Backend** - должно быть "Backend is ready!" и вывод HTML от /docs
- ✅ **Start Frontend** - должно быть "Frontend is ready"
- ✅ **Verify Servers** - оба сервера должны ответить 200 OK
- ✅ **Run Playwright tests** - должно быть "15 passed"

### Шаг 3: Скачать артефакты (если тесты упали)
Внизу страницы workflow run есть раздел **Artifacts**:
- **playwright-report** (всегда) - HTML отчёт со всеми тестами
- **test-results** (только при ошибках) - скриншоты и видео

---

## 🐛 Частые проблемы и решения

### Проблема 1: Backend не запускается
**Симптомы:**
```
timeout 30 bash -c '...'
Error: Process completed with exit code 124
```

**Решение:**
- Проверьте что `requirements.txt` содержит все зависимости
- Проверьте что `seed_db.py` выполняется без ошибок
- Увеличьте timeout с 30 до 60 секунд

### Проблема 2: Frontend не запускается
**Симптомы:**
```
wait-on http://localhost:5173 --timeout 60000
Error: Timeout exceeded
```

**Решение:**
- Проверьте что `npm ci` установил все зависимости
- Проверьте что порт 5173 свободен
- Добавьте `--verbose` к команде `wait-on` для отладки

### Проблема 3: Тесты падают с "testforexample@example.com" ошибкой
**Симптомы:**
```
Error: User not found
Error: Invalid credentials
```

**Решение:**
- ✅ Проверьте что `seed_db.py` содержит создание тестового пользователя
- ✅ Убедитесь что БД успешно инициализирована (проверьте логи "Database initialized")
- ✅ Проверьте что файл `backend/data/app.db` создан (используйте `ls -la data/`)

### Проблема 4: Артефакты не загружаются
**Симптомы:**
```
Warning: No files were found with the provided path
```

**Решение:**
- Исправьте путь на `frontend/playwright-report/` вместо `playwright-report/`
- Убедитесь что тесты запускаются в правильной директории (`working-directory: ./frontend`)

---

## 🧪 Локальное тестирование CI окружения

Чтобы воспроизвести CI окружение локально:

```bash
# 1. Очистите БД
rm backend/data/app.db

# 2. Инициализируйте БД
cd backend
python seed_db.py
ls -la data/  # Проверьте что app.db создана

# 3. Запустите backend
python -m uvicorn main:app --port 5001 &
sleep 5
curl http://localhost:5001/docs  # Должен вернуть HTML

# 4. Установите зависимости frontend
cd frontend
npm ci

# 5. Запустите frontend
npm run dev &
npx wait-on http://localhost:5173 --timeout 60000
curl http://localhost:5173  # Должен вернуть HTML

# 6. Запустите тесты
npx playwright test --project=chromium --reporter=list,html
```

---

## 📝 Чеклист перед push

Перед отправкой изменений в GitHub проверьте:

- [ ] ✅ Тесты проходят локально (`npm test`)
- [ ] ✅ `seed_db.py` создаёт тестового пользователя
- [ ] ✅ Backend запускается без ошибок
- [ ] ✅ Frontend запускается без ошибок
- [ ] ✅ `playwright.config.ts` указывает правильный `baseURL`
- [ ] ✅ В workflow есть все необходимые шаги проверки
- [ ] ✅ Пути к артефактам корректны

---

## 🎯 Ожидаемый результат

После всех исправлений GitHub Actions должен показать:

```
✅ Set up Python
✅ Install Python dependencies
✅ Start Backend
✅ Check Backend - Backend is ready!
✅ Set up Node.js
✅ Install Frontend dependencies
✅ Start Frontend - Frontend is ready
✅ Verify Servers - All servers are running!
✅ Install Playwright Browsers
✅ Run Playwright tests - 15 passed (100%)
```

**Exit code: 0** ✅

---

## 📞 Дополнительная помощь

Если проблема не решена:

1. **Скачайте артефакты** из GitHub Actions
2. **Откройте `playwright-report`** - там будут видео и скриншоты
3. **Проверьте логи каждого шага** в GitHub Actions
4. **Запустите тесты локально** с теми же параметрами что и в CI

---

## 🔗 Полезные ссылки

- [GitHub Actions Logs](https://github.com/crazZyFrrog/secondProjectMain2/actions)
- [Playwright Documentation](https://playwright.dev/)
- [Debugging in CI](https://playwright.dev/docs/ci)
