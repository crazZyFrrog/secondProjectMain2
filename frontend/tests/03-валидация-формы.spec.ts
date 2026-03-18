import { test, expect } from '@playwright/test';

/**
 * Тест: Пользователь не может отправить форму с пустым обязательным полем
 */
test.describe('Валидация формы', () => {
  test.beforeEach(async ({ page }) => {
    // Переходим на страницу входа
    await page.goto('/login');

    // Авторизуемся
    await page.fill('input[type="email"], input[name="email"]', 'testforexample@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'password1234');
    await page.click('button[type="submit"], button:has-text("Войти")');

    // Ждем авторизации
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('Пользователь не может отправить форму с пустым обязательным полем', async ({ page }) => {
    // Переходим на страницу создания проекта
    await page.goto('/projects/new');
    await page.waitForLoadState('networkidle');

    // Находим обязательное поле (название проекта)
    const nameInput = page.locator('input[type="text"][placeholder*="Например"]').first();
    
    // Убеждаемся, что поле пустое
    await nameInput.clear();
    await nameInput.fill('');
    await nameInput.blur(); // Убираем фокус для триггера валидации

    // Пытаемся отправить форму (нажимаем кнопку создания)
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Создать"), button:has-text("Продолжить")'
    ).first();
    
    // Проверяем что кнопка disabled или получаем ошибку валидации
    const isDisabled = await submitButton.getAttribute('disabled');
    
    if (isDisabled === null) {
      // Если кнопка не disabled, пробуем нажать
      await submitButton.click();
      await page.waitForTimeout(500);
    }

    // Проверяем HTML5 валидацию или кастомное сообщение об ошибке
    const isRequired = await nameInput.getAttribute('required');
    const validationMessage = await nameInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    const errorMessage = await page.locator('[class*="error"], [class*="invalid"], .text-red-500, .text-danger').count();

    // Проверяем, что есть какая-то валидация
    const hasValidation = isRequired !== null || validationMessage !== '' || errorMessage > 0 || isDisabled !== null;
    expect(hasValidation).toBeTruthy();

    // Форма должна быть все еще видна (не произошло перехода)
    await expect(nameInput).toBeVisible();
  });

  test('Валидация формы регистрации - пустой email', async ({ page }) => {
    // Выходим из системы
    await page.goto('/');
    
    // Переходим на страницу регистрации
    await page.goto('/signup');

    // Оставляем email пустым, заполняем только пароль
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    await emailInput.clear();
    await passwordInput.fill('TestPassword123!');

    // Пытаемся отправить форму
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Проверяем валидацию
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    const isRequired = await emailInput.getAttribute('required');

    expect(isRequired !== null || validationMessage !== '').toBeTruthy();

    // Проверяем, что мы остались на странице регистрации
    await expect(page).toHaveURL(/.*signup/);
  });
});
