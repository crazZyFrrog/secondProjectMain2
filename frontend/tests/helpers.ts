import { Page } from '@playwright/test';

/**
 * Утилиты для работы с авторизацией в тестах
 */

export const TEST_USER = {
  email: 'testforexample@example.com',
  password: 'password1234',
};

/**
 * Авторизация пользователя
 */
export async function login(page: Page, email: string = TEST_USER.email, password: string = TEST_USER.password) {
  await page.goto('/login');
  
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  
  await page.click('button[type="submit"], button:has-text("Войти")');
  
  // Ждём успешной авторизации
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Выход из системы
 */
export async function logout(page: Page) {
  const logoutButton = page.locator(
    'button:has-text("Выход"), a:has-text("Выход"), [data-testid="logout"]'
  ).first();
  
  await logoutButton.click();
  await page.waitForTimeout(1000);
}

/**
 * Очистка сессии (выход без UI)
 */
export async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Создание проекта
 */
export async function createProject(page: Page, name: string, description?: string) {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  // Нажимаем "Создать проект"
  await page.click('a:has-text("Создать проект")');
  await page.waitForURL(/\/projects\/new/);
  await page.waitForLoadState('networkidle');

  // Заполняем название
  const nameInput = page.locator('input[type="text"][placeholder*="Например"]').first();
  await nameInput.fill(name);

  // Выбираем шаблон
  const templateCard = page.locator('div.cursor-pointer').first();
  await templateCard.click();
  await page.waitForTimeout(500);

  // Создаём проект
  const createButton = page.locator('button:has-text("Создать проект")');
  await createButton.click();
  
  // Создание проекта - async операция, ждём возврата на dashboard
  await page.waitForTimeout(2000);
}

/**
 * Генерация уникального имени проекта
 */
export function generateProjectName(prefix: string = 'Тестовый проект'): string {
  return `${prefix} ${Date.now()}`;
}

/**
 * Генерация уникального email
 */
export function generateEmail(prefix: string = 'user'): string {
  return `${prefix}${Date.now()}@example.com`;
}
