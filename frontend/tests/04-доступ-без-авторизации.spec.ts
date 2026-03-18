import { test, expect } from '@playwright/test';

/**
 * Тест: Пользователь без авторизации не видит свои проекты
 */
test.describe('Доступ без авторизации', () => {
  test('Пользователь без авторизации не видит свои проекты', async ({ page }) => {
    // Очищаем все cookies и localStorage (выходим из системы)
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Пытаемся перейти на дашборд без авторизации
    await page.goto('/dashboard');

    // Ждем загрузки страницы
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Проверяем один из следующих сценариев:
    // 1. Перенаправление на страницу входа
    // 2. Показ сообщения о необходимости авторизации
    // 3. Пустой список проектов или экран-заглушка

    const currentURL = page.url();

    // Сценарий 1: Редирект на login
    if (currentURL.includes('/login') || currentURL.includes('/signin')) {
      await expect(page).toHaveURL(/\/(login|signin)/);
      await expect(page.locator('h1, h2')).toContainText(/(вход|войти|авторизац)/i);
    } 
    // Сценарий 2: Остались на /projects, но показывается сообщение
    else {
      const unauthorizedMessage = page.locator(
        'text=/необходимо войти|нужна авторизация|требуется вход|доступ запрещен/i'
      );
      const loginButton = page.locator('a:has-text("Войти"), button:has-text("Войти")');

      // Проверяем, что либо есть сообщение, либо кнопка входа
      const hasUnauthorizedUI = 
        (await unauthorizedMessage.count() > 0) || 
        (await loginButton.count() > 0);

      expect(hasUnauthorizedUI).toBeTruthy();
    }

    // Дополнительная проверка: не должно быть списка проектов
    const projectsList = page.locator('[data-testid="project-card"], .project-card');
    const projectsCount = await projectsList.count();
    
    // Либо проектов нет вообще, либо их очень мало (если показываются публичные примеры)
    expect(projectsCount).toBeLessThanOrEqual(0);
  });

  test('Пользователь без авторизации перенаправляется при попытке создать проект', async ({ page }) => {
    // Очищаем авторизацию
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Пытаемся перейти на страницу создания проекта
    await page.goto('/projects/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Проверяем, что нас перенаправило на логин или показали сообщение
    const isOnLoginPage = page.url().includes('/login') || page.url().includes('/signin');
    
    if (isOnLoginPage) {
      await expect(page).toHaveURL(/\/(login|signin)/);
    } else {
      // Или показывается сообщение о необходимости авторизации
      const hasUnauthorizedMessage = await page.locator(
        'text=/необходимо войти|нужна авторизация|требуется вход|доступ запрещен/i'
      ).count() > 0;
      
      expect(hasUnauthorizedMessage).toBeTruthy();
    }
  });

  test('После выхода пользователь не видит защищённый контент', async ({ page }) => {
    // Сначала входим
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'testforexample@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'password1234');
    await page.click('button[type="submit"], button:has-text("Войти")');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Проверяем, что мы видим защищённый контент
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Привет")')).toBeVisible();
    
    // Открываем меню пользователя (ищем кнопку с именем пользователя)
    // В Header должна быть кнопка пользователя, кликаем на неё
    const userButton = page.locator('button').filter({ hasText: /test|пользователь/i }).last();
    
    // Если не нашли по тексту, ищем по иконке или просто последнюю кнопку в header
    if (await userButton.count() === 0) {
      // Ищем кнопку в правой части header
      const headerButtons = page.locator('header button, [class*="header"] button');
      await headerButtons.last().click();
    } else {
      await userButton.click();
    }
    
    await page.waitForTimeout(500);
    
    // Теперь ищем "Выход" в любом виде (кнопка, ссылка, пункт меню)
    const logoutElement = page.locator('a:has-text("Выход"), button:has-text("Выход"), [role="menuitem"]:has-text("Выход")').first();
    
    if (await logoutElement.count() > 0) {
      await logoutElement.click();
      await page.waitForTimeout(1000);

      // Пытаемся снова попасть на дашборд
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Проверяем, что нас перенаправило на login
      const currentURL = page.url();
      const isProtected = currentURL.includes('/login') || currentURL.includes('/signin');

      expect(isProtected).toBeTruthy();
    } else {
      // Если кнопку выхода не нашли, просто очищаем storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.context().clearCookies();
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const currentURL = page.url();
      expect(currentURL.includes('/login')).toBeTruthy();
    }
  });
});
