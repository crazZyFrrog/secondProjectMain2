import { test, expect } from '@playwright/test';

/**
 * Простой тест для проверки настройки Playwright
 * Запустите этот тест первым, чтобы убедиться что всё работает
 */
test.describe('Проверка настройки', () => {
  test('Приложение доступно и главная страница загружается', async ({ page }) => {
    // Переходим на главную страницу
    await page.goto('/');

    // Проверяем, что страница загрузилась
    await expect(page).toHaveTitle(/Landing Constructor|Конструктор/i);

    // Проверяем наличие основных элементов
    const hasContent = await page.locator('body').count();
    expect(hasContent).toBeGreaterThan(0);

    // Логируем для отладки
    console.log('✅ Приложение доступно');
    console.log('URL:', page.url());
  });

  test('Страница входа доступна', async ({ page }) => {
    // Переходим на страницу входа
    await page.goto('/login');

    // Проверяем URL
    await expect(page).toHaveURL(/.*login/);

    // Проверяем наличие формы входа
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    console.log('✅ Страница входа работает корректно');
  });

  test('Backend API доступен', async ({ request }) => {
    // Проверяем доступность backend
    const response = await request.get('http://localhost:5001/docs');
    
    expect(response.status()).toBe(200);
    console.log('✅ Backend доступен на http://localhost:5001');
  });
});
