# Инструкция по запуску Playwright Tests

## ✅ GitHub Actions работает!

Вы видите workflows в левом меню - это значит, что Actions включен и работает корректно.

---

## 🚀 Как запустить Playwright Tests прямо сейчас:

### Вариант 1: Через интерфейс GitHub (РЕКОМЕНДУЕТСЯ)

1. **Откройте:** https://github.com/crazZyFrrog/secondProjectMain2/actions

2. **В левом меню нажмите на:**
   ```
   .github/workflows/playwright.yml
   ```
   (это и есть "Playwright Tests")

3. **Справа появится кнопка "Run workflow"** (серая кнопка)

4. **Нажмите "Run workflow"**

5. **В выпадающем меню:**
   - Branch: `main` (должно быть выбрано по умолчанию)
   - **Нажмите зелёную кнопку "Run workflow"**

6. **Обновите страницу** (F5 или Ctrl+R)

7. **Должен появиться новый запуск** с жёлтым кружком 🟡 (выполняется)

---

### Вариант 2: Через push (автоматически)

Я могу создать и отправить пустой коммит, который автоматически запустит workflow:

```bash
git commit --allow-empty -m "ci: trigger Playwright tests"
git push origin main
```

Это запустит оба workflow:
- Test Workflow (быстрый, ~30 секунд)
- Playwright Tests (основной, ~3-5 минут)

---

## 📊 Что смотреть в логах

Когда Playwright Tests запустится, откройте его и следите за шагами:

### Критические шаги для проверки:

#### ✅ Шаг "Start Backend"
Ищите:
```
=== Creating additional users ===
✓ Created user: testforexample@example.com (user)

=== Verifying test user ===
✓ Test user found:
  Email: testforexample@example.com
  Username: Test User
```

#### ✅ Шаг "Check Backend"
Ищите:
```
2. Testing /api/auth/login endpoint...
Response: {"token":"eyJ..."}
✓ Login endpoint works!

3. Checking database for test user...
✓ Test user found: ('testforexample@example.com', 'Test User', 'user')
```

#### ✅ Шаг "Run Playwright tests"
Ищите:
```
15 passed
✓ All tests passed!
```

---

## 🎯 Что говорят результаты

### Если всё зелёное ✅
- Проблема была в окружении CI (БД, пользователь, таймауты)
- Детальное логирование помогло всё настроить правильно
- Тесты работают и локально, и в CI

### Если есть красные ❌
- В логах "Check Backend" будет точная причина ошибки
- Детальный traceback покажет, где именно упало
- Backend.log будет выведен автоматически при ошибке

---

## Хотите, чтобы я запустил через push?

Если хотите, я могу прямо сейчас:
1. Создать пустой коммит
2. Отправить его в GitHub
3. Это автоматически запустит Playwright Tests

Или вы предпочитаете запустить вручную через кнопку "Run workflow"?
