import { test, expect } from '@playwright/test';

/**
 * Тест: Пользователь регистрируется и попадает в свой личный кабинет
 */
test.describe('Регистрация пользователя', () => {
  test('Пользователь регистрируется и попадает в свой личный кабинет', async ({ page }) => {
    // Генерируем ДЕЙСТВИТЕЛЬНО уникальный email с миллисекундами и случайным числом
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const testEmail = `user${timestamp}${random}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = `Тестовый Пользователь ${random}`;

    // Переходим на страницу регистрации
    await page.goto('/signup');
    
    // Проверяем, что мы на странице регистрации
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.locator('h1, h2, h3')).toContainText(/создать аккаунт|регистрац|sign up/i);

    // Заполняем ВСЕ поля формы регистрации
    // Поле "Имя"
    const nameField = page.locator('input[name="name"], input[name="fullName"], input[placeholder*="Иван"]');
    if (await nameField.count() > 0) {
      await nameField.fill(testName);
    }

    // Email
    await page.fill('input[type="email"], input[name="email"]', testEmail);
    
    // Пароль
    await page.fill('input[type="password"], input[name="password"]', testPassword);
    
    // Поле подтверждения пароля (обязательное!)
    const confirmPasswordFields = page.locator('input[type="password"]');
    const passwordFieldsCount = await confirmPasswordFields.count();
    
    if (passwordFieldsCount > 1) {
      // Если есть два поля пароля, второе - подтверждение
      await confirmPasswordFields.nth(1).fill(testPassword);
    }

    // Если есть чекбокс соглашения
    const agreementCheckbox = page.locator('input[type="checkbox"]');
    if (await agreementCheckbox.count() > 0) {
      await agreementCheckbox.check();
    }

    // Отправляем форму
    await page.click('button[type="submit"], button:has-text("Регистр")');

    // Ждем перенаправления в личный кабинет с увеличенным таймаутом
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Проверяем, что мы попали в защищенную зону
    const url = page.url();
    expect(url).toMatch(/\/dashboard/);

    // Проверяем наличие элементов личного кабинета
    const hasUserElements = await page.locator('h1:has-text("Привет"), button').count();
    expect(hasUserElements).toBeGreaterThan(0);
  });
});
