import { defineConfig, devices } from '@playwright/test';

/**
 * Конфигурация Playwright для тестирования Landing Constructor
 */
export default defineConfig({
  testDir: './tests',
  
  // Максимальное время для каждого теста
  timeout: 30 * 1000,
  
  // Ожидание действий
  expect: {
    timeout: 5000
  },
  
  // Запуск тестов
  fullyParallel: true,
  
  // Повтор упавших тестов
  retries: process.env.CI ? 2 : 0,
  
  // Количество параллельных workers
  workers: process.env.CI ? 1 : undefined,
  
  // Репортер
  reporter: 'html',
  
  // Общие настройки для всех проектов
  use: {
    // Базовый URL приложения
    baseURL: 'http://localhost:5173',
    
    // Скриншоты при падении
    screenshot: 'only-on-failure',
    
    // Видео при падении
    video: 'retain-on-failure',
    
    // Трейс при падении
    trace: 'on-first-retry',
  },

  // Настройка проектов (браузеров)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Веб-сервер для запуска перед тестами (опционально)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
