import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { config } from './config.js';
import { STATES, getSession, clearSession } from './states.js';
import { startScenario1, handleScenario1Text, handleScenario1Callback } from './handlers/scenario1.js';
import { startScenario2, handleScenario2Callback } from './handlers/scenario2.js';
import { ensureHeaders } from './services/sheets.js';

if (!config.botToken) {
  console.error('❌ BOT_TOKEN не задан в .env');
  process.exit(1);
}

const bot = new Telegraf(config.botToken);

// ─── Главное меню ───────────────────────────────────────────────────────────

function mainMenuKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📅 Записаться на встречу', 'menu:book')],
    [Markup.button.callback('❓ Часто задаваемые вопросы', 'menu:faq')],
  ]);
}

async function showMainMenu(ctx) {
  clearSession(ctx.chat.id);
  await ctx.reply(
    '👋 Добро пожаловать!\n\nЧем могу помочь?',
    mainMenuKeyboard()
  );
}

// ─── Команды ────────────────────────────────────────────────────────────────

bot.start(showMainMenu);
bot.command('menu', showMainMenu);
bot.command('myid', (ctx) =>
  ctx.reply(`Ваш chat_id: ${ctx.chat.id}`)
);

// ─── Callback-обработчики (кнопки) ─────────────────────────────────────────

bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data === 'menu:book') {
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined);
    clearSession(ctx.chat.id);
    return startScenario1(ctx);
  }

  if (data === 'menu:faq') {
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined);
    clearSession(ctx.chat.id);
    return startScenario2(ctx);
  }

  // Сценарий 1 (product:, slot:, confirm:, cancel)
  const s1Prefixes = ['product:', 'slot:', 'confirm:', 'cancel'];
  if (s1Prefixes.some((p) => data.startsWith(p))) {
    return handleScenario1Callback(ctx, showMainMenu);
  }

  // Сценарий 2 (faq:)
  if (data.startsWith('faq:')) {
    return handleScenario2Callback(ctx, startScenario1, showMainMenu);
  }

  await ctx.answerCbQuery('Неизвестная команда.');
});

// ─── Текстовые сообщения — диспетчер по состоянию ───────────────────────────

bot.on('text', async (ctx) => {
  const session = getSession(ctx.chat.id);

  const s1States = [
    STATES.S1_NAME,
    STATES.S1_COMPANY,
    STATES.S1_DESC,
    STATES.S1_PHONE,
    STATES.S1_EMAIL,
    STATES.S1_DATETIME,
  ];

  if (s1States.includes(session.state)) {
    return handleScenario1Text(ctx);
  }

  // В FAQ теперь только кнопки — свободный текст возвращает в меню
  if (session.state === STATES.S2_FAQ) {
    await ctx.reply('Пожалуйста, выберите вопрос из списка выше или вернитесь в меню: /menu');
    return;
  }

  await showMainMenu(ctx);
});

// ─── Запуск ─────────────────────────────────────────────────────────────────

async function main() {
  try {
    await ensureHeaders();
  } catch (err) {
    console.warn('Не удалось проверить заголовки Google Sheets:', err.message);
  }

  await bot.launch();
  console.log('✅ Бот запущен. Нажмите Ctrl+C для остановки.');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main();
