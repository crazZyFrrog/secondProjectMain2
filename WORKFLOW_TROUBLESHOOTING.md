# Как запустить и проверить GitHub Actions Workflow

## 🚀 Способ 1: Автоматический запуск (должен сработать после последнего push)

Workflow должен автоматически запуститься после push в ветку `main`.

**Проверьте здесь:**
https://github.com/crazZyFrrog/secondProjectMain2/actions

Если вы видите запущенный workflow "Playwright Tests" - переходите к разделу "Как читать логи".

---

## 🔧 Способ 2: Ручной запуск (если автоматический не сработал)

Я добавил возможность ручного запуска workflow.

### Шаги:

1. **Откройте страницу Actions:**
   https://github.com/crazZyFrrog/secondProjectMain2/actions

2. **Найдите workflow "Playwright Tests"** в левом меню

3. **Нажмите на него**

4. **Справа увидите кнопку "Run workflow"** (должна появиться после последнего push)

5. **Нажмите "Run workflow"** → выберите ветку `main` → **"Run workflow"**

6. **Обновите страницу** - появится новый запуск

---

## 📊 Как читать логи диагностики

Когда workflow запустится, откройте его и следите за следующими шагами:

### ✅ Шаг 1: "Start Backend"
**Что искать:**
```
=== Initializing database ===
=== Creating additional users ===
✓ Created user: testforexample@example.com (user)

=== Verifying test user ===
✓ Test user found:
  ID: <uuid>
  Email: testforexample@example.com
  Username: Test User
  Role: user

✓ Seed completed.
```

**Если видите ошибку:**
- `✗ app.db NOT FOUND!` → проблема с созданием БД
- `✗ Test user NOT found!` → seed_db.py не создал пользователя

---

### ✅ Шаг 2: "Check Backend"
**Что искать:**
```
=== Waiting for backend to be ready ===
✓ Backend is responding!

=== Testing API endpoints ===
1. Testing /docs endpoint...
<!doctype html>

2. Testing /api/auth/login endpoint...
Response: {"token":"eyJ..."}
✓ Login endpoint works!

3. Checking database for test user...
✓ Test user found: ('testforexample@example.com', 'Test User', 'user')
```

**Если видите ошибку:**
- `✗ Login endpoint returned an error!` → backend выдает 500
- `✗ Test user NOT found in database!` → пользователь не создался
- `[LOGIN] Unexpected error:` → проблема в backend/main.py

---

### ✅ Шаг 3: "Verify Servers"
**Что искать:**
```
=== Final Server Verification ===
1. Backend health check...
✓ Backend OK
2. Frontend health check...
✓ Frontend OK

✓ All servers are ready for tests!
```

---

### ✅ Шаг 4: "Run Playwright tests"
**Что искать:**
```
=== Starting Playwright tests ===
15 passed
✓ All tests passed!
```

**Если видите ошибку:**
- В конце будет вывод backend.log с детальными логами
- Проверьте строки с `[LOGIN]` или `[REGISTER]`

---

## 🔍 Если workflow все равно не запускается

### Возможные причины:

1. **GitHub Actions отключен в репозитории**
   - Settings → Actions → General → "Allow all actions"

2. **Workflow файл не виден GitHub**
   - Проверьте, что файл находится по пути: `.github/workflows/playwright.yml`
   - Убедитесь, что в репозитории на GitHub видна папка `.github`

3. **Синтаксическая ошибка в YAML**
   - GitHub покажет красный крестик или предупреждение
   - Проверьте вкладку "Actions" на наличие ошибок валидации

4. **Лимиты GitHub Actions исчерпаны**
   - Бесплатный план: 2000 минут/месяц
   - Проверьте: Settings → Billing → Actions

---

## 📥 Альтернатива: Запустить workflow локально

Если GitHub Actions не работает, можно протестировать workflow локально с помощью `act`:

### Установка act (Windows):
```bash
winget install nektos.act
```

### Запуск:
```bash
act push --workflows .github/workflows/playwright.yml
```

---

## 💡 Текущий статус

**Последние коммиты:**
- `c0eaafd` - chore: trigger workflow (пустой коммит для триггера)
- `b71f6a1` - feat: add workflow_dispatch trigger for manual runs
- `2f2c554` - fix: correct YAML syntax for Python inline script
- `ad43b5a` - fix: add comprehensive debugging for GitHub Actions CI

**Что было сделано:**
1. ✅ Добавлено детальное логирование в seed_db.py
2. ✅ Добавлена проверка API endpoints в workflow
3. ✅ Исправлен YAML синтаксис
4. ✅ Добавлен ручной триггер workflow_dispatch
5. ✅ Создан пустой коммит для принудительного запуска

**Следующий шаг:**
Проверьте https://github.com/crazZyFrrog/secondProjectMain2/actions прямо сейчас!
