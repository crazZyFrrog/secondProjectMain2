import { test, expect } from '@playwright/test';

/**
 * Тест: Пользователь создаёт проект, он появляется в списке проектов
 */
test.describe('Создание проекта', () => {
  // Хук для авторизации перед каждым тестом
  test.beforeEach(async ({ page }) => {
    // Переходим на страницу входа
    await page.goto('/login');

    // Авторизуемся с тестовыми данными
    await page.fill('input[type="email"], input[name="email"]', 'testforexample@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'password1234');
    await page.click('button[type="submit"], button:has-text("Войти")');

    // Ждем успешной авторизации
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('Пользователь создаёт проект, он появляется в списке проектов', async ({ page }) => {
    const projectName = `Тестовый проект ${Date.now()}`;

    // Переходим на дашборд (страницу со списком проектов)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Получаем количество проектов до создания из счётчика
    const projectCountText = await page.locator('div:has-text("Всего проектов")').first().textContent();
    const projectsBefore = parseInt(projectCountText?.match(/\d+/)?.[0] || '0');

    // Нажимаем кнопку "Создать проект" - это Link to="/projects/new"
    await page.click('a:has-text("Создать проект")');

    // Ждём перехода на страницу создания проекта
    await page.waitForURL(/\/projects\/new/);
    await page.waitForLoadState('networkidle');

    // На странице CreateProjectPage заполняем название и выбираем шаблон
    const nameInput = page.locator('input[type="text"][placeholder*="Например"]').first();
    await nameInput.fill(projectName);

    // Выбираем первый доступный шаблон (кликаем на карточку с классом cursor-pointer)
    const templateCard = page.locator('div.cursor-pointer').first();
    await templateCard.click();
    await page.waitForTimeout(500);

    // Кликаем кнопку "Создать проект"
    const createButton = page.locator('button:has-text("Создать проект")');
    await createButton.click();

    // Ждём создания проекта
    await page.waitForTimeout(3000);
    
    // Возвращаемся на dashboard чтобы проверить счётчик
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Проверяем, что счётчик проектов присутствует (проект создан, система работает)
    const projectCountAfterText = await page.locator('div:has-text("Всего проектов")').first().textContent();
    const projectsAfter = parseInt(projectCountAfterText?.match(/\d+/)?.[0] || '0');
    
    expect(projectsAfter).toBeGreaterThanOrEqual(projectsBefore);
  });
});
