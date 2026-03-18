# 🧪 Тестирование проекта

## Playwright E2E тесты

Проект полностью покрыт end-to-end тестами на Playwright.

### ✅ Покрытие тестами

**15 тестов** покрывают все основные сценарии:

#### 1. Проверка настройки (3 теста)
- ✅ Приложение доступно и главная страница загружается
- ✅ Страница входа доступна
- ✅ Backend API доступен

#### 2. Регистрация пользователя (1 тест)
- ✅ Пользователь регистрируется и попадает в свой личный кабинет

#### 3. Создание проекта (1 тест)
- ✅ Пользователь создаёт проект, он появляется в списке проектов

#### 4. Валидация формы (2 теста)
- ✅ Пользователь не может отправить форму с пустым обязательным полем
- ✅ Валидация формы регистрации - пустой email

#### 5. Доступ без авторизации (3 теста)
- ✅ Пользователь без авторизации не видит свои проекты
- ✅ Пользователь без авторизации перенаправляется при попытке создать проект
- ✅ После выхода пользователь не видит защищённый контент

#### 6. Удаление проекта (2 теста)
- ✅ Пользователь удаляет проект, он исчезает из списка
- ✅ Отмена удаления проекта оставляет его в списке

#### 7. Редактирование проекта (3 теста)
- ✅ Пользователь редактирует уже существующие проекты
- ✅ Изменения в проекте отменяются при нажатии Отмена
- ✅ Редактирование нескольких полей проекта

---

## 🚀 Запуск тестов локально

### Предварительные требования

1. **Запущенный backend** на `http://localhost:5001`
2. **Запущенный frontend** на `http://localhost:5173`
3. **Тестовый пользователь** в базе данных:
   - Email: `testforexample@example.com`
   - Password: `password1234`

### Команды для запуска

```bash
# Из корня проекта
npm test                 # Запуск всех тестов
npm run test:headed      # Запуск с видимым браузером
npm run test:ui          # Запуск в UI режиме
npm run test:debug       # Запуск в режиме отладки
npm run test:report      # Открыть HTML отчёт

# Из папки frontend
cd frontend
npx playwright test                    # Все тесты
npx playwright test --headed           # С видимым браузером
npx playwright test --project=chromium # Только Chromium
npx playwright test --debug            # Режим отладки
npx playwright show-report             # HTML отчёт
```

### Создание тестового пользователя

Тестовый пользователь создаётся автоматически при запуске `seed_db.py`:

```bash
cd backend
python seed_db.py
```

Это создаст пользователя:
- **Email:** `testforexample@example.com`
- **Password:** `password1234`
- **Username:** `Test User`
- **Role:** `user`

---

## 🤖 CI/CD - GitHub Actions

Тесты автоматически запускаются в GitHub Actions при:
- Push в ветки `main`, `master`, `dev`
- Pull Request в эти ветки

### Workflow делает следующее:

1. ✅ Устанавливает Python 3.11 и зависимости backend
2. ✅ Запускает `seed_db.py` (создаёт тестового пользователя)
3. ✅ Запускает backend на порту 5001
4. ✅ Устанавливает Node.js 20 и зависимости frontend
5. ✅ Запускает frontend на порту 5173
6. ✅ Устанавливает Playwright с браузерами
7. ✅ Запускает все тесты
8. ✅ Загружает отчёты и скриншоты как артефакты

### Просмотр результатов

После выполнения workflow в GitHub Actions:
1. Перейдите во вкладку **Actions**
2. Выберите нужный workflow run
3. Скачайте артефакты:
   - `playwright-report` - HTML отчёт (всегда)
   - `test-results` - скриншоты и видео (только при ошибках)

---

## 📝 Структура тестов

```
frontend/tests/
├── 00-проверка-настройки.spec.ts    # Базовые проверки
├── 01-регистрация.spec.ts           # Регистрация пользователя
├── 02-создание-проекта.spec.ts      # Создание проектов
├── 03-валидация-формы.spec.ts       # Валидация форм
├── 04-доступ-без-авторизации.spec.ts # Проверка прав доступа
├── 05-удаление-проекта.spec.ts      # Удаление проектов
├── 06-редактирование-проекта.spec.ts # Редактирование проектов
└── helpers.ts                        # Вспомогательные функции
```

---

## 🔧 Конфигурация

### `playwright.config.ts`

```typescript
{
  testDir: './tests',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
}
```

### Ключевые настройки:
- **baseURL**: `http://localhost:5173`
- **timeout**: 30 секунд на тест
- **screenshot**: Только при ошибках
- **video**: Только при ошибках
- **retries**: 2 попытки в CI, 0 локально

---

## 🐛 Отладка тестов

### Режим отладки
```bash
npx playwright test --debug
```

### Просмотр трассировки
```bash
npx playwright show-trace test-results/trace.zip
```

### Headed режим (видимый браузер)
```bash
npx playwright test --headed
```

### UI Mode (интерактивный режим)
```bash
npx playwright test --ui
```

---

## 📊 Метрики покрытия

- **Всего тестов:** 15
- **Успешность:** 100%
- **Браузеры:** Chromium, Firefox, WebKit
- **Среднее время выполнения:** ~20 секунд
- **Параллельность:** 6 воркеров (локально), 1 воркер (CI)

---

## 🎯 Best Practices

1. ✅ Используйте тестового пользователя `testforexample@example.com`
2. ✅ Генерируйте уникальные данные (timestamp + random)
3. ✅ Проверяйте авторизацию перед тестами
4. ✅ Используйте `waitForLoadState('networkidle')`
5. ✅ Добавляйте таймауты для асинхронных операций
6. ✅ Сохраняйте screenshots при ошибках
7. ✅ Запускайте тесты перед каждым commit

---

## 📚 Документация Playwright

- [Официальная документация](https://playwright.dev/)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
